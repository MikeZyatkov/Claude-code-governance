# Event Sourcing Benchmark Implementation Plan

## Pattern Overview

Event Sourcing is a pattern where aggregate state is derived from a sequence of domain events. Instead of storing current state, we store the events that led to that state. Aggregates can be reconstructed by replaying events.

## Pattern Rules

### Critical Tactics

1. **Extend Event-Sourced Base**
   - Aggregate extends AggregateRoot or EventSourcedAggregate
   - Provides applyChange() method
   - Manages event stream and versioning

2. **Register Event Handlers**
   - All event handlers registered in constructor
   - Use register(typename, handler) pattern
   - One handler per event type

3. **Apply Via Events**
   - ALL state changes via applyChange()
   - Business methods create events
   - Events applied through registered handlers

4. **No Direct State Mutation**
   - State only changes in event handlers
   - No field assignment in business methods
   - No public setters

5. **Handler for Every Event**
   - Every event type has registered handler
   - Handlers update state based on event
   - Handlers are simple (no validation)

6. **Business Method Pattern**
   ```typescript
   public methodName(params) {
     // 1. Validate business rules
     // 2. Create domain event
     // 3. applyChange(event)
   }
   ```

7. **Event Handler Pattern**
   ```typescript
   this.register(EventType.typename, (event: EventType) => {
     // Simple state updates only
     this._field = event.field
   })
   ```

## Fixtures Strategy

### Excellent Fixture: OccupierUser.aggregate.ts

Real production event-sourced aggregate:
- Extends AggregateRoot
- All event handlers registered in constructor
- Business methods create events → applyChange()
- No direct state mutation
- Complete event sourcing implementation

### Poor Fixture 1: DirectStateModification.ts

Violations:
- Business methods bypass applyChange()
- Direct field assignment
- Public setters
- Inconsistent (some events, some direct)

### Poor Fixture 2: MissingEventHandlers.ts

Violations:
- Events created but handlers not registered
- applyChange() called but no handler
- State out of sync with events
- Cannot replay aggregate

## Expected Scores

- **Excellent (OccupierUser.aggregate.ts)**: ≥ 4.5
  - Complete event sourcing implementation
  - All state changes via events
  - All handlers registered

- **Poor (DirectStateModification.ts)**: < 4.0
  - Bypasses event sourcing
  - Direct state mutation
  - Mixed approach breaks pattern

- **Poor (MissingEventHandlers.ts)**: < 4.0
  - Missing event handlers
  - Incomplete implementation
  - Cannot replay aggregate

## Calibration Expectations

Pattern: `domain/event-sourcing/v1`
Calibration: `domain/event-sourcing/v1-scoring.yaml`

Key tactics to evaluate:
- `extend-event-sourced-base`: Extends AggregateRoot
- `register-event-handlers`: All handlers registered in constructor
- `apply-via-events`: All state changes via applyChange()
- `no-direct-state-mutation`: No field assignment outside handlers
- `handler-for-every-event`: Complete handler coverage
- `business-method-pattern`: Validate → create event → apply
- `simple-event-handlers`: Handlers only update state

## Success Criteria

- ✅ Excellent fixture scores ≥ 4.5
- ✅ Direct modification fixture scores < 4.0
- ✅ Missing handlers fixture scores < 4.0
- ✅ Low-scoring tactics identified correctly
- ✅ Recommendations include event sourcing fixes

## Anti-Patterns to Detect

1. **Bypassing Events**
   - Direct field assignment in business methods
   - State changes without events
   - Public setters

2. **Missing Handlers**
   - Events created but no handler registered
   - applyChange() with unregistered event
   - Incomplete handler coverage

3. **Logic in Handlers**
   - Business validation in handlers
   - Handlers doing more than state updates
   - Complex logic that should be in business methods

4. **Inconsistent Application**
   - Some methods use events, others don't
   - Mixed approach (direct + events)
   - Partial event sourcing

## Event Sourcing Benefits

1. **Complete Audit Trail** - Every change is recorded
2. **Temporal Queries** - Can query state at any point in time
3. **Event Replay** - Reconstruct aggregate from events
4. **Integration** - Events drive integration with other contexts
5. **Debugging** - Full history of changes

## References

- **Pattern File**: `patterns/domain/event-sourcing/v1.yaml`
- **Calibration File**: `calibration/domain/event-sourcing/v1-scoring.yaml`
- **Code Samples**: `code-samples-candidates/domain/model/*.aggregate.ts`
- **Library**: es-aggregates (event sourcing framework)
