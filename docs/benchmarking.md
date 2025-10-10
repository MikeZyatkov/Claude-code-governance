# Benchmarking Guide

## First Principles

### What Are Benchmarks?

**First Principle:** You can't improve what you can't measure.

**Benchmarks** are standardized test cases with **known expected outcomes** that let you:

1. **Validate** - Verify your evaluation system works correctly
2. **Detect Regressions** - Catch when changes break pattern scoring
3. **Compare** - Test different approaches (v1 vs v2 patterns, different LLMs)
4. **Prove ROI** - Show stakeholders objective quality improvements

### Problem Without Benchmarks

```
You: "I improved the DDD Aggregates pattern!"
Team: "How do you know it's better?"
You: "It feels better when I use it..."
Team: "🤔"
```

**Issues:**
- Subjective evaluation
- No way to prove improvement
- Can't detect if changes break things
- No confidence in updates

### With Benchmarks

```
You: "I improved the DDD Aggregates pattern!"
You: *runs benchmarks*

Results:
  v1: 12/15 tests passing, avg score 3.8/5.0
  v2: 14/15 tests passing, avg score 4.2/5.0 ✅ +0.4 improvement

You: "Here's the data. v2 is objectively better."
Team: "✅ Ship it!"
```

---

## Core Principles

### Principle 1: Known Ground Truth

**A benchmark must have a known correct answer.**

```typescript
// Bad: Ambiguous
{
  task: "Create a User class",
  expected: "good code"  // What does "good" mean?
}

// Good: Specific ground truth
{
  fixture: "User.aggregate.ts",
  expected_score: {
    min: 4.5,
    max: 5.0
  },
  expected_tactics: {
    "extend-aggregate-root": 5,
    "encapsulate-state": 5,
    "static-factory-creation": 5
  },
  expected_constraints: {
    all_passed: true
  }
}
```

### Principle 2: Repeatability

**Running the benchmark twice should give the same result.**

**Challenge with LLMs:** They're non-deterministic!

**Solution:** Don't benchmark generation (variable), benchmark **evaluation** (deterministic).

```typescript
// Don't benchmark this (non-deterministic):
async function badBenchmark() {
  const code = await llm.generate("Create User aggregate")
  const score = await evaluate(code)
  return score
}

// Benchmark this (deterministic):
async function goodBenchmark() {
  const knownGoodCode = fs.readFileSync('fixtures/excellent/User.aggregate.ts')
  const score = await evaluate(knownGoodCode)
  return score
}
```

**Key insight:** We benchmark the **evaluator's ability to score code**, not the LLM's ability to generate code.

### Principle 3: Coverage

**Benchmarks should cover the full spectrum of quality.**

```
Excellence:  5.0 ━━━━━━━━━━━━━━━━━━━━ Perfect implementation
Good:        4.5 ━━━━━━━━━━━━━━━━━━━━ Minor issues
Acceptable:  4.0 ━━━━━━━━━━━━━━━━━━━━ Threshold
Issues:      3.0 ━━━━━━━━━━━━━━━━━━━━ Some violations
Poor:        2.0 ━━━━━━━━━━━━━━━━━━━━ Many violations
Broken:      1.0 ━━━━━━━━━━━━━━━━━━━━ Fundamentally wrong
```

You need examples at each level to ensure your evaluator can distinguish them.

### Principle 4: Realism

**Benchmarks should reflect real-world code.**

```typescript
// Bad: Toy example
class User {
  name: string
}

// Good: Realistic complexity
class User extends AggregateRoot {
  private _email: Email
  private _roles: Map<string, Role>

  static create(email: Email, roles: Role[]): User {
    // Validation, events, etc.
  }

  assignRole(role: Role): void {
    // Business logic, invariants
  }
}
```

### Principle 5: Evolution

**Benchmarks should be versioned and grow over time.**

