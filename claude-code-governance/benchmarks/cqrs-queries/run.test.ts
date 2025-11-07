/**
 * CQRS Queries Pattern Benchmarks
 *
 * These benchmarks verify that the evaluation framework correctly scores
 * CQRS query handler pattern compliance across different quality levels.
 *
 * Purpose:
 * 1. Validate evaluation accuracy (good code scores high, poor code scores low)
 * 2. Detect regressions in pattern scoring
 * 3. Enable pattern version comparison (v1 vs v2)
 */
import { evaluateCode, loadPattern, loadCalibration } from '../../evaluation/src/index'
import * as fs from 'fs'
import * as path from 'path'

describe('CQRS Queries Benchmarks', () => {
  const fixturesPath = path.join(__dirname, 'fixtures')
  const implementationPlanPath = path.join(__dirname, 'implementation-plan.md')
  const excellentHandlerPath = path.join(fixturesPath, 'excellent/GetOccupierByIdQueryHandler.ts')
  const poorMutatesStatePath = path.join(fixturesPath, 'poor/QueryMutatesState.ts')
  const poorReturnsAggregatePath = path.join(fixturesPath, 'poor/QueryReturnsAggregate.ts')

  let implementationPlan: string
  let excellentCode: string
  let poorMutatesStateCode: string
  let poorReturnsAggregateCode: string
  let pattern: any
  let calibration: any

  beforeAll(() => {
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    excellentCode = fs.readFileSync(excellentHandlerPath, 'utf8')
    poorMutatesStateCode = fs.readFileSync(poorMutatesStatePath, 'utf8')
    poorReturnsAggregateCode = fs.readFileSync(poorReturnsAggregatePath, 'utf8')
    pattern = loadPattern('application', 'cqrs', 'v1')
    calibration = loadCalibration('cqrs', 'v1')
  })

  describe('Excellent Fixtures', () => {
    it('should score correctly implemented query handler above 4.5', async () => {
      const result = await evaluateCode({
        code: excellentCode,
        codePath: excellentHandlerPath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      expect(result.overall_score).toBeGreaterThan(4.5)
      expect(result.llm_judge[0].overall_pattern_score).toBeGreaterThan(4.5)
      expect(result.llm_judge[0].constraints_passed).toBe(true)

      const hasSuccessMessage = result.recommendations.some(r => r.includes('✅'))
      expect(hasSuccessMessage).toBe(true)
    })
  })

  describe('Poor Fixtures', () => {
    it('should detect state mutation in query and score below 4.0', async () => {
      const result = await evaluateCode({
        code: poorMutatesStateCode,
        codePath: poorMutatesStatePath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      expect(result.overall_score).toBeLessThan(4.0)

      const lowScoringTactics = result.llm_judge[0].tactic_scores.filter(
        t => t.score > 0 && t.score <= 3
      )
      expect(lowScoringTactics.length).toBeGreaterThan(0)

      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should detect aggregate return type violation and score below 4.0', async () => {
      const result = await evaluateCode({
        code: poorReturnsAggregateCode,
        codePath: poorReturnsAggregatePath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      expect(result.overall_score).toBeLessThan(4.0)

      const lowScoringTactics = result.llm_judge[0].tactic_scores.filter(
        t => t.score > 0 && t.score <= 3
      )
      expect(lowScoringTactics.length).toBeGreaterThan(0)

      expect(result.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('N/A Tactics Handling', () => {
    it('should correctly exclude non-applicable tactics from scoring', async () => {
      const result = await evaluateCode({
        code: excellentCode,
        codePath: excellentHandlerPath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      const judgeResult = result.llm_judge[0]

      expect(result.overall_score).toBeGreaterThan(4.5)

      const applicableCriticalTactics = judgeResult.tactic_scores.filter(
        t => t.priority === 'critical' && t.score !== -1
      )
      applicableCriticalTactics.forEach(tactic => {
        expect(tactic.score).toBeGreaterThanOrEqual(4)
      })
    })
  })
})
