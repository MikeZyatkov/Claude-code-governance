# Event Sourcing Fixtures

This directory contains test fixtures for validating event sourcing pattern evaluation.

## Fixtures

### Excellent

**OccupierUser.aggregate.ts** (Expected: ≥ 4.5)
- ✅ Extends AggregateRoot (event-sourced base)
- ✅ Event handlers registered in constructor
- ✅ All state changes via applyChange()
- ✅ Business methods create events
- ✅ No direct state mutation outside handlers
- ✅ Handler for every event type
- ✅ Complete event sourcing implementation

**Why it scores high:**
- All critical event sourcing tactics present
- Perfect separation of business logic and state application
- Complete event handlers for all events
- Can replay aggregate state from events

### Poor

**DirectStateModification.ts** (Expected: < 4.0)
- ❌ Business methods bypass applyChange()
- ❌ Direct field assignment without events
- ❌ Public setters allow mutation
- ❌ Inconsistent - some methods use events, others don't

**Violations:**
- `apply-via-events`: State changed without applyChange()
- `no-direct-state-mutation`: Direct field assignment
- `consistent-event-sourcing`: Mixed approach (some events, some direct)

**Why it scores low:**
Event sourcing requires ALL state changes to go through events. This fixture bypasses event sourcing for several methods, losing audit trail and breaking replay.

---

**MissingEventHandlers.ts** (Expected: < 4.0)
- ❌ Creates events but doesn't register handlers
- ❌ applyChange() called but no handler exists
- ❌ State out of sync with event stream
- ❌ Cannot replay aggregate from events

**Violations:**
- `register-event-handlers`: Missing handler registration
- `handler-for-every-event`: Events created but no handlers
- `complete-event-sourcing`: Incomplete implementation

**Why it scores low:**
Event sourcing requires registering handlers for every event. Without handlers, applyChange() fails or silently doesn't update state, breaking the event sourcing pattern.

## Pattern Expectations

Event-sourced aggregates should:
1. Extend AggregateRoot or similar event-sourced base
2. Register event handlers in constructor
3. Create events for ALL state changes
4. Use applyChange() to apply events
5. NEVER mutate state directly (only in handlers)
6. Have handler for every event type
7. Business methods: validate → create event → applyChange()
8. Event handlers: simple state updates only

## Scoring Guidelines

- **5.0**: Perfect event sourcing with all best practices
- **4.5-5.0**: Excellent implementation, minor optional improvements
- **4.0-4.5**: Good implementation with some issues
- **< 4.0**: Missing critical tactics or fundamental violations

## Event Sourcing Flow

```
Business Method → Validation → Create Event → applyChange()
                                                     ↓
                                            Event Handler
                                                     ↓
                                              State Update
```

All state changes MUST follow this flow.
