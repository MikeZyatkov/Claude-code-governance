# Test Fixtures

This directory contains test fixtures for integration tests.

## Structure

```
fixtures/
├── implementation-plan.md          # Implementation plan for OccupierUser feature
└── domain/
    ├── happy-path/                 # Correctly implemented code
    │   └── OccupierUser.aggregate.ts
    └── regression/                 # Code with known issues
        └── OccupierUser-missing-event-handler.aggregate.ts
```

## Fixtures

### `implementation-plan.md`
The complete implementation plan for the OccupierUser invitation feature. Used by the evaluator to understand what was supposed to be implemented and catch regressions.

### `domain/happy-path/OccupierUser.aggregate.ts`
Correctly implemented aggregate following all DDD Aggregates (v1) pattern tactics:
- ✅ Extends AggregateRoot
- ✅ Both event handlers registered (OccupierUserCreated, OccupierUserInvited)
- ✅ State encapsulated with private fields and public getters
- ✅ Static factory method for creation
- ✅ All state changes via events
- ✅ Business invariants validated before events

**Expected score**: > 4.5

### `domain/regression/OccupierUser-missing-event-handler.aggregate.ts`
Aggregate with missing OccupierUserInvited event registration in constructor. This is a critical regression that should be caught by evaluation.

**Missing**: `this.register(OccupierUserInvited.typename, ...)`

**Expected score**: < 4.0 (critical tactic failure)

## Adding New Fixtures

When adding new fixtures:
1. Place happy path code in `domain/happy-path/`
2. Place regression cases in `domain/regression/` with descriptive names
3. Update this README with fixture description and expected scores
4. Add corresponding test in `evaluation-with-plan.test.ts`

## Maintenance

Keep fixtures synchronized with:
- Pattern definitions in `/patterns/domain/ddd-aggregates/v1.yaml`
- Calibration rubrics in `/calibrations/ddd-aggregates/v1.yaml`
- Implementation plan in this directory

When patterns evolve, update fixtures to match new pattern requirements.
