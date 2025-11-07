# CQRS Commands Fixtures

Test fixtures for validating CQRS command handler pattern compliance.

## Fixture Organization

### Excellent Examples (`excellent/`)

High-quality command handlers that follow all CQRS best practices.

**CreateOccupierCommandHandler.ts**
- Clean orchestration pattern
- Returns ID (not full aggregate)
- No business logic in handler
- Proper dependency injection with @injectable
- Delegates to aggregate for domain logic
- Expected score: ≥ 4.5

### Poor Examples (`poor/`)

Intentionally flawed implementations that violate CQRS patterns.

**CommandHandlerWithBusinessLogic.ts**
- VIOLATION: Contains business validation logic directly in handler
- VIOLATION: Performs repository queries for business rule checking
- VIOLATION: Implements email validation in handler method
- All validation should be in the domain aggregate
- Expected score: < 4.0
- Expected failing tactics:
  - `orchestration-not-logic` (critical)

**CommandHandlerReturnsAggregate.ts**
- VIOLATION: Returns full domain aggregate instead of void/ID
- Exposes internal domain structure to application layer
- Breaks command/query separation
- Expected score: < 4.0
- Expected failing tactics:
  - `return-void-or-id` (critical)

## Running These Fixtures

```bash
npm test benchmarks/cqrs-commands/run.test.ts
```

## Pattern Reference

- **Pattern**: `patterns/application/cqrs/v1.yaml`
- **Calibration**: `calibration/cqrs/v1-scoring.yaml`
