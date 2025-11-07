# Pattern Benchmarks

This directory contains benchmark suites that validate pattern evaluation accuracy and enable pattern version comparison.

## Purpose

Benchmarks serve multiple purposes:
1. **Validate Evaluation** - Prove the evaluation framework scores patterns correctly
2. **Detect Regressions** - Catch when changes break pattern scoring
3. **Compare Versions** - Test v1 vs v2 patterns objectively
4. **Document Quality** - Show concrete examples of excellent vs poor code

## Structure

```
benchmarks/
├── ddd-aggregates/
│   ├── fixtures/
│   │   ├── excellent/      # Scores 4.5-5.0
│   │   └── poor/           # Scores <4.5
│   ├── implementation-plan.md
│   ├── run.test.ts
│   ├── baseline.json
│   └── README.md
├── cqrs-commands/
│   ├── fixtures/
│   │   ├── excellent/      # Scores 4.5-5.0
│   │   └── poor/           # 2 fixtures with violations
│   ├── implementation-plan.md
│   ├── run.test.ts
│   ├── baseline.json
│   └── README.md
├── cqrs-queries/
│   ├── fixtures/
│   │   ├── excellent/      # Scores 4.5-5.0
│   │   └── poor/           # 2 fixtures with violations
│   ├── implementation-plan.md
│   ├── run.test.ts
│   ├── baseline.json
│   └── README.md
├── projectors/
│   ├── fixtures/
│   │   ├── excellent/      # Scores 4.5-5.0
│   │   └── poor/           # 2 fixtures with violations
│   ├── implementation-plan.md
│   ├── run.test.ts
│   ├── baseline.json
│   └── README.md
└── README.md (this file)
```

## Running Benchmarks

```bash
# Run all benchmarks
npx jest benchmarks/

# Run specific pattern benchmarks
npx jest benchmarks/ddd-aggregates/run.test.ts
npx jest benchmarks/cqrs-commands/run.test.ts
npx jest benchmarks/cqrs-queries/run.test.ts
npx jest benchmarks/projectors/run.test.ts

# Run all CQRS-related benchmarks
npx jest benchmarks/cqrs-

# Watch mode during development
npx jest benchmarks/ --watch
```

## Adding New Fixtures

1. **Create fixture file:**
   ```bash
   # For excellent code
   cp MyAggregate.ts benchmarks/ddd-aggregates/fixtures/excellent/

   # For poor code
   cp MyBrokenAggregate.ts benchmarks/ddd-aggregates/fixtures/poor/
   ```

2. **Document expected scores:**
   Update `fixtures/README.md` with:
   - Fixture name
   - Expected score range
   - Why it scores that way
   - What patterns it tests

3. **Add test case (optional):**
   Benchmarks auto-discover fixtures, but you can add explicit tests in `run.test.ts` if needed.

4. **Run benchmarks:**
   ```bash
   npm run benchmark:ddd
   ```

## Benchmark Categories

### Excellent (4.5-5.0)
Code that perfectly follows all critical pattern tactics with no violations.

**Example:** Full DDD aggregate with event sourcing, proper encapsulation, static factories, event handlers registered.

### Good (4.0-4.5)
Code that follows critical tactics but has minor issues or missing optional tactics.

**Example:** DDD aggregate missing optional optimization (like Map for collections) but all critical tactics present.

### Acceptable (3.5-4.0)
Code at the threshold - meets minimum requirements but has room for improvement.

**Example:** DDD aggregate with all critical tactics but inconsistent implementation quality.

### Poor (<4.0)
Code with critical violations, missing key tactics, or fundamental pattern misunderstanding.

**Example:** Anemic domain model, missing event sourcing, public setters, no validation.

## Current Coverage

- ✅ **DDD Aggregates** - 2 fixtures (1 excellent, 1 poor) - `/benchmarks/ddd-aggregates/`
- ✅ **CQRS Commands** - 3 fixtures (1 excellent, 2 poor) - `/benchmarks/cqrs-commands/`
- ✅ **CQRS Queries** - 3 fixtures (1 excellent, 2 poor) - `/benchmarks/cqrs-queries/`
- ✅ **Projectors** - 3 fixtures (1 excellent, 2 poor) - `/benchmarks/projectors/`
- 🔜 **Value Objects** - Planned
- 🔜 **Domain Events** - Planned
- 🔜 **Event Sourcing** - Planned
- 🔜 **Error Handling** - Planned
- 🔜 **Repository** - Planned

**Status:** 4 of 12 patterns (33%) - 11 fixtures total

## Best Practices

### Start with Real Code
Use actual code from your codebase, not toy examples. Real complexity reveals real scoring issues.

### Document Expected Scores
Always explain WHY a fixture should score a certain way. This helps when scores drift unexpectedly.

### Add Regression Fixtures
When you find a bug in production, add it as a regression fixture. This prevents repeating the same mistake.

### Keep Fixtures Realistic
Fixtures should represent common scenarios developers face, not edge cases.

### Version Baselines
Save baseline scores when making major changes. Track improvement over time.

## Interpreting Results

### All Tests Pass
✅ Evaluation framework is working correctly. Safe to deploy changes.

### Test Fails: Excellent Fixture Scores Low
❌ Evaluation is too strict. Review calibration rubrics - you may be penalizing good practices.

### Test Fails: Poor Fixture Scores High
❌ Evaluation is too lenient. Review calibration rubrics - you're missing critical violations.

### Scores Drift Over Time
⚠️ Compare with `baseline.json`. If consistent drift, calibration may need tuning.

## Next Steps

See `IMPLEMENTATION_PLAN.md` for detailed weekly plan:

**Week 1:**
- ✅ Migrate tests to benchmarks (done!)
- 🔲 Add 3-5 more fixtures (good, poor variations)
- 🔲 Implement baseline tracking

**Week 2:**
- 🔲 Create CQRS benchmarks (5 fixtures)
- 🔲 Create Value Objects benchmarks (5 fixtures)
- 🔲 CI/CD integration

## Related Documentation

- `docs/benchmarking.md` - Comprehensive benchmarking guide
- `IMPLEMENTATION_PLAN.md` - Week-by-week implementation plan
- `docs/roadmap.md` - Strategic vision and phases

---

**Status:** Phase 2 Complete - CQRS Patterns Validated ✅
**Last Updated:** 2025-11-07
**Coverage:** 4/12 patterns (33%)