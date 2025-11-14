# Domain Events Fixtures

This directory contains test fixtures for validating domain event pattern evaluation.

## Fixtures

### Excellent

**OccupierCreated.ts** (Expected: ≥ 4.5)
- ✅ Extends EventBase
- ✅ Immutable properties (readonly)
- ✅ Past-tense naming (Created, not Create)
- ✅ Static typename identifier
- ✅ Self-contained (all data for replay)
- ✅ No methods (pure data container)
- ✅ Serializable data types only

**Why it scores high:**
- All critical domain event tactics present
- Pure immutable data structure
- Self-contained for event sourcing
- Follows naming conventions

### Poor

**MutableDomainEvent.ts** (Expected: < 4.0)
- ❌ Mutable properties (no readonly)
- ❌ Methods that modify state
- ❌ Business logic in event
- ❌ Can be mutated after creation

**Violations:**
- `immutable-properties`: Properties not readonly
- `no-methods`: Has methods that modify state and contain logic
- `data-only`: Contains business logic validation

**Why it scores low:**
Domain events must be immutable facts about the past. This fixture violates immutability by allowing mutation and containing behavior.

---

**EventWithAggregateReference.ts** (Expected: < 4.0)
- ❌ Contains aggregate instance reference
- ❌ Not self-contained (aggregate has methods)
- ❌ Methods on event
- ❌ Cannot be properly serialized/deserialized

**Violations:**
- `self-contained-events`: References aggregate instead of data
- `no-aggregate-references`: Contains aggregate type
- `serializable-data`: Aggregate instances not serializable
- `no-methods`: Has getter methods

**Why it scores low:**
Events must be self-contained data for event sourcing. Storing aggregate references prevents proper serialization and replay.

## Pattern Expectations

Domain events should:
1. Be immutable (readonly properties)
2. Extend EventBase or similar base
3. Use past-tense naming
4. Be self-contained (no references to aggregates)
5. Contain only serializable data
6. Have no methods (pure data)
7. Include static typename identifier
8. Represent facts about domain changes

## Scoring Guidelines

- **5.0**: Perfect domain event with all best practices
- **4.5-5.0**: Excellent implementation, minor optional improvements
- **4.0-4.5**: Good implementation with some issues
- **< 4.0**: Missing critical tactics or fundamental violations
