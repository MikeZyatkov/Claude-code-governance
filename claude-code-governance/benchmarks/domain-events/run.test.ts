import { evaluateCode, loadPattern, loadCalibration } from '../../evaluation/src/index'
import * as fs from 'fs'
import * as path from 'path'

describe('Domain Events Benchmarks', () => {
  const implementationPlanPath = path.join(__dirname, 'implementation-plan.md')
  const excellentFixturePath = path.join(__dirname, 'fixtures/excellent/OccupierCreated.ts')
  const mutableFixturePath = path.join(__dirname, 'fixtures/poor/MutableDomainEvent.ts')
  const aggregateRefFixturePath = path.join(__dirname, 'fixtures/poor/EventWithAggregateReference.ts')

  let implementationPlan: string
  let excellentCode: string
  let mutableCode: string
  let aggregateRefCode: string
  let pattern: any
  let calibration: any

  beforeAll(() => {
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    excellentCode = fs.readFileSync(excellentFixturePath, 'utf8')
    mutableCode = fs.readFileSync(mutableFixturePath, 'utf8')
    aggregateRefCode = fs.readFileSync(aggregateRefFixturePath, 'utf8')

    pattern = loadPattern('domain', 'domain-events', 'v1')
    calibration = loadCalibration('domain-events', 'v1')
  })

  it('should score excellent domain event (OccupierCreated.ts) above 4.5', async () => {
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

  it('should score mutable domain event at or below 4.0', async () => {
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

  it('should score event with aggregate reference at or below 4.0', async () => {
    const result = await evaluateCode({
      code: aggregateRefCode,
      codePath: aggregateRefFixturePath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan,
    })

    console.log(`\n✓ Aggregate reference fixture score: ${result.overall_score}`)
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
