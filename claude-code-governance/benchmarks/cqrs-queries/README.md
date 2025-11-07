# CQRS Queries Pattern Benchmarks

Tests query handler implementation compliance with CQRS pattern.

## Pattern Focus

**Pattern**: CQRS (Command Query Responsibility Segregation) - Queries
**Calibration**: `calibration/cqrs/v1-scoring.yaml`
**Pattern Definition**: `patterns/application/cqrs/v1.yaml`

## Key Tactics Tested

1. **queries-no-state-modification** (critical)
   - Query handlers must be read-only
   - No repository.save() calls
   - No aggregate method calls that modify state

2. **queries-return-dtos** (critical)
   - Handlers return flat DTOs or read models
   - Never return full domain aggregates
   - Prevents exposing domain internals

3. **queries-read-without-modifications** (important)
   - Pure read: repo → map → return
   - No business method invocations
   - Idempotent operations

## Fixtures

### Excellent Examples
- `GetOccupierByIdQueryHandler.ts` - Pure read, returns DTO

### Poor Examples
- `QueryMutatesState.ts` - Calls repository.save(), modifies state
- `QueryReturnsAggregate.ts` - Returns domain aggregate instead of DTO

## Running Benchmarks

```bash
npm test benchmarks/cqrs-queries/run.test.ts
```

## Expected Results

| Fixture | Expected Score | Key Issues |
|---------|---------------|------------|
| GetOccupierByIdQueryHandler.ts | ≥ 4.5 | None - pure read operation |
| QueryMutatesState.ts | < 4.0 | Modifies state in query |
| QueryReturnsAggregate.ts | < 4.0 | Returns domain aggregate |

## Baseline

See `baseline.json` for expected scores per fixture.

## Pattern Reference

Query handlers should follow this structure:

```typescript
@injectable()
export class SomeQueryHandler {
  constructor(
    @inject('IRepository')
    private readonly _repository: IRepository
  ) {}

  async handle(query: SomeQuery): Promise<SomeDTO> {
    // 1. Read from repository
    const aggregate = await this._repository.getById(query.id)

    // 2. Check existence
    if (!aggregate) {
      throw new NotFoundError()
    }

    // 3. Map to DTO (no aggregate method calls!)
    const dto: SomeDTO = {
      id: aggregate.id,
      name: aggregate.name,
      // ... only necessary fields
    }

    // 4. Return DTO
    return dto
  }
}
```

### Anti-Patterns

❌ **State modification**:
```typescript
// WRONG: Query causing side effects
aggregate.updateLastAccessed()
await repository.save(aggregate)
```

❌ **Returning aggregates**:
```typescript
// WRONG: Exposes domain internals
async handle(query: Query): Promise<Aggregate> {
  return await repository.getById(query.id)
}
```

❌ **Calling business methods**:
```typescript
// WRONG: Invoking domain logic in query
const result = aggregate.calculateSomething()
return { result }
```
