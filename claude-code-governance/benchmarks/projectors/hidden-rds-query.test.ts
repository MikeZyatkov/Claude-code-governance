/**
 * Hidden RDS Query Test
 *
 * This test checks if the LLM can detect when an EventBridge projector
 * indirectly queries RDS projections through its publisher dependency.
 *
 * The violation is hidden one layer deep in the infrastructure adapter.
 */
import { evaluateCode, loadPattern, loadCalibration } from '../../evaluation/src/index'
import * as fs from 'fs'
import * as path from 'path'

describe('Hidden RDS Query in EventBridge Publisher', () => {
  const fixturePath = path.join(__dirname, 'fixtures/poor/EventBridgeProjectorWithHiddenRDSQuery.ts')
  const implementationPlanPath = path.join(__dirname, 'implementation-plan.md')

  let code: string
  let implementationPlan: string
  let pattern: any
  let calibration: any

  beforeAll(() => {
    code = fs.readFileSync(fixturePath, 'utf8')
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    pattern = loadPattern('application', 'projectors', 'v1')
    calibration = loadCalibration('projectors', 'v1')
  })

  it('should detect RDS query hidden in EventBridge publisher implementation', async () => {
    const result = await evaluateCode({
      code,
      codePath: fixturePath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan
    })

    console.log('\n=== EVALUATION RESULTS ===')
    console.log(`Overall Score: ${result.overall_score}`)
    console.log(`Constraints Passed: ${result.llm_judge[0].constraints_passed}`)
    console.log('\nRecommendations:')
    result.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`)
    })

    console.log('\nConstraint Results:')
    result.llm_judge[0].constraint_checks.forEach((constraint) => {
      console.log(`\n${constraint.constraint_rule}:`)
      console.log(`  Status: ${constraint.status}`)
      console.log(`  Reasoning: ${constraint.reasoning}`)
    })

    // The key question: Can the LLM detect this?
    // The code explicitly documents the violation in comments
    // But can the LLM understand the architectural implication?

    // Expected: Should detect the violation and score poorly
    // Reality: May pass because the projector itself looks clean
    console.log('\n=== TEST EXPECTATION ===')
    console.log('This projector has a HIDDEN violation:')
    console.log('- The projector code looks clean (no direct RDS query)')
    console.log('- But the publisher it depends on queries RDS (shown in comments)')
    console.log('- This violates separation of concerns at the architecture level')
    console.log('\nCan the LLM detect this indirect violation?')
    console.log(`Result: ${result.overall_score <= 4.0 ? 'YES - Detected' : 'NO - Missed'}`)

    // Note: This test may pass (score > 4.0) if LLM only evaluates the projector
    // code in isolation without considering the publisher implementation
    // That would indicate we need to update our evaluation approach to check
    // dependencies more thoroughly
  }, 300000)

  it('should flag the EventBridge projector constraint if it detects the hidden query', async () => {
    const result = await evaluateCode({
      code,
      codePath: fixturePath,
      patterns: [pattern],
      calibrations: [calibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1,
      implementationPlan
    })

    const eventBridgeConstraint = result.llm_judge[0].constraint_checks.find(
      (c: any) => c.constraint_rule.includes('EventBridge projectors MUST NOT query RDS projections')
    )

    console.log('\n=== EventBridge Constraint Check ===')
    if (eventBridgeConstraint) {
      console.log(`Rule: ${eventBridgeConstraint.constraint_rule}`)
      console.log(`Status: ${eventBridgeConstraint.status}`)
      console.log(`Reasoning: ${eventBridgeConstraint.reasoning}`)

      if (eventBridgeConstraint.status === 'FAIL') {
        console.log('\n✅ LLM successfully detected the hidden RDS query!')
      } else {
        console.log('\n⚠️  LLM did not detect the hidden RDS query')
        console.log('This suggests the violation is too subtle when hidden in dependencies')
      }
    } else {
      console.log('EventBridge constraint not found in results')
    }
  }, 300000)
})