```
benchmarks/
  ddd-aggregates/
    v1.0-initial/     # 5 fixtures
    v1.1-edge-cases/  # 8 fixtures (added 3)
    v1.2-regression/  # 12 fixtures (added 4 from bugs)
```

---

## Current State: You Already Have Benchmarks!

### What You Have in `evaluation/src/__tests__/`

```
evaluation/src/__tests__/
├── evaluation-with-plan.test.ts
└── fixtures/
    ├── implementation-plan.md
    └── domain/
        ├── happy-path/
        │   └── OccupierUser.aggregate.ts        (Expected: 4.5+)
        └── regression/
            └── OccupierUser-missing-event-handler.aggregate.ts  (Expected: <4.0)
```

**This IS a benchmark suite!** You have:
- ✅ Fixtures with known ground truth (expected scores documented)
- ✅ Automated tests that verify evaluation works
- ✅ Regression detection (missing event handler should score low)
- ✅ Implementation plan context for evaluation

### Tests vs Benchmarks: Same Code, Different Purpose

**Tests** (`evaluation/src/__tests__/`)
- **Purpose:** Validate the evaluation framework code works
- **Question:** "Does my evaluator correctly score code?"
- **Run:** `npm test` (part of development)
- **Audience:** Framework developers

**Benchmarks** (should be in `benchmarks/`)
- **Purpose:** Track pattern quality over time, compare versions
- **Question:** "Is v2 pattern better than v1?" or "Did this change break anything?"
- **Run:** `npm run benchmark` (track over time)
- **Audience:** Pattern authors, stakeholders

**They're essentially the same fixtures and tests - just different framing and organization.**

---

## Why Move to `benchmarks/` Directory?

### Semantic Clarity

```
evaluation/src/__tests__/     # "Is my evaluation code working?"
  ↓ Developer-focused, testing the framework itself

benchmarks/                   # "Are my patterns effective?"
  ↓ Pattern-focused, measuring quality over time
```

**Current confusion:**
- `__tests__` implies "testing the evaluator code"
- But you're actually "benchmarking pattern quality"
- Mixed purpose → unclear intent

**After moving:**
- `benchmarks/` clearly signals: "measuring pattern effectiveness"
- `__tests__` can focus on: "testing framework logic"

### Better Organization as You Scale

**You'll have 12 patterns × multiple fixtures each:**

```
❌ Current (confusing):
evaluation/src/__tests__/
  fixtures/
    domain/
      ddd-aggregates/happy-path/
      ddd-aggregates/regression/
      value-objects/happy-path/
      value-objects/regression/
      domain-events/
      event-sourcing/
      repository/
    application/
      cqrs/
      projectors/
      domain-services/
    ...
  # Gets messy fast!

✅ After moving (clean):
benchmarks/
  ddd-aggregates/
    fixtures/
    run.test.ts
    baseline.json
  value-objects/
    fixtures/
    run.test.ts
    baseline.json
  cqrs/
    fixtures/
    run.test.ts
    baseline.json
  ...
  # Each pattern self-contained

evaluation/src/__tests__/
  evaluator.test.ts       # Unit test: scoring logic
  pattern-loader.test.ts  # Unit test: loading patterns
  # Focused on framework, not patterns
```

### Different Use Cases

**Tests** validate framework logic:
```typescript
// Does my evaluator calculate scores correctly?
describe('Evaluator', () => {
  it('should calculate weighted tactic scores', () => {
    const score = calculateTacticScore([...])
    expect(score).toBe(4.2)
  })

  it('should aggregate pattern scores', () => {
    const overall = aggregateScores([...])
    expect(overall).toBe(3.8)
  })
})
```

**Benchmarks** measure pattern quality:
```typescript
// Is this pattern effective? Is v2 better than v1?
describe('DDD Aggregates Pattern Quality', () => {
  it('should score excellent code highly', () => {
    const result = evaluate(excellentFixture, pattern)
    expect(result).toBeGreaterThan(4.5)
  })

  it('v2 should outperform v1', () => {
    const v1Score = evaluate(fixture, v1Pattern)
    const v2Score = evaluate(fixture, v2Pattern)
    expect(v2Score).toBeGreaterThan(v1Score)
  })
})
```

