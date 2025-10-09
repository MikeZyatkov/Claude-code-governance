/**
 * Integration tests for prompt effectiveness and evaluation pipeline
 *
 * These tests verify that changes to PromptBuilder or Evaluator logic work correctly.
 * They use real code fixtures and check that the evaluation pipeline:
 * 1. Scores good code highly
 * 2. Detects regressions and scores them low
 * 3. Uses implementation plan context to catch missing features
 *
 * These are regression tests for prompt engineering, not tests of individual tactics.
 */
import { evaluateCode, loadPattern, loadCalibration } from '../index'
import * as fs from 'fs'
import * as path from 'path'

describe('Evaluation Integration Tests', () => {
  const fixturesPath = path.join(__dirname, 'fixtures')
  const implementationPlanPath = path.join(fixturesPath, 'implementation-plan.md')
  const happyPathAggregatePath = path.join(fixturesPath, 'domain/happy-path/OccupierUser.aggregate.ts')
  const regressionAggregatePath = path.join(fixturesPath, 'domain/regression/OccupierUser-missing-event-handler.aggregate.ts')

  let implementationPlan: string
  let happyPathCode: string
  let regressionCode: string
  let pattern: any
  let calibration: any

  beforeAll(() => {
    // Load fixtures once for all tests
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    happyPathCode = fs.readFileSync(happyPathAggregatePath, 'utf8')
    regressionCode = fs.readFileSync(regressionAggregatePath, 'utf8')
    pattern = loadPattern('domain', 'ddd-aggregates', 'v1')
    calibration = loadCalibration('ddd-aggregates', 'v1')
  })

  describe('Happy Path: Correct Implementation', () => {
    it('should score correctly implemented aggregate above 4.5', async () => {
      const result = await evaluateCode({
        code: happyPathCode,
        codePath: happyPathAggregatePath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      // Main assertion: good code scores high
      expect(result.overall_score).toBeGreaterThan(4.5)
      expect(result.llm_judge[0].overall_pattern_score).toBeGreaterThan(4.5)
      expect(result.llm_judge[0].constraints_passed).toBe(true)

      // Should have success recommendation
      const hasSuccessMessage = result.recommendations.some(r => r.includes('✅'))
      expect(hasSuccessMessage).toBe(true)
    })
  })

  describe('Regression Detection: Missing Event Registration', () => {
    it('should detect missing event handler and score below 4.0', async () => {
      const result = await evaluateCode({
        code: regressionCode,
        codePath: regressionAggregatePath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan // Plan should help detect this regression
      })

      // Main assertion: regression scores low
      expect(result.overall_score).toBeLessThan(4.0)

      // Should identify the specific problem
      const registerEventsTactic = result.llm_judge[0].tactic_scores.find(
        t => t.tactic_name === 'Register event handlers in constructor'
      )
      expect(registerEventsTactic).toBeDefined()
      expect(registerEventsTactic!.score).toBeLessThan(3)

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
        code: happyPathCode,
        codePath: happyPathAggregatePath,
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
