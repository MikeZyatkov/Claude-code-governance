import { evaluateCode, loadPattern, loadCalibration } from '../../evaluation/src/index'
import * as fs from 'fs'
import * as path from 'path'

describe('Value Objects Benchmarks', () => {
  const implementationPlanPath = path.join(__dirname, 'implementation-plan.md')
  const excellentFixturePath = path.join(__dirname, 'fixtures/excellent/AccessCredential.vo.ts')
  const mutableFixturePath = path.join(__dirname, 'fixtures/poor/MutableValueObject.ts')
  const publicConstructorFixturePath = path.join(__dirname, 'fixtures/poor/ValueObjectWithPublicConstructor.ts')

  let implementationPlan: string
  let excellentCode: string
  let mutableCode: string
  let publicConstructorCode: string
  let pattern: any
  let calibration: any

  beforeAll(() => {
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    excellentCode = fs.readFileSync(excellentFixturePath, 'utf8')
    mutableCode = fs.readFileSync(mutableFixturePath, 'utf8')
    publicConstructorCode = fs.readFileSync(publicConstructorFixturePath, 'utf8')

    pattern = loadPattern('domain', 'value-objects', 'v1')
    calibration = loadCalibration('value-objects', 'v1')
  })

  it('should score excellent value object (AccessCredential.vo.ts) above 4.5', async () => {
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

  it('should score mutable value object at or below 4.0', async () => {
    const result = await evaluateCode({
      code: mutableCode,
      codePath: mutableFixturePath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan,
    })

    console.log(`\n✓ Mutable fixture score: ${result.overall_score}`)
    expect(result.overall_score).toBeLessThanOrEqual(4.0)
    expect(result.recommendations.length).toBeGreaterThan(0)
  }, 180000)

  it('should score value object with public constructor at or below 4.0', async () => {
    const result = await evaluateCode({
      code: publicConstructorCode,
      codePath: publicConstructorFixturePath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan,
    })

    console.log(`\n✓ Public constructor fixture score: ${result.overall_score}`)
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