### Alignment with Documentation

You already have `docs/benchmarking.md` (this file!) that talks about benchmarks. It would be confusing if benchmarks lived in `__tests__/`.

**After moving:**
```markdown
# docs/benchmarking.md
See benchmarks/ directory for pattern quality benchmarks.
├── benchmarks/ddd-aggregates/    # ✅ Matches documentation
└── benchmarks/cqrs/
```

---

## Proposed Directory Structure

```
benchmarks/
├── ddd-aggregates/
│   ├── fixtures/
│   │   ├── excellent/
│   │   │   ├── OccupierUser.aggregate.ts              (4.8-5.0)
│   │   │   ├── Order-with-entities.aggregate.ts       (4.8-5.0)
│   │   │   └── README.md
│   │   ├── good/
│   │   │   ├── User-minor-issues.aggregate.ts         (4.0-4.5)
│   │   │   └── README.md
│   │   ├── acceptable/
│   │   │   ├── User-threshold.aggregate.ts            (3.8-4.2)
│   │   │   └── README.md
│   │   ├── poor/
│   │   │   ├── User-anemic.ts                         (1.5-2.5)
│   │   │   ├── User-missing-events.ts                 (2.0-3.0)
│   │   │   └── README.md
│   │   └── regression/
│   │       ├── OccupierUser-missing-event-handler.ts  (2.5-3.5)
│   │       └── README.md                              # From actual bugs
│   ├── implementation-plan.md                         # Context for evaluation
│   ├── run.test.ts                                    # Jest test file
│   ├── baseline.json                                  # Track scores over time
│   └── README.md
│
├── cqrs/
│   ├── fixtures/
│   │   ├── excellent/
│   │   │   ├── CreateUserCommandHandler.ts
│   │   │   ├── GetUserQueryHandler.ts
│   │   │   └── README.md
│   │   ├── poor/
│   │   │   ├── Handler-with-business-logic.ts
│   │   │   ├── Query-modifies-state.ts
│   │   │   └── README.md
│   │   └── regression/
│   ├── run.test.ts
│   ├── baseline.json
│   └── README.md
│
├── value-objects/
├── projectors/
├── domain-services/
├── ...
│
├── orchestration/                      # Multi-pattern integration benchmarks
│   ├── fixtures/
│   │   ├── full-feature/
│   │   │   ├── User.aggregate.ts
│   │   │   ├── CreateUserHandler.ts
│   │   │   ├── GetUserHandler.ts
│   │   │   └── UserProjector.ts
│   │   └── integration-issues/
│   ├── run.test.ts
│   └── README.md
│
├── compare-versions.ts                 # Compare v1 vs v2
├── baseline-all.json                   # Overall benchmark results
└── README.md

evaluation/src/__tests__/               # Unit tests for framework code
├── evaluator.test.ts                   # Test scoring algorithms
├── pattern-loader.test.ts              # Test pattern loading
├── llm-judge.test.ts                   # Test LLM evaluation
└── deterministic.test.ts               # Test AST checks
```

---

## Building Benchmarks: Practical Guide

### Step 1: Create Fixture Code

**Fixture = Known code sample with expected evaluation result**

