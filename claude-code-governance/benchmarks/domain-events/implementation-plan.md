# Domain Events Benchmark Implementation Plan

## Pattern Overview

Domain Events are immutable records of significant business events that have occurred in the domain. They represent facts about state changes and are fundamental to event sourcing.

## Pattern Rules

### Critical Tactics

1. **Immutability**
   - All fields must be readonly
   - No setters or mutation methods
   - Events are facts - cannot be changed after they occur

2. **Extend Event Base**
   - Inherit from EventBase or similar
   - Include static typename
   - Follow event sourcing conventions

3. **Past-Tense Naming**
   - Event names describe what happened
   - Use past tense (Created, Updated, Deleted)
   - Not present tense or commands

4. **Self-Contained**
   - Include all data needed for event replay
   - No references to aggregates or entities
   - Only serializable primitive types
   - Complete snapshot of change

5. **No Methods**
   - Events are pure data containers
   - No business logic
   - No computed properties
   - No behavior

6. **Serializable Data**
   - All fields must be JSON-serializable
   - Primitives, arrays, plain objects only
   - No class instances, functions, or complex objects

## Fixtures Strategy

### Excellent Fixture: OccupierCreated.ts

Real production domain event demonstrating all best practices:
- Extends EventBase
- Immutable (readonly properties)
- Past-tense naming
- Self-contained data
- Static typename
- No methods

### Poor Fixture 1: MutableDomainEvent.ts

Violations:
- Mutable properties (no readonly)
- Methods that modify state
- Business logic in event
- Can be changed after creation

### Poor Fixture 2: EventWithAggregateReference.ts

Violations:
- Contains aggregate instance reference
- Not self-contained
- Has methods
- Cannot be properly serialized

## Expected Scores

- **Excellent (OccupierCreated.ts)**: ≥ 4.5
  - All critical tactics present
  - Pure immutable data structure
  - Self-contained and serializable

- **Poor (MutableDomainEvent.ts)**: < 4.0
  - Fundamental immutability violation
  - Methods on event
  - Business logic present

- **Poor (EventWithAggregateReference.ts)**: < 4.0
  - Not self-contained
  - Aggregate reference prevents serialization
  - Has methods

## Calibration Expectations

Pattern: `domain/domain-events/v1`
Calibration: `domain/domain-events/v1-scoring.yaml`

Key tactics to evaluate:
- `immutable-properties`: All fields readonly
- `extend-event-base`: Inherits from EventBase
- `past-tense-naming`: Event names in past tense
- `self-contained-events`: All data included, no references
- `no-methods`: Pure data, no behavior
- `serializable-data`: Only JSON-serializable types
- `static-typename`: Includes type identifier

## Success Criteria

- ✅ Excellent fixture scores ≥ 4.5
- ✅ Mutable fixture scores < 4.0
- ✅ Aggregate reference fixture scores < 4.0
- ✅ Low-scoring tactics identified correctly
- ✅ Recommendations include immutability and self-containment fixes

## Anti-Patterns to Detect

1. **Mutable Events**
   - Fields not readonly
   - Methods that modify state
   - Can change after creation

2. **Events with Behavior**
   - Methods on events
   - Business logic
   - Computed properties

3. **Not Self-Contained**
   - References to aggregates
   - References to entities
   - Missing data needed for replay

4. **Non-Serializable Data**
   - Class instances
   - Function references
   - Complex objects that can't be JSON-serialized

5. **Present Tense Naming**
   - CreateOccupier (command) vs OccupierCreated (event)
   - Events describe past, not future

## References

- **Pattern File**: `patterns/domain/domain-events/v1.yaml`
- **Calibration File**: `calibration/domain/domain-events/v1-scoring.yaml`
- **Code Samples**: `code-samples-candidates/domain/events/*.ts`
- **Event Sourcing**: Events are the source of truth for aggregate state
