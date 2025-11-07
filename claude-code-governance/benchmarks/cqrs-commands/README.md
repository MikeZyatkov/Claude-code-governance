# CQRS Commands Pattern Benchmarks

Tests command handler implementation compliance with CQRS pattern.

## Pattern Focus

**Pattern**: CQRS (Command Query Responsibility Segregation) - Commands
**Calibration**: `calibration/cqrs/v1-scoring.yaml`
**Pattern Definition**: `patterns/application/cqrs/v1.yaml`

## Key Tactics Tested

1. **orchestration-not-logic** (critical)
   - Command handlers orchestrate, don't contain business logic
   - Business rules belong in domain aggregates
   - Validation should be in domain layer

2. **return-void-or-id** (critical)
   - Handlers return void or aggregate ID
   - Never return full domain aggregates
   - Prevents exposing domain internals to application layer

3. **dependency-injection** (important)
   - Use @injectable decorator
   - Inject repositories via constructor
   - Enables testability and loose coupling

## Fixtures

### Excellent Examples
- `CreateOccupierCommandHandler.ts` - Clean orchestration, proper patterns

### Poor Examples
- `CommandHandlerWithBusinessLogic.ts` - Contains validation logic, business rules
- `CommandHandlerReturnsAggregate.ts` - Exposes domain aggregate in return type

## Running Benchmarks

```bash
# Run CQRS commands benchmarks
npm test benchmarks/cqrs-commands/run.test.ts

# Run all benchmarks
npm test benchmarks/
```

## Expected Results

| Fixture | Expected Score | Key Issues |
|---------|---------------|------------|
| CreateOccupierCommandHandler.ts | ≥ 4.5 | None - clean orchestration |
| CommandHandlerWithBusinessLogic.ts | < 4.0 | Business logic in handler |
| CommandHandlerReturnsAggregate.ts | < 4.0 | Returns domain aggregate |

## Baseline

See `baseline.json` for expected scores per fixture (generated after first run).

## Pattern Reference

Command handlers should follow this structure:

```typescript
@injectable()
export class SomeCommandHandler {
  constructor(
    @inject('IRepository')
    private readonly _repository: IRepository
  ) {}

  async handle(command: SomeCommand): Promise<void | string> {
    // 1. Generate IDs if needed
    const id = generateId()

    // 2. Load aggregate if updating
    const aggregate = await this._repository.getById(id)

    // 3. Call aggregate method (business logic is here!)
    aggregate.doSomething(command.params)

    // 4. Save aggregate
    await this._repository.save(aggregate)

    // 5. Return void or just the ID
    return id
  }
}
```

### Anti-Patterns

❌ **Business logic in handler**:
```typescript
// WRONG: Validation belongs in aggregate
if (command.name.length < 3) {
  throw new Error('Name too short')
}
```

❌ **Returning aggregates**:
```typescript
// WRONG: Exposes domain internals
async handle(command: Command): Promise<Aggregate> {
  // ...
  return aggregate  // Should return void or ID
}
```

❌ **Repository queries for business rules**:
```typescript
// WRONG: Business rule checking belongs in domain
const existing = await this._repository.findByName(name)
if (existing.length > 0) {
  throw new Error('Duplicate')
}
```