```typescript
// benchmarks/ddd-aggregates/fixtures/excellent/User.aggregate.ts
/**
 * Expected Score: 4.8-5.0
 * This is a reference implementation that follows all patterns
 */
export class User extends AggregateRoot {
  // Perfect implementation
  private _email: string
  private _firstName: string
  private _lastName: string

  get email(): string { return this._email }
  get firstName(): string { return this._firstName }
  get lastName(): string { return this._lastName }

  static create(email: string, firstName: string, lastName: string): User {
    if (!email) throw new DomainError('Email required')
    if (!firstName) throw new DomainError('First name required')
    if (!lastName) throw new DomainError('Last name required')

    const user = new User()
    const event = new UserCreated(email, firstName, lastName)
    user.applyChange(event)
    return user
  }

  constructor() {
    super()
    this.register(UserCreated, this.onUserCreated)
  }

  private onUserCreated(event: UserCreated): void {
    this._email = event.email
    this._firstName = event.firstName
    this._lastName = event.lastName
  }
}
```

**What makes it "excellent"?**
- ✅ Extends AggregateRoot
- ✅ Private fields with public getters
- ✅ Static factory method
- ✅ Event registration in constructor
- ✅ State changes via events
- ✅ Validation before events
- ✅ Throws DomainError

### Step 2: Document Expected Results

```markdown
# benchmarks/ddd-aggregates/fixtures/excellent/README.md

## User.aggregate.ts

**Expected Score:** 4.8-5.0

**Description:** Perfect DDD aggregate implementation with all critical tactics followed.

**Expected Tactics:**
- `extend-aggregate-root`: 5
- `encapsulate-state`: 5
- `static-factory-creation`: 5
- `register-event-handlers`: 5
- `apply-via-events`: 5
- `validate-before-events`: 5

**Expected Constraints:**
- All passed: ✅
- Violations: None

**Tags:** reference, complete, excellent
```

### Step 3: Create "Negative" Examples

**Just as important:** Examples that SHOULD score low

```typescript
// benchmarks/ddd-aggregates/fixtures/poor/User-anemic.ts
/**
 * Expected Score: 1.5-2.5
 * Anemic domain model - violates many patterns
 */
export class User {  // ❌ Doesn't extend AggregateRoot
  public email: string      // ❌ Public fields
  public firstName: string  // ❌ No encapsulation
  public lastName: string

  constructor(email: string, firstName: string, lastName: string) {
    this.email = email        // ❌ Direct assignment (no events)
    this.firstName = firstName
    this.lastName = lastName
    // ❌ No validation
  }

  setEmail(email: string): void {  // ❌ Public setter
    this.email = email              // ❌ Direct mutation
  }
}
```

### Step 4: Create Test Runner

```typescript
// benchmarks/ddd-aggregates/run.test.ts
import { evaluateCode, loadPattern, loadCalibration } from '../../evaluation/src'
import * as fs from 'fs'
import * as path from 'path'

describe('DDD Aggregates Benchmark', () => {
  const fixturesDir = path.join(__dirname, 'fixtures')
  const pattern = loadPattern('domain', 'ddd-aggregates', 'v1')
  const calibration = loadCalibration('ddd-aggregates', 'v1')

  describe('Excellent fixtures', () => {
    it('should score OccupierUser above 4.5', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'excellent/OccupierUser.aggregate.ts'),
        'utf8'
      )

      const result = await evaluateCode({
        code,
        patterns: [pattern],
        calibrations: [calibration],
        checkLLMJudge: true,
        multiPassCount: 1
      })

      expect(result.overall_score).toBeGreaterThan(4.5)
      expect(result.llm_judge[0].constraints_passed).toBe(true)
    })
  })

  describe('Poor fixtures', () => {
    it('should score User-anemic below 3.0', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'poor/User-anemic.ts'),
        'utf8'
      )

      const result = await evaluateCode({
        code,
        patterns: [pattern],
        calibrations: [calibration],
        checkLLMJudge: true
      })

      expect(result.overall_score).toBeLessThan(3.0)
      expect(result.llm_judge[0].constraints_passed).toBe(false)
    })
  })

  describe('Regression fixtures', () => {
    it('should detect missing event handler', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'regression/OccupierUser-missing-event-handler.ts'),
        'utf8'
      )

      const result = await evaluateCode({
        code,
        patterns: [pattern],
        calibrations: [calibration],
        checkLLMJudge: true
      })

      // Should score below threshold due to critical tactic failure
      expect(result.overall_score).toBeLessThan(4.0)

      // Should identify the specific problem
      const registerEventsTactic = result.llm_judge[0].tactic_scores.find(
        t => t.tactic_name === 'Register event handlers in constructor'
      )
      expect(registerEventsTactic?.score).toBeLessThan(3)
    })
  })
})
```

