/**
 * CQRS Commands Pattern Benchmarks
 *
 * These benchmarks verify that the evaluation framework correctly scores
 * CQRS command handler pattern compliance across different quality levels.
 *
 * Purpose:
 * 1. Validate evaluation accuracy (good code scores high, poor code scores low)
 * 2. Detect regressions in pattern scoring
 * 3. Enable pattern version comparison (v1 vs v2)
 *
 * These are benchmarks for pattern quality, not unit tests of the evaluator.
 */
import { evaluateCode, loadPattern, loadCalibration } from '../../evaluation/src/index'
import * as fs from 'fs'
import * as path from 'path'

describe('CQRS Commands Benchmarks', () => {
  const fixturesPath = path.join(__dirname, 'fixtures')
  const implementationPlanPath = path.join(__dirname, 'implementation-plan.md')
  const excellentHandlerPath = path.join(fixturesPath, 'excellent/CreateOccupierCommandHandler.ts')
  const poorBusinessLogicPath = path.join(fixturesPath, 'poor/CommandHandlerWithBusinessLogic.ts')
  const poorReturnsAggregatePath = path.join(fixturesPath, 'poor/CommandHandlerReturnsAggregate.ts')

  let implementationPlan: string
  let excellentCode: string
  let poorBusinessLogicCode: string
  let poorReturnsAggregateCode: string
  let pattern: any
  let calibration: any

  beforeAll(() => {
    // Load fixtures once for all tests
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    excellentCode = fs.readFileSync(excellentHandlerPath, 'utf8')
    poorBusinessLogicCode = fs.readFileSync(poorBusinessLogicPath, 'utf8')
    poorReturnsAggregateCode = fs.readFileSync(poorReturnsAggregatePath, 'utf8')
    pattern = loadPattern('application', 'cqrs', 'v1')
    calibration = loadCalibration('cqrs', 'v1')
  })

  describe('Excellent Fixtures', () => {
    it('should score correctly implemented command handler above 4.5', async () => {
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

      // Main assertion: excellent code scores high
      expect(result.overall_score).toBeGreaterThan(4.5)
      expect(result.llm_judge[0].overall_pattern_score).toBeGreaterThan(4.5)
      expect(result.llm_judge[0].constraints_passed).toBe(true)

      // Should have success recommendation
      const hasSuccessMessage = result.recommendations.some(r => r.includes('✅'))
      expect(hasSuccessMessage).toBe(true)
    })
  })

  describe('Poor Fixtures', () => {
    it('should detect business logic in handler and score below 4.5', async () => {
      const result = await evaluateCode({
        code: poorBusinessLogicCode,
        codePath: poorBusinessLogicPath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      // Main assertion: code with business logic violations scores below "excellent" threshold
      // Note: This fixture has business logic but maintains good structure otherwise (DI, error handling, etc.)
      // So it scores in the "good with issues" range (4.0-4.5) rather than "poor" (<4.0)
      expect(result.overall_score).toBeLessThan(4.5)
      expect(result.overall_score).toBeGreaterThanOrEqual(4.0)

      // Should have at least one tactic scoring 3 or below (indicating violation)
      const lowScoringTactics = result.llm_judge[0].tactic_scores.filter(
        t => t.score > 0 && t.score <= 3
      )
      expect(lowScoringTactics.length).toBeGreaterThan(0)

      // Should have recommendations about the issues
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

      // Main assertion: code with critical issue scores below threshold
      expect(result.overall_score).toBeLessThan(4.0)

      // Should have at least one tactic scoring 3 or below (indicating violation)
      const lowScoringTactics = result.llm_judge[0].tactic_scores.filter(
        t => t.score > 0 && t.score <= 3
      )
      expect(lowScoringTactics.length).toBeGreaterThan(0)

      // Should have recommendations about the issues
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

      // N/A tactics should not prevent high score
      expect(result.overall_score).toBeGreaterThan(4.5)

      // Applicable critical tactics should all score well
      const applicableCriticalTactics = judgeResult.tactic_scores.filter(
        t => t.priority === 'critical' && t.score !== -1
      )
      applicableCriticalTactics.forEach(tactic => {
        expect(tactic.score).toBeGreaterThanOrEqual(4)
      })
    })
  })
})
