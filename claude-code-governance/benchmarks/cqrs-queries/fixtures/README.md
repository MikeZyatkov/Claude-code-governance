# CQRS Queries Fixtures

Test fixtures for validating CQRS query handler pattern compliance.

## Fixture Organization

### Excellent Examples (`excellent/`)

High-quality query handlers that follow all CQRS best practices.

**GetOccupierByIdQueryHandler.ts**
- Pure read operation, no state modifications
- Returns DTO (GetOccupierByIdResponse)
- No aggregate method calls
- Proper dependency injection
- Expected score: ≥ 4.5

### Poor Examples (`poor/`)

Intentionally flawed implementations that violate CQRS patterns.

**QueryMutatesState.ts**
- VIOLATION: Calls repository.writeAsync() in query
- VIOLATION: Calls aggregate.updateLastAccessedTimestamp()
- VIOLATION: Calls aggregate.refreshCache()
- Queries must be read-only with no side effects
- Expected score: < 4.0
- Expected failing tactics:
  - `queries-no-state-modification` (critical)
  - `queries-read-without-modifications` (important)

**QueryReturnsAggregate.ts**
- VIOLATION: Returns Occupier aggregate instead of DTO
- Exposes internal domain structure to application layer
- Breaks CQRS separation
- Expected score: < 4.0
- Expected failing tactics:
  - `queries-return-dtos` (critical)

## Running These Fixtures

```bash
npm test benchmarks/cqrs-queries/run.test.ts
```

## Pattern Reference

- **Pattern**: `patterns/application/cqrs/v1.yaml`
- **Calibration**: `calibration/cqrs/v1-scoring.yaml`