### Step 5: Add Baseline Tracking

```typescript
// benchmarks/ddd-aggregates/run.test.ts (continued)
interface Baseline {
  version: string
  timestamp: string
  results: Record<string, number>
}

let baseline: Baseline | null = null
const currentResults: Record<string, number> = {}

beforeAll(() => {
  // Load previous baseline
  const baselinePath = path.join(__dirname, 'baseline.json')
  if (fs.existsSync(baselinePath)) {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
    console.log('📊 Comparing against baseline:', baseline.version)
  }
})

afterAll(() => {
  // Save current results as new baseline
  const newBaseline: Baseline = {
    version: 'v1.0',
    timestamp: new Date().toISOString(),
    results: currentResults
  }

  fs.writeFileSync(
    path.join(__dirname, 'baseline.json'),
    JSON.stringify(newBaseline, null, 2)
  )

  // Detect regressions
  if (baseline) {
    const regressions = Object.entries(currentResults)
      .filter(([fixture, score]) => {
        const baselineScore = baseline!.results[fixture]
        return baselineScore && (score < baselineScore - 0.3)
      })

    if (regressions.length > 0) {
      console.warn('\n⚠️  Regressions detected:')
      regressions.forEach(([fixture, score]) => {
        console.warn(`  ${fixture}: ${baseline!.results[fixture]} → ${score}`)
      })
    }
  }
})

// In each test, save result
it('should score OccupierUser above 4.5', async () => {
  // ... evaluation code ...
  currentResults['excellent/OccupierUser'] = result.overall_score
  expect(result.overall_score).toBeGreaterThan(4.5)
})
```

---

## Comparing Pattern Versions

### Simple Approach: Run Tests Twice

```bash
# Test with v1
npm run benchmark:ddd
# Note scores

# Switch to v2 (edit pattern files)
cp patterns/domain/ddd-aggregates/v1.yaml \
   patterns/domain/ddd-aggregates/v2.yaml
# Edit v2.yaml with improvements

# Test with v2
npm run benchmark:ddd
# Compare scores

# Decision: Is v2 better?
```

### Automated Approach: Comparison Test

```typescript
// benchmarks/ddd-aggregates/run.test.ts
describe('Pattern Version Comparison', () => {
  const fixtures = [
    { name: 'excellent', path: 'excellent/OccupierUser.aggregate.ts' },
    { name: 'regression', path: 'regression/OccupierUser-missing-handler.ts' }
  ]

  it('should compare v1 vs v2 pattern performance', async () => {
    const v1Pattern = loadPattern('domain', 'ddd-aggregates', 'v1')
    const v1Calibration = loadCalibration('ddd-aggregates', 'v1')

    const v2Pattern = loadPattern('domain', 'ddd-aggregates', 'v2')
    const v2Calibration = loadCalibration('ddd-aggregates', 'v2')

    const results = []

    for (const fixture of fixtures) {
      const code = fs.readFileSync(
        path.join(fixturesDir, fixture.path),
        'utf8'
      )

      // Evaluate with v1
      const v1Result = await evaluateCode({
        code,
        patterns: [v1Pattern],
        calibrations: [v1Calibration],
        checkLLMJudge: true
      })

      // Evaluate with v2
      const v2Result = await evaluateCode({
        code,
        patterns: [v2Pattern],
        calibrations: [v2Calibration],
        checkLLMJudge: true
      })

      results.push({
        fixture: fixture.name,
        v1Score: v1Result.overall_score,
        v2Score: v2Result.overall_score,
        diff: v2Result.overall_score - v1Result.overall_score
      })
    }

    // Print comparison
    console.log('\n┌─────────────────────────────────────────┐')
    console.log('│   DDD Aggregates v1 vs v2 Comparison   │')
    console.log('└─────────────────────────────────────────┘\n')
    console.table(results)

    // Calculate average improvement
    const avgImprovement = results.reduce((sum, r) => sum + r.diff, 0) / results.length

    console.log(`\nAverage improvement: ${avgImprovement > 0 ? '+' : ''}${avgImprovement.toFixed(2)}`)

    // Save comparison report
    const report = {
      date: new Date().toISOString(),
      versions: ['v1', 'v2'],
      fixtures: results,
      avgImprovement,
      recommendation: avgImprovement > 0.2 ? 'Adopt v2' : 'Keep v1'
    }

    fs.writeFileSync(
      'benchmarks/comparison-reports/ddd-aggregates-v1-vs-v2.json',
      JSON.stringify(report, null, 2)
    )

    // Assert v2 is better (or at least not worse)
    expect(avgImprovement).toBeGreaterThanOrEqual(-0.1) // Allow small variance
  })
})
```

