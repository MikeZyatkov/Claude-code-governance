/**
 * Test evaluation with real code using Claude Code CLI
 */

import { evaluateCode, loadPattern, loadCalibration } from '../evaluation/src/index'
import { ClaudeCodeCLIAdapter } from '../evaluation/src/llm-judge/adapters/ClaudeCodeCLIAdapter'
import * as fs from 'fs'
import * as path from 'path'

async function testEvaluation() {
  console.log('=== Testing Evaluation Framework ===\n')

  // Load pattern and calibration
  const dddPattern = loadPattern('domain', 'ddd-aggregates', 'v1')
  const dddCalibration = loadCalibration('ddd-aggregates', 'v1')
  console.log(`Loaded pattern: ${dddPattern.pattern_name} (${dddPattern.version})`)

  // Sample code to evaluate (from workspace project)
  const workspacePath = path.join(__dirname, '../../workspace/contexts/tenant-management/domain/model/OccupierUser.aggregate.ts')

  let code: string
  if (fs.existsSync(workspacePath)) {
    console.log(`Loading code from: ${workspacePath}`)
    code = fs.readFileSync(workspacePath, 'utf8')
  } else {
    console.log('Workspace code not found, using sample code')
    code = getSampleCode()
  }

  console.log(`Code length: ${code.length} characters\n`)

  // Load implementation plan if available
  const implementationPlanPath = path.join(__dirname, '../../workspace/IMPLEMENTATION_PLAN.md')
  let implementationPlan: string | undefined
  if (fs.existsSync(implementationPlanPath)) {
    console.log(`Loading implementation plan from: ${implementationPlanPath}`)
    implementationPlan = fs.readFileSync(implementationPlanPath, 'utf8')
    console.log(`Implementation plan length: ${implementationPlan.length} characters\n`)
  } else {
    console.log('No implementation plan found - evaluation will proceed without it\n')
  }

  // Create CLI adapter
  const cliAdapter = new ClaudeCodeCLIAdapter()
  console.log(`Using adapter: ${cliAdapter.getName()}\n`)

  // Evaluate
  console.log('Starting evaluation...\n')

  const result = await evaluateCode({
    code,
    codePath: workspacePath,
    patterns: [dddPattern],
    calibrations: [dddCalibration],
    checkDeterministic: false, // Skip for now (not implemented)
    checkLLMJudge: true,
    multiPassCount: 1, // Use 1 pass for faster testing, increase to 3-5 for production
    implementationPlan // Pass the implementation plan for context
  })

  // Display results
  console.log('\n=== Evaluation Results ===\n')
  console.log(`Task ID: ${result.task_id}`)
  console.log(`Timestamp: ${result.timestamp}`)
  console.log(`Overall Score: ${result.overall_score}/5\n`)

  console.log('Pattern Evaluations:')
  result.llm_judge.forEach(judgeResult => {
    console.log(`\n  Pattern: ${judgeResult.pattern_name} (${judgeResult.pattern_version})`)
    console.log(`  Tactics Score: ${judgeResult.tactics_score}/5`)
    console.log(`  Constraints Passed: ${judgeResult.constraints_passed ? '✅' : '❌'}`)
    console.log(`  Overall Pattern Score: ${judgeResult.overall_pattern_score}/5`)
    console.log(`  Reasoning: ${judgeResult.reasoning}`)

    // Show tactic scores
    console.log('\n  Tactic Scores:')
    judgeResult.tactic_scores.forEach(tactic => {
      const emoji = tactic.score >= 4 ? '✅' : tactic.score >= 3 ? '⚠️' : '❌'
      console.log(`    ${emoji} ${tactic.tactic_name} (${tactic.priority}): ${tactic.score}/5`)
      if (tactic.score < 3) {
        console.log(`       ${tactic.reasoning}`)
      }
    })

    // Show constraint checks
    console.log('\n  Constraint Checks:')
    judgeResult.constraint_checks.forEach(constraint => {
      const emoji = constraint.status === 'PASS' ? '✅' :
                    constraint.status === 'EXCEPTION_ALLOWED' ? '⚠️' : '❌'
      console.log(`    ${emoji} ${constraint.constraint_rule}: ${constraint.status}`)
      if (constraint.status !== 'PASS') {
        console.log(`       ${constraint.reasoning}`)
      }
    })
  })

  console.log('\n📋 Recommendations:')
  result.recommendations.forEach(r => console.log(`  ${r}`))

  // Save results
  const resultsPath = path.join(__dirname, '../evaluation-results.json')
  fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2))
  console.log(`\n💾 Full results saved to: ${resultsPath}`)
}

function getSampleCode(): string {
  return `
import { AggregateRoot } from 'es-aggregates'
import { randomUUID } from 'crypto'
import { DomainError } from '../errors/DomainError'

export class Product extends AggregateRoot {
  public id: string

  private _name: string
  public get name(): string {
    return this._name
  }

  private _price: number
  public get price(): number {
    return this._price
  }

  constructor() {
    super()

    this.register('ProductCreated', (event: any) => {
      this.id = event.id
      this._name = event.name
      this._price = event.price
    })
  }

  public static create(name: string, price: number): Product {
    if (!name?.trim()) {
      throw new DomainError('Product name is required')
    }

    if (price <= 0) {
      throw new DomainError('Price must be greater than 0')
    }

    const product = new Product()
    const event = {
      type: 'ProductCreated',
      id: randomUUID(),
      name,
      price
    }

    product.applyChange(event)
    return product
  }
}
`
}

// Run the test
testEvaluation().catch(error => {
  console.error('Evaluation failed:', error)
  process.exit(1)
})
