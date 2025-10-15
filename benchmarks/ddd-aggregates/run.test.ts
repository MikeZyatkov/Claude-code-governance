/**
 * DDD Aggregates Pattern Benchmarks
 *
 * These benchmarks verify that the evaluation framework correctly scores
 * DDD Aggregates pattern compliance across different quality levels.
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

describe('DDD Aggregates Benchmarks', () => {
  const fixturesPath = path.join(__dirname, 'fixtures')
  const implementationPlanPath = path.join(__dirname, 'implementation-plan.md')
  const excellentAggregatePath = path.join(fixturesPath, 'excellent/OccupierUser.aggregate.ts')
  const poorAggregatePath = path.join(fixturesPath, 'poor/OccupierUser-missing-event-handler.aggregate.ts')

  let implementationPlan: string
  let excellentCode: string
  let poorCode: string
  let pattern: any
  let calibration: any

  beforeAll(() => {
    // Load fixtures once for all tests
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    excellentCode = fs.readFileSync(excellentAggregatePath, 'utf8')
    poorCode = fs.readFileSync(poorAggregatePath, 'utf8')
    pattern = loadPattern('domain', 'ddd-aggregates', 'v1')
    calibration = loadCalibration('ddd-aggregates', 'v1')
  })

  describe('Excellent Fixtures', () => {
    it('should score correctly implemented aggregate above 4.5', async () => {
      const result = await evaluateCode({
        code: excellentCode,
        codePath: excellentAggregatePath,
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
    it('should detect missing event handler and score below 4.5', async () => {
      const result = await evaluateCode({
        code: poorCode,
        codePath: poorAggregatePath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan // Plan should help detect this regression
      })

      // Main assertion: code with critical issue scores below "excellent" threshold
      // (This fixture is "acceptable with issues" rather than "poor" since only
      // one event handler is missing but rest of implementation is solid)
      expect(result.overall_score).toBeLessThan(4.5)

      // Should identify the specific problem (score <= 3 indicates issues)
      const registerEventsTactic = result.llm_judge[0].tactic_scores.find(
        t => t.tactic_name === 'Register event handlers in constructor'
      )
      expect(registerEventsTactic).toBeDefined()
      expect(registerEventsTactic!.score).toBeLessThanOrEqual(3)

      // Should have critical error recommendation
      const hasCriticalError = result.recommendations.some(r =>
        r.includes('🔴') || r.includes('Critical')
      )
      expect(hasCriticalError).toBe(true)
    })
  })

  describe('N/A Tactics Handling', () => {
    it('should correctly exclude non-applicable tactics from scoring', async () => {
      const result = await evaluateCode({
        code: excellentCode,
        codePath: excellentAggregatePath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      const judgeResult = result.llm_judge[0]

      // Should have some N/A tactics (entity-related tactics for simple aggregate)
      const naTactics = judgeResult.tactic_scores.filter(t => t.score === -1)
      expect(naTactics.length).toBeGreaterThan(0)

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