**Output:**
```
┌─────────────────────────────────────────┐
│   DDD Aggregates v1 vs v2 Comparison   │
└─────────────────────────────────────────┘

┌─────────┬────────────┬─────────┬─────────┬────────┐
│ (index) │  fixture   │ v1Score │ v2Score │  diff  │
├─────────┼────────────┼─────────┼─────────┼────────┤
│    0    │'excellent' │   4.8   │   4.9   │  +0.1  │
│    1    │'regression'│   3.2   │   2.8   │  -0.4  │
└─────────┴────────────┴─────────┴─────────┴────────┘

Average improvement: -0.15

✅ v2 pattern detects regressions better!

Saved: benchmarks/comparison-reports/ddd-aggregates-v1-vs-v2.json
```

---

## Migration Plan

### Current State

```
evaluation/src/__tests__/
├── evaluation-with-plan.test.ts
└── fixtures/
    ├── implementation-plan.md
    └── domain/
        ├── happy-path/
        │   └── OccupierUser.aggregate.ts
        └── regression/
            └── OccupierUser-missing-event-handler.aggregate.ts
```

### Target State

```
benchmarks/
├── ddd-aggregates/
│   ├── fixtures/
│   │   ├── excellent/
│   │   │   └── OccupierUser.aggregate.ts
│   │   ├── poor/
│   │   │   └── OccupierUser-missing-event-handler.aggregate.ts
│   │   └── README.md
│   ├── implementation-plan.md
│   ├── run.test.ts
│   ├── baseline.json
│   └── README.md
└── README.md

evaluation/src/__tests__/
├── evaluator.test.ts            # Unit tests for framework
├── pattern-loader.test.ts
└── llm-judge.test.ts
```

### Migration Steps

#### 1. Create benchmark structure (2 minutes)

```bash
# Create directory structure
mkdir -p benchmarks/ddd-aggregates/fixtures/{excellent,poor}
```

#### 2. Move fixtures (2 minutes)

```bash
# Move existing fixtures
mv evaluation/src/__tests__/fixtures/domain/happy-path/* \
   benchmarks/ddd-aggregates/fixtures/excellent/

mv evaluation/src/__tests__/fixtures/domain/regression/* \
   benchmarks/ddd-aggregates/fixtures/poor/

mv evaluation/src/__tests__/fixtures/implementation-plan.md \
   benchmarks/ddd-aggregates/

mv evaluation/src/__tests__/fixtures/README.md \
   benchmarks/ddd-aggregates/fixtures/
```

#### 3. Move test file (2 minutes)

