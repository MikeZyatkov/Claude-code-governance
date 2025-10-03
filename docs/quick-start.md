# Quick Start Guide

## Installation

```bash
# Clone the repository
git clone https://github.com/essensys/claude-code-governance.git
cd claude-code-governance

# Install dependencies
npm install

# Build evaluation framework
npm run build
```

## Using Patterns for Code Generation

### Step 1: Reference patterns in your project's CLAUDE.md

```markdown
# CLAUDE.md

## Architecture Patterns

This project follows patterns from our governance repository:

**Active Patterns**:
- [DDD Aggregates v1](link-to-pattern)
- [CQRS v1](link-to-pattern)

When implementing features:
1. Review applicable patterns
2. Follow tactics by priority (critical → important → optional)
3. Respect constraints and valid exceptions
```

### Step 2: Prompt Claude Code

```
Implement a new "CreateProduct" feature following:
- DDD Aggregates (v1)
- CQRS (v1)

Requirements:
- Product aggregate with name, price, inventory
- Command handler for creation
- Query handler for retrieval
- Domain validation for price > 0
```

Claude Code will:
1. Read the pattern definitions
2. Implement following tactics
3. Respect constraints
4. Generate code aligned with patterns

## Evaluating Generated Code

### Step 1: Create evaluation script

```typescript
// scripts/evaluate.ts
import { evaluateCode, loadPattern } from '@essensys/claude-patterns'
import * as fs from 'fs'

async function main() {
  // Load patterns
  const dddPattern = loadPattern('domain', 'ddd-aggregates', 'v1')
  const cqrsPattern = loadPattern('application', 'cqrs', 'v1')

  // Load generated code
  const code = fs.readFileSync('./src/domain/Product.aggregate.ts', 'utf8')

  // Evaluate
  const result = await evaluateCode({
    code,
    codePath: './src/domain/Product.aggregate.ts',
    patterns: [dddPattern, cqrsPattern],
    checkDeterministic: true,
    checkLLMJudge: true,
    llmApiKey: process.env.ANTHROPIC_API_KEY
  })

  // Display results
  console.log('\n=== Evaluation Results ===\n')
  console.log(`Overall Score: ${result.overall_score}/5`)
  console.log(`\nDeterministic Checks:`)
  console.log(`  Tests: ${result.deterministic.tests_passing ? '✅' : '❌'}`)
  console.log(`  Linter: ${result.deterministic.linter_score}/100`)
  console.log(`  Types: ${result.deterministic.type_check_passing ? '✅' : '❌'}`)

  console.log(`\nPattern Scores:`)
  result.llm_judge.forEach(p => {
    console.log(`  ${p.pattern_name}: ${p.overall_pattern_score}/5`)
  })

  console.log(`\nRecommendations:`)
  result.recommendations.forEach(r => console.log(`  ${r}`))

  // Save detailed results
  fs.writeFileSync(
    './evaluation-results.json',
    JSON.stringify(result, null, 2)
  )
}

main()
```

### Step 2: Run evaluation

```bash
export ANTHROPIC_API_KEY=your_api_key
npm run build
node scripts/evaluate.js
```

### Step 3: Review results

```
=== Evaluation Results ===

Overall Score: 4.3/5

Deterministic Checks:
  Tests: ✅
  Linter: 95/100
  Types: ✅

Pattern Scores:
  DDD Aggregates and Entities: 4.5/5
  CQRS: 4.2/5

Recommendations:
  ⚠️ Linter score is low (95/100) - address linting issues
  🔴 Critical tactic needs improvement (CQRS): Commands return only identifiers (score: 2/5)
```

## Example: A/B Testing Pattern Versions

```typescript
// scripts/compare-patterns.ts
import { evaluateCode, loadPattern } from '@essensys/claude-patterns'

async function comparePatternVersions() {
  const code = getGeneratedCode()

  // Test with v1
  const resultV1 = await evaluateCode({
    code,
    patterns: [loadPattern('domain', 'ddd-aggregates', 'v1')],
    checkLLMJudge: true
  })

  // Test with v2
  const resultV2 = await evaluateCode({
    code,
    patterns: [loadPattern('domain', 'ddd-aggregates', 'v2')],
    checkLLMJudge: true
  })

  console.log(`v1 Score: ${resultV1.overall_score}/5`)
  console.log(`v2 Score: ${resultV2.overall_score}/5`)
  console.log(`Improvement: ${resultV2.overall_score - resultV1.overall_score}`)
}
```

## Pattern Development Workflow

### 1. Create new pattern

```bash
mkdir -p patterns/domain/my-pattern
cp patterns/domain/ddd-aggregates/v1.yaml patterns/domain/my-pattern/v1.yaml
# Edit v1.yaml
```

### 2. Validate pattern structure

```bash
npm run validate-patterns
```

### 3. Test on real code

```typescript
const pattern = loadPattern('domain', 'my-pattern', 'v1')
const result = await evaluateCode({
  code: existingGoodCode,
  patterns: [pattern],
  checkLLMJudge: true
})

// Should score well on known-good code
console.log(`Score: ${result.overall_score}/5`)
```

### 4. Use for code generation

```
Claude Code: Implement feature X following my-pattern (v1)
```

### 5. Iterate based on results

If scores are too harsh or too lenient, adjust scoring rubrics.

## Integration with CI/CD

```yaml
# .github/workflows/evaluate-pr.yml
name: Pattern Evaluation

on: [pull_request]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install dependencies
        run: |
          npm install
          cd evaluation && npm install && npm run build

      - name: Run evaluation
        run: node scripts/evaluate-pr.js
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const results = require('./evaluation-results.json')
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              body: formatResults(results)
            })
```

## Next Steps

- [Framework Overview](framework-overview.md) - Understand the concepts
- [Pattern Authoring Guide](pattern-authoring.md) - Write your own patterns
- [Evaluation Guide](evaluation-guide.md) - Deep dive into evaluation
- [Integration Guide](integration.md) - Integrate with your workflow