# Implementation Plan: Event Projectors

**Feature**: event-projectors
**Date**: 2025-11-07

## Overview

This plan describes the implementation of event projectors following event-driven architecture patterns. Projectors consume domain events and project them into read models (denormalized views) optimized for queries, without performing business validation or emitting new domain events.

## Pattern Compliance

### Pattern: Projectors and Read Models (v1)

**Key tactics**:
- `pure-transformation`: Event → DTO → write to read model, no business logic
- `passive-consumer`: Consume events, don't emit new domain events
- `idempotent-handling`: Replaying same event produces same result
- `no-business-validation`: Business rules belong in aggregates, not projectors
- `fetch-supplementary-data`: Can query for data needed to build projection

**Constraints**:
- MUST NOT validate business rules (already validated before event emission)
- MUST NOT emit domain events (projectors are passive)
- MUST be idempotent (safe to replay)
- SHOULD handle events independently

**Risks**:
- Adding business validation in projector
- Emitting new domain events
- Calling aggregate methods
- Creating event cascades

## Implementation Details

### OccupierProjector

**Responsibility**: Project occupier-related events to RDS read models

**Projector Pattern**:
1. Receive domain event
2. Transform to DTO
3. Fetch supplementary data if needed (timezone, references)
4. Write to read model
5. Done (no further events)

**Why This Works**:
- Pure transformation, no business logic
- Doesn't emit events (passive consumer)
- Idempotent (writing same projection twice = same result)
- Can fetch data needed for projection (acceptable)

### Anti-Patterns to Avoid

**Business Validation**:
```typescript
// WRONG: Validating in projector
if (event.name.length < 3) {
  throw new Error('Name too short')
}
```

**Emitting Domain Events**:
```typescript
// WRONG: Projector emitting events
await this._eventBus.publish(new ProjectionCreated())
```

**Calling Aggregate Methods**:
```typescript
// WRONG: Loading and calling domain logic
const aggregate = await repo.get(id)
aggregate.doSomething()
```

## Expected Pattern Scores

### Excellent Implementation
- Overall Score: ≥ 4.5
- Pure transformation logic
- No validation, no events emitted
- Idempotent
- Proper dependency injection

### Poor Implementation (Business Validation)
- Overall Score: < 4.0
- `no-business-validation` tactic: ≤ 2
- Contains validation logic
- Checks business rules

### Poor Implementation (Emits Events)
- Overall Score: < 4.0
- `passive-consumer` tactic: ≤ 2
- Publishes new domain events
- Creates event cascades