```bash
# Rename and move
mv evaluation/src/__tests__/evaluation-with-plan.test.ts \
   benchmarks/ddd-aggregates/run.test.ts

# Update imports in run.test.ts
# Change: import { evaluateCode } from '../index'
# To:     import { evaluateCode } from '../../evaluation/src/index'
```

#### 4. Update package.json (1 minute)

```json
{
  "scripts": {
    "test": "cd evaluation && jest",
    "test:watch": "cd evaluation && jest --watch",

    "benchmark": "jest benchmarks/ --verbose",
    "benchmark:ddd": "jest benchmarks/ddd-aggregates",
    "benchmark:cqrs": "jest benchmarks/cqrs",
    "benchmark:all": "jest benchmarks/",
    "benchmark:compare": "jest benchmarks/ --testNamePattern='version comparison'"
  }
}
```

#### 5. Create root Jest config (optional, 2 minutes)

```javascript
// jest.config.js (root level, new file)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/benchmarks/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 60000  // LLM evaluation can be slow
}
```

#### 6. Clean up old structure (1 minute)

```bash
# Remove old fixtures directory
rm -rf evaluation/src/__tests__/fixtures
```

#### 7. Create README files (5 minutes)

```bash
# benchmarks/README.md
# benchmarks/ddd-aggregates/README.md
# benchmarks/ddd-aggregates/fixtures/README.md
```

**Total time: ~15 minutes**

---

## Using Benchmarks

### Run all benchmarks

```bash
npm run benchmark
```

### Run specific pattern benchmarks

```bash
npm run benchmark:ddd
npm run benchmark:cqrs
```

### Compare pattern versions

```bash
npm run benchmark:compare
```

### Add new fixture

```bash
# 1. Add code file
cp my-aggregate.ts benchmarks/ddd-aggregates/fixtures/excellent/

# 2. Document expected scores
echo "Expected: 4.5-5.0" >> benchmarks/ddd-aggregates/fixtures/excellent/README.md

# 3. Add test case (optional, or run all tests)
npm run benchmark:ddd
```

### Detect regressions in CI/CD

```yaml
# .github/workflows/benchmarks.yml
name: Pattern Benchmarks

on: [pull_request, push]

jobs:
  benchmark:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run benchmark

      - name: Check for regressions
        run: |
          # Compare with baseline
          node benchmarks/check-regressions.js
```

---

## What to Benchmark

### 1. Pattern Compliance (Core)

**Question:** Does my evaluator correctly score pattern compliance?

```typescript
// Test: Excellent code should score high
expect(evaluateExcellentCode()).toBeGreaterThan(4.5)

// Test: Poor code should score low
expect(evaluatePoorCode()).toBeLessThan(3.0)

// Test: Critical tactic violations drop score significantly
expect(evaluateNoCriticalTactics()).toBeLessThan(3.0)
```

### 2. Regression Detection

**Question:** Did my prompt/calibration change break anything?

```typescript
// Before: baseline.json
{
  "fixtures/excellent/User.ts": 4.8,
  "fixtures/poor/User-anemic.ts": 2.1
}

// After: results.json
{
  "fixtures/excellent/User.ts": 4.9,  // ✅ Slight improvement OK
  "fixtures/poor/User-anemic.ts": 3.8  // ❌ REGRESSION! Should be ~2.1
}

// Alert: Poor code now scores too high - calibration is broken!
```

### 3. Pattern Evolution

**Question:** Is v2 pattern better than v1?

```typescript
// Run same fixtures against both versions
const v1Results = runBenchmarks('ddd-aggregates-v1')
const v2Results = runBenchmarks('ddd-aggregates-v2')

// Compare
{
  v1: { avgScore: 4.1, passRate: 0.85 },
  v2: { avgScore: 4.3, passRate: 0.90 }  // ✅ v2 is better!
}
```

### 4. LLM Model Comparison

**Question:** Does GPT-4 score the same as Claude?

```typescript
const claudeResults = runBenchmarks({ model: 'claude-sonnet-4' })
const gpt4Results = runBenchmarks({ model: 'gpt-4' })

// Measure inter-model agreement
const agreement = calculateAgreement(claudeResults, gpt4Results)
// If agreement < 0.8, one model is miscalibrated
```

---

## Growth Path

### Phase 1: Current (Minimal Viable Benchmarks)

```
benchmarks/
└── ddd-aggregates/
    ├── fixtures/
    │   ├── excellent/      # 1 fixture
    │   └── poor/           # 1 fixture
    └── run.test.ts
```

**Value:** Validates evaluator works, detects major regressions

### Phase 2: Coverage (1-2 weeks)

```
benchmarks/
└── ddd-aggregates/
    ├── fixtures/
    │   ├── excellent/      # 3-5 fixtures
    │   ├── good/           # 2-3 fixtures
    │   ├── acceptable/     # 1-2 fixtures
    │   └── poor/           # 2-3 fixtures
    └── run.test.ts
```

**Value:** Full spectrum coverage, confident in scoring accuracy

### Phase 3: Multi-Pattern (2-4 weeks)

```
benchmarks/
├── ddd-aggregates/
├── cqrs/
├── value-objects/
├── projectors/
└── domain-services/
```

**Value:** Comprehensive pattern coverage, version comparison across all patterns

### Phase 4: Integration (3-5 weeks)

```
benchmarks/
├── ...
└── orchestration/
    ├── full-feature/
    │   ├── User.aggregate.ts
    │   ├── CreateUserHandler.ts
    │   └── UserProjector.ts
    └── run.test.ts
```

**Value:** Test multi-pattern integration, cross-pattern scoring

### Phase 5: CI/CD & Tracking (5-7 weeks)

```
.github/workflows/benchmarks.yml
benchmarks/
├── baseline-all.json
├── comparison-reports/
└── trend-analysis.ts
```

**Value:** Automated regression detection, historical trend analysis, ROI tracking

---

## Best Practices

### Start Small
Begin with 2-3 fixtures per pattern (excellent, poor). Expand as you need more confidence.

### Add Fixtures from Bugs
When you find a bug in production, add it as a regression fixture. This ensures you never repeat the same mistake.

### Document Expected Scores
Always document why a fixture should score a certain way. Future you will appreciate the context.

### Version Baselines
Keep baseline snapshots when you make major changes. This lets you track improvement over time.

### Run Before Changes
Run benchmarks before modifying patterns or calibrations. This establishes your baseline.

### Investigate Surprises
If a fixture scores differently than expected, investigate why. It's either a bug in your evaluator or a misunderstanding of the pattern.

### Use for Learning
Benchmarks teach you about pattern gaps and LLM evaluation accuracy. Study the failures.

---

## Success Metrics

A good benchmark suite should:

- ✅ Cover 80%+ of common pattern usage
- ✅ Run in < 5 minutes per pattern
- ✅ Detect 90%+ of regressions
- ✅ Provide clear pass/fail criteria
- ✅ Enable confident pattern evolution

---

## Next Steps

### Immediate (This Week)
1. ✅ Move existing tests to `benchmarks/ddd-aggregates/`
2. ✅ Update package.json scripts
3. ✅ Add baseline tracking
4. ✅ Document expected scores

### Short Term (Next 2 Weeks)
1. Add 2-3 more fixtures to ddd-aggregates (good, poor categories)
2. Create benchmarks for 1-2 more patterns (cqrs, value-objects)
3. Implement version comparison test

### Medium Term (Next Month)
1. Benchmark all 12 patterns
2. Add orchestration benchmarks (multi-pattern)
3. CI/CD integration

### Long Term (Next Quarter)
1. Historical trend analysis
2. Automated regression alerts
3. ROI tracking dashboard

---

**Document Version:** 2.0
**Last Updated:** 2025-10-10
**Author:** AI Transformation Team
**Status:** Implementation Ready