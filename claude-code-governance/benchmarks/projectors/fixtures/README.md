# Projectors Fixtures

Test fixtures for validating projector pattern compliance.

## Fixture Organization

### Excellent Examples (`excellent/`)

**OccupierProjector.ts**
- Pure transformation: event → DTO → write
- No business validation
- No domain event emission
- Idempotent handlers
- Can fetch supplementary data (timezone)
- Expected score: ≥ 4.5

### Poor Examples (`poor/`)

**ProjectorWithBusinessValidation.ts**
- VIOLATION: Validates business rules (name length, dates, duplicates)
- VIOLATION: Checks business constraints
- Business validation belongs in aggregates
- Expected score: < 4.0
- Failing tactics: `no-business-validation`, `pure-transformation`

**ProjectorEmitsDomainEvents.ts**
- VIOLATION: Emits new domain events (ProjectionCreated)
- VIOLATION: Publishes notifications and workflow events
- Creates event cascades
- Projectors should be passive consumers
- Expected score: < 4.0
- Failing tactics: `passive-consumer`, `no-side-effects`

## Running These Fixtures

```bash
npm test benchmarks/projectors/run.test.ts
```

## Pattern Reference

- **Pattern**: `patterns/application/projectors/v1.yaml`
- **Calibration**: `calibration/projectors/v1-scoring.yaml`
