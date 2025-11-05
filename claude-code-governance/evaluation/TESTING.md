# Evaluation Framework Tests

## Test Strategy

This project has **integration tests only** - we test the end-to-end evaluation pipeline, not individual components.

### Why Integration Tests?

We're testing **prompt effectiveness** and the **evaluation pipeline**, not the LLM itself. When you change PromptBuilder or Evaluator logic, these tests verify the changes work correctly.

### Test Coverage

**3 focused integration tests** (`evaluation-with-plan.test.ts`):

1. **Happy Path** - Correctly implemented code scores >4.5
   - Verifies: Good code gets high scores
   - Verifies: Success recommendations are shown

2. **Regression Detection** - Code with missing event handler scores <4.0
   - Verifies: Regressions are caught
   - Verifies: Implementation plan context helps detect issues
   - Verifies: Critical tactic penalty applies

3. **N/A Tactics** - Non-applicable tactics don't hurt scores
   - Verifies: Entity-related tactics marked as N/A for simple aggregates
   - Verifies: N/A tactics excluded from scoring
   - Verifies: Code still scores high despite many N/A tactics

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

**Note**: Tests make real LLM calls and take ~2 minutes to run. Each test is an expensive operation.

## Test Fixtures

Located in `src/__tests__/fixtures/`:
- `implementation-plan.md` - Implementation plan for OccupierUser feature
- `OccupierUser.aggregate.ts` - Correctly implemented aggregate

Regression cases are generated inline in tests by modifying the fixture code.

## What We DON'T Test

❌ Individual tactic scoring - testing the LLM, not our framework
❌ Every possible code pattern - too expensive and flaky
❌ Exact LLM responses - LLM output varies slightly

## What We DO Test

✅ Overall scoring logic works correctly
✅ Critical tactic penalty applies
✅ N/A tactics excluded from scoring
✅ Implementation plan context is used
✅ Regressions are detected and scored appropriately

## Adding New Tests

Only add integration tests when:
1. You add new evaluation logic (scoring, penalties, etc.)
2. You significantly change the prompt structure
3. You need to verify a new regression detection pattern

Keep the test suite small and focused - each test is expensive!
