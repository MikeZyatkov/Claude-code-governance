import { evaluateCode, loadPattern, loadCalibration } from '../../evaluation/src/index'
import * as fs from 'fs'
import * as path from 'path'

describe('Repository Benchmarks', () => {
  const implementationPlanPath = path.join(__dirname, 'implementation-plan.md')
  const excellentFixturePath = path.join(__dirname, 'fixtures/excellent/IOccupierRepository.ts')
  const businessLogicPath = path.join(__dirname, 'fixtures/poor/RepositoryWithBusinessLogic.ts')
  const dtosPath = path.join(__dirname, 'fixtures/poor/RepositoryReturningDTOs.ts')

  let implementationPlan: string
  let excellentCode: string
  let businessLogicCode: string
  let dtosCode: string
  let pattern: any
  let calibration: any

  beforeAll(() => {
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    excellentCode = fs.readFileSync(excellentFixturePath, 'utf8')
    businessLogicCode = fs.readFileSync(businessLogicPath, 'utf8')
    dtosCode = fs.readFileSync(dtosPath, 'utf8')

    pattern = loadPattern('domain', 'repository', 'v1')
    calibration = loadCalibration('repository', 'v1')
  })

  it('should score excellent repository (IOccupierRepository.ts) above 4.5', async () => {
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

  it('should score repository with business logic at or below 4.0', async () => {
    const result = await evaluateCode({
      code: businessLogicCode,
      codePath: businessLogicPath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan,
    })

    console.log(`\n✓ Business logic fixture score: ${result.overall_score}`)
    expect(result.overall_score).toBeLessThanOrEqual(4.0)
    expect(result.recommendations.length).toBeGreaterThan(0)
  }, 180000)

  it('should score repository returning DTOs at or below 4.0', async () => {
    const result = await evaluateCode({
      code: dtosCode,
      codePath: dtosPath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan,
    })

    console.log(`\n✓ DTOs fixture score: ${result.overall_score}`)
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

    expect(result.overall_score).toBeGreaterThan(0)
  }, 180000)
})
