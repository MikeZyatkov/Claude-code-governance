/**
 * Basic usage example for the evaluation framework
 */

import { evaluateCode, loadPattern, listPatterns } from '../evaluation/src/index'

// Example 1: List all available patterns
function example1_listPatterns() {
  console.log('=== Example 1: List Available Patterns ===\n')

  const patterns = listPatterns()

  patterns.forEach(p => {
    console.log(`${p.category}/${p.name}`)
    console.log(`  Versions: ${p.versions.join(', ')}`)
  })
}

// Example 2: Load and inspect a pattern
function example2_loadPattern() {
  console.log('\n=== Example 2: Load Pattern ===\n')

  const pattern = loadPattern('domain', 'ddd-aggregates', 'v1')

  console.log(`Pattern: ${pattern.pattern_name} (${pattern.version})`)
  console.log(`\nGoal: ${pattern.goal.substring(0, 100)}...`)
  console.log(`\nTactics: ${pattern.tactics.length}`)
  console.log(`Constraints: ${pattern.constraints.length}`)

  console.log('\nCritical Tactics:')
  pattern.tactics
    .filter(t => t.priority === 'critical')
    .forEach(t => console.log(`  - ${t.name}`))
}

// Example 3: Evaluate code against patterns
async function example3_evaluateCode() {
  console.log('\n=== Example 3: Evaluate Code ===\n')

  // Sample code to evaluate (simplified Aggregate)
  const sampleCode = `
import { AggregateRoot } from 'es-aggregates'

export class Product extends AggregateRoot {
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
    this.register(ProductCreated.typename, (event: ProductCreated) => {
      this._name = event.name
      this._price = event.price
    })
  }

  public static create(name: string, price: number): Product {
    if (price <= 0) {
      throw new DomainError('Price must be greater than 0')
    }

    const product = new Product()
    const event = new ProductCreated(randomUUID(), name, price)
    product.applyChange(event)
    return product
  }
}
`

  // Load patterns
  const dddPattern = loadPattern('domain', 'ddd-aggregates', 'v1')
  const cqrsPattern = loadPattern('application', 'cqrs', 'v1')

  // Evaluate
  console.log('Evaluating code against patterns...\n')

  const result = await evaluateCode({
    code: sampleCode,
    patterns: [dddPattern, cqrsPattern],
    checkDeterministic: true,
    checkLLMJudge: true,
    multiPassCount: 3
  })

  // Display results
  console.log(`Task ID: ${result.task_id}`)
  console.log(`Overall Score: ${result.overall_score}/5`)

  console.log('\nDeterministic Checks:')
  console.log(`  Tests Passing: ${result.deterministic.tests_passing ? '✅' : '❌'}`)
  console.log(`  Linter Score: ${result.deterministic.linter_score}/100`)
  console.log(`  Type Check: ${result.deterministic.type_check_passing ? '✅' : '❌'}`)
  console.log(`  Security Issues: ${result.deterministic.security_issues.length}`)

  console.log('\nLLM Judge Results:')
  result.llm_judge.forEach(judgeResult => {
    console.log(`\n  Pattern: ${judgeResult.pattern_name} (${judgeResult.pattern_version})`)
    console.log(`    Tactics Score: ${judgeResult.tactics_score}/5`)
    console.log(`    Constraints Passed: ${judgeResult.constraints_passed ? '✅' : '❌'}`)
    console.log(`    Overall: ${judgeResult.overall_pattern_score}/5`)

    // Show low-scoring tactics
    const lowScoring = judgeResult.tactic_scores.filter(t => t.score < 3)
    if (lowScoring.length > 0) {
      console.log('\n    Low-Scoring Tactics:')
      lowScoring.forEach(t => {
        console.log(`      - ${t.tactic_name}: ${t.score}/5`)
        console.log(`        ${t.reasoning}`)
      })
    }
  })

  console.log('\nRecommendations:')
  result.recommendations.forEach(r => console.log(`  ${r}`))

  return result
}

// Run examples
async function main() {
  try {
    example1_listPatterns()
    example2_loadPattern()
    await example3_evaluateCode()
  } catch (error) {
    console.error('Error running examples:', error)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}