# Domain Events Benchmark

This benchmark validates the evaluation of Domain Event pattern implementations.

## Pattern

Domain Events are immutable records of significant business changes that have occurred. They are fundamental to event sourcing and communicate state changes across bounded contexts.

**Pattern File:** `patterns/domain/domain-events/v1.yaml`
**Calibration:** `calibration/domain/domain-events/v1-scoring.yaml`

## Key Principles

1. **Immutability** - Events are facts, cannot be changed
2. **Past Tense** - Named for what happened (Created, not Create)
3. **Self-Contained** - Include all data needed for replay
4. **No Methods** - Pure data containers
5. **Serializable** - Only JSON-serializable data types
6. **Event Base** - Extend EventBase with static typename

## Fixtures

### Excellent (≥ 4.5)

**OccupierCreated.ts** - Perfect domain event
- Extends EventBase
- Immutable (readonly properties)
- Past-tense naming
- Self-contained data
- Static typename
- No methods

### Poor (< 4.0)

**MutableDomainEvent.ts** - Mutable event with methods
- Mutable properties (no readonly)
- Methods that modify state
- Business logic in event
- Violates immutability

**EventWithAggregateReference.ts** - Event with aggregate
- Contains aggregate instance
- Not self-contained
- Has methods
- Cannot be serialized properly

## Running Tests

```bash
# Run domain events benchmarks
npx jest benchmarks/domain-events/run.test.ts

# Watch mode
npx jest benchmarks/domain-events/run.test.ts --watch

# Verbose output
npx jest benchmarks/domain-events/run.test.ts --verbose
```

## Expected Results

- ✅ Excellent fixture scores > 4.5
- ✅ Mutable fixture scores ≤ 4.0
- ✅ Aggregate reference fixture scores ≤ 4.0
- ✅ N/A tactics handled correctly

## Anti-Patterns Detected

1. **Mutable Events** - Properties not readonly
2. **Methods on Events** - Business logic or behavior
3. **Aggregate References** - Not self-contained
4. **Non-Serializable Data** - Cannot be stored/replayed
5. **Present Tense Naming** - Commands vs events

## Event Sourcing Context

Domain events are central to event sourcing:
- **Source of Truth**: Aggregates reconstituted from events
- **Audit Trail**: Complete history of changes
- **Replay**: Events must be self-contained
- **Integration**: Events communicate between contexts

## References

- **DDD Book**: Eric Evans - "Domain-Driven Design" (Chapter 8: Domain Events)
- **Event Sourcing**: Greg Young - CQRS and Event Sourcing patterns
- **Code Samples**: Real production events from `code-samples-candidates/domain/events/`

## Baseline

See `baseline.json` for expected scores and regression detection.
