# Event Sourcing Benchmark

This benchmark validates the evaluation of Event Sourcing pattern implementations.

## Pattern

Event Sourcing is a pattern where aggregate state is derived from a sequence of domain events. Instead of storing current state, we store all events that led to that state.

**Pattern File:** `patterns/domain/event-sourcing/v1.yaml`
**Calibration:** `calibration/domain/event-sourcing/v1-scoring.yaml`

## Key Principles

1. **Event-Sourced Base** - Extend AggregateRoot with event capabilities
2. **Register Handlers** - All event handlers in constructor
3. **Apply Via Events** - ALL state changes via applyChange()
4. **No Direct Mutation** - State only changes in handlers
5. **Complete Coverage** - Handler for every event type
6. **Separation** - Business logic in methods, state updates in handlers

## Fixtures

### Excellent (≥ 4.5)

**OccupierUser.aggregate.ts** - Perfect event sourcing
- Extends AggregateRoot
- All handlers registered in constructor
- Business methods: validate → event → applyChange()
- No direct state mutation
- Complete handler coverage

### Poor (< 4.0)

**DirectStateModification.ts** - Bypasses event sourcing
- Direct field assignment
- State changes without events
- Public setters
- Inconsistent (mixed approach)

**MissingEventHandlers.ts** - Incomplete implementation
- Events created but no handlers
- applyChange() with unregistered events
- State out of sync
- Cannot replay aggregate

## Running Tests

```bash
# Run event sourcing benchmarks
npx jest benchmarks/event-sourcing/run.test.ts

# Watch mode
npx jest benchmarks/event-sourcing/run.test.ts --watch

# Verbose output
npx jest benchmarks/event-sourcing/run.test.ts --verbose
```

## Expected Results

- ✅ Excellent fixture scores > 4.5
- ✅ Direct modification fixture scores ≤ 4.0
- ✅ Missing handlers fixture scores ≤ 4.0
- ✅ N/A tactics handled correctly

## Anti-Patterns Detected

1. **Bypassing Events** - Direct state mutation
2. **Missing Handlers** - Events without handlers
3. **Inconsistent Application** - Mixed approach
4. **Logic in Handlers** - Validation in handlers
5. **Public Setters** - Direct state access

## Event Sourcing Flow

```
Business Method
      ↓
  Validation
      ↓
Create Event
      ↓
applyChange()
      ↓
Event Handler
      ↓
State Update
```

## Benefits

- **Complete Audit Trail** - Every change recorded
- **Temporal Queries** - State at any point in time
- **Event Replay** - Reconstruct aggregate from events
- **Integration** - Events drive other contexts
- **Debugging** - Full history available

## References

- **Event Sourcing Pattern**: Martin Fowler - Event Sourcing
- **CQRS/ES**: Greg Young - CQRS and Event Sourcing
- **Library**: es-aggregates event sourcing framework
- **Code Samples**: Real production aggregates from `code-samples-candidates/domain/model/`

## Baseline

See `baseline.json` for expected scores and regression detection.
