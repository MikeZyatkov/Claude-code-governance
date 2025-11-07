# Projectors Pattern Benchmarks

Tests event projector implementation compliance with projector pattern.

## Pattern Focus

**Pattern**: Projectors and Read Models
**Calibration**: `calibration/projectors/v1-scoring.yaml`
**Pattern Definition**: `patterns/application/projectors/v1.yaml`

## Key Tactics Tested

1. **pure-transformation** (critical)
   - Event → DTO → write to read model
   - No business logic or validation

2. **passive-consumer** (critical)
   - Consume events, don't emit new ones
   - No event cascades

3. **idempotent-handling** (important)
   - Replaying same event = same result
   - Safe to replay for recovery

4. **no-business-validation** (critical)
   - No validation in projector
   - Business rules in aggregates

## Fixtures

### Excellent Examples
- `OccupierProjector.ts` - Pure transformation, passive consumer

### Poor Examples
- `ProjectorWithBusinessValidation.ts` - Contains validation logic
- `ProjectorEmitsDomainEvents.ts` - Emits new domain events

## Running Benchmarks

```bash
npm test benchmarks/projectors/run.test.ts
```

## Expected Results

| Fixture | Expected Score | Key Issues |
|---------|---------------|------------|
| OccupierProjector.ts | ≥ 4.5 | None - pure transformation |
| ProjectorWithBusinessValidation.ts | < 4.0 | Business validation |
| ProjectorEmitsDomainEvents.ts | < 4.0 | Emits domain events |

## Baseline

See `baseline.json` for expected scores per fixture.
