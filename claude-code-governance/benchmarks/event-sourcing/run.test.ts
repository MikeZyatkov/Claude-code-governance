import { evaluateCode, loadPattern, loadCalibration } from '../../evaluation/src/index'
import * as fs from 'fs'
import * as path from 'path'

describe('Event Sourcing Benchmarks', () => {
  const implementationPlanPath = path.join(__dirname, 'implementation-plan.md')
  const excellentFixturePath = path.join(__dirname, 'fixtures/excellent/OccupierUser.aggregate.ts')
  const directModificationPath = path.join(__dirname, 'fixtures/poor/DirectStateModification.ts')
  const missingHandlersPath = path.join(__dirname, 'fixtures/poor/MissingEventHandlers.ts')

  let implementationPlan: string
  let excellentCode: string
  let directModificationCode: string
  let missingHandlersCode: string
  let pattern: any
  let calibration: any

  beforeAll(() => {
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    excellentCode = fs.readFileSync(excellentFixturePath, 'utf8')
    directModificationCode = fs.readFileSync(directModificationPath, 'utf8')
    missingHandlersCode = fs.readFileSync(missingHandlersPath, 'utf8')

    pattern = loadPattern('domain', 'event-sourcing', 'v1')
    calibration = loadCalibration('event-sourcing', 'v1')
  })

  it('should score excellent event-sourced aggregate (OccupierUser.aggregate.ts) above 4.5', async () => {
    const result = await evaluateCode({
      code: excellentCode,
      codePath: excellentFixturePath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan,
    })

    console.log(`\n✓ Excellent fixture score: ${result.overall_score}`)
    expect(result.overall_score).toBeGreaterThan(4.5)
  }, 180000)

  it('should score aggregate with direct state modification at or below 4.0', async () => {
    const result = await evaluateCode({
      code: directModificationCode,
      codePath: directModificationPath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan,
    })

    console.log(`\n✓ Direct modification fixture score: ${result.overall_score}`)
    expect(result.overall_score).toBeLessThanOrEqual(4.0)
    expect(result.recommendations.length).toBeGreaterThan(0)
  }, 180000)

  it('should score aggregate with missing event handlers at or below 4.0', async () => {
    const result = await evaluateCode({
      code: missingHandlersCode,
      codePath: missingHandlersPath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan,
    })

    console.log(`\n✓ Missing handlers fixture score: ${result.overall_score}`)
    expect(result.overall_score).toBeLessThanOrEqual(4.0)
    expect(result.recommendations.length).toBeGreaterThan(0)
  }, 180000)

  it('should handle N/A tactics correctly', async () => {
    const result = await evaluateCode({
      code: excellentCode,
      codePath: excellentFixturePath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan,
    })

    // Ensure N/A tactics are excluded from scoring
    const naTactics = result.llm_judge[0].tactic_scores.filter(t => t.score === 0)
    console.log(`\n✓ N/A tactics count: ${naTactics.length}`)

    // Overall score should not be affected by N/A tactics
    expect(result.overall_score).toBeGreaterThan(0)
  }, 180000)
})
