/**
 * Projectors Pattern Benchmarks
 *
 * These benchmarks verify that the evaluation framework correctly scores
 * event projector pattern compliance across different quality levels.
 */
import { evaluateCode, loadPattern, loadCalibration } from '../../evaluation/src/index'
import * as fs from 'fs'
import * as path from 'path'

describe('Projectors Benchmarks', () => {
  const fixturesPath = path.join(__dirname, 'fixtures')
  const implementationPlanPath = path.join(__dirname, 'implementation-plan.md')
  const excellentProjectorPath = path.join(fixturesPath, 'excellent/OccupierProjector.ts')
  const poorValidationPath = path.join(fixturesPath, 'poor/ProjectorWithBusinessValidation.ts')
  const poorEmitsEventsPath = path.join(fixturesPath, 'poor/ProjectorEmitsDomainEvents.ts')

  let implementationPlan: string
  let excellentCode: string
  let poorValidationCode: string
  let poorEmitsEventsCode: string
  let pattern: any
  let calibration: any

  beforeAll(() => {
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    excellentCode = fs.readFileSync(excellentProjectorPath, 'utf8')
    poorValidationCode = fs.readFileSync(poorValidationPath, 'utf8')
    poorEmitsEventsCode = fs.readFileSync(poorEmitsEventsPath, 'utf8')
    pattern = loadPattern('application', 'projectors', 'v1')
    calibration = loadCalibration('projectors', 'v1')
  })

  describe('Excellent Fixtures', () => {
    it('should score correctly implemented projector above 4.5', async () => {
      const result = await evaluateCode({
        code: excellentCode,
        codePath: excellentProjectorPath,
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
    it('should detect business validation in projector and score at or below 4.0', async () => {
      const result = await evaluateCode({
        code: poorValidationCode,
        codePath: poorValidationPath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      expect(result.overall_score).toBeLessThanOrEqual(4.0)

      // Should have recommendations about the issues
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should detect domain event emission and score at or below 4.0', async () => {
      const result = await evaluateCode({
        code: poorEmitsEventsCode,
        codePath: poorEmitsEventsPath,
        patterns: [pattern],
        calibrations: [calibration],
        checkDeterministic: false,
        checkLLMJudge: true,
        multiPassCount: 1,
        implementationPlan
      })

      expect(result.overall_score).toBeLessThanOrEqual(4.0)

      // Should have recommendations about the issues
      expect(result.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('N/A Tactics Handling', () => {
    it('should correctly exclude non-applicable tactics from scoring', async () => {
      const result = await evaluateCode({
        code: excellentCode,
        codePath: excellentProjectorPath,
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
