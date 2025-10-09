/**
 * Tests for evaluation framework with implementation plan context
 */
import { evaluateCode, loadPattern, loadCalibration } from '../index'
import * as fs from 'fs'
import * as path from 'path'

describe('Evaluation with Implementation Plan', () => {
  const fixturesPath = path.join(__dirname, 'fixtures')
  const implementationPlanPath = path.join(fixturesPath, 'implementation-plan.md')
  const aggregatePath = path.join(fixturesPath, 'OccupierUser.aggregate.ts')

  let implementationPlan: string
  let aggregateCode: string

  beforeAll(() => {
    // Load fixtures
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    aggregateCode = fs.readFileSync(aggregatePath, 'utf8')
  })

  describe('OccupierUser Aggregate Evaluation', () => {
    it('should score above 4.5 when all tactics are correctly implemented', async () => {
      // Load pattern and calibration
      const pattern = loadPattern('domain', 'ddd-aggregates', 'v1')
      const calibration = loadCalibration('ddd-aggregates', 'v1')

      // Evaluate the aggregate with implementation plan context
      const result = await evaluateCode({
        code: aggregateCode,
        codePath: aggregatePath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      // Assert overall score is good
      expect(result.overall_score).toBeGreaterThan(4.5)

      // Assert pattern evaluation passed
      expect(result.llm_judge).toHaveLength(1)
      const judgeResult = result.llm_judge[0]

      expect(judgeResult.overall_pattern_score).toBeGreaterThan(4.5)
      expect(judgeResult.constraints_passed).toBe(true)

      // Critical tactics should all score well (excluding N/A tactics with score -1)
      const criticalTactics = judgeResult.tactic_scores.filter(t => t.priority === 'critical')
      const applicableCriticalTactics = criticalTactics.filter(t => t.score !== -1)

      // Should have at least some applicable critical tactics
      expect(applicableCriticalTactics.length).toBeGreaterThan(0)

      applicableCriticalTactics.forEach(tactic => {
        expect(tactic.score).toBeGreaterThanOrEqual(4)
      })
    })

    it('should include implementation plan context in evaluation', async () => {
      const pattern = loadPattern('domain', 'ddd-aggregates', 'v1')
      const calibration = loadCalibration('ddd-aggregates', 'v1')

      const result = await evaluateCode({
        code: aggregateCode,
        codePath: aggregatePath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      // Verify evaluation completed successfully
      expect(result.task_id).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(result.llm_judge).toHaveLength(1)

      // Check that critical event registration tactic is evaluated
      const registerEventsTactic = result.llm_judge[0].tactic_scores.find(
        t => t.tactic_name === 'Register event handlers in constructor'
      )
      expect(registerEventsTactic).toBeDefined()

      // Should score high because both event handlers are registered
      expect(registerEventsTactic!.score).toBeGreaterThanOrEqual(4)
    })

    it('should provide recommendations when all requirements met', async () => {
      const pattern = loadPattern('domain', 'ddd-aggregates', 'v1')
      const calibration = loadCalibration('ddd-aggregates', 'v1')

      const result = await evaluateCode({
        code: aggregateCode,
        codePath: aggregatePath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      // Should have positive recommendation
      expect(result.recommendations).toBeDefined()
      expect(result.recommendations.length).toBeGreaterThan(0)

      // When score is high, should include success message
      if (result.overall_score > 4.5) {
        const hasSuccessMessage = result.recommendations.some(r =>
          r.includes('✅') || r.includes('excellent') || r.includes('meets')
        )
        expect(hasSuccessMessage).toBe(true)
      }
    })
  })

  describe('Evaluation without Implementation Plan', () => {
    it('should still work without implementation plan context', async () => {
      const pattern = loadPattern('domain', 'ddd-aggregates', 'v1')
      const calibration = loadCalibration('ddd-aggregates', 'v1')

      // Evaluate without implementation plan
      const result = await evaluateCode({
        code: aggregateCode,
        codePath: aggregatePath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1
        // No implementationPlan provided
      })

      // Should still produce valid results
      expect(result.overall_score).toBeGreaterThan(0)
      expect(result.llm_judge).toHaveLength(1)
      expect(result.llm_judge[0].tactic_scores.length).toBeGreaterThan(0)
    })
  })
})
