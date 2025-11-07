# Implementation Plan: CQRS Command Handlers

**Feature**: tenant-management-commands
**Date**: 2025-11-07

## Overview

This plan describes the implementation of command handlers following the CQRS (Command Query Responsibility Segregation) pattern. Command handlers are responsible for orchestrating write operations in the application layer, coordinating between domain aggregates and repositories without containing business logic themselves.

## Pattern Compliance

### Pattern: CQRS Commands (v1)

**Key tactics**:
- `orchestration-not-logic`: Command handlers orchestrate, don't contain business logic
- `return-void-or-id`: Handlers return void or aggregate ID, never full aggregates
- `dependency-injection`: Use @injectable decorator and inject repositories
- `single-responsibility`: One handler per command type
- `idempotent-operations`: Handlers should be safely retryable
- `error-propagation`: Let domain errors bubble up, don't transform them

**Constraints**:
- MUST NOT contain business validation logic (belongs in domain)
- MUST NOT return domain aggregates (breaks CQRS separation)
- MUST use dependency injection
- SHOULD be idempotent where possible

**Risks**:
- Placing business logic in handler instead of aggregate
- Returning full aggregates exposes domain internals
- Handler performing repository queries for business rules
- Handler containing validation logic

## Implementation Details

### CreateOccupierCommandHandler

**Responsibility**: Create new occupier entity in the system

**Orchestration Pattern**:
1. Generate new ID
2. Map API request to domain parameters
3. Call aggregate factory method: `Occupier.create(params)`
4. Save aggregate via repository
5. Return aggregate ID

**Why This Works**:
- Business validation is in `Occupier.create()`, not the handler
- Returns only the ID, not the full aggregate
- Handler is pure orchestration with no business logic
- Uses dependency injection properly

### Anti-Patterns to Avoid

**Business Logic in Handler**:
```typescript
// WRONG: Validation in handler
if (command.name.length < 3) {
  throw new Error('Name too short')
}
```

**Returning Aggregates**:
```typescript
// WRONG: Returns full domain object
async handle(command: CreateCommand): Promise<Occupier> {
  const occupier = Occupier.create(params)
  await this._repository.save(occupier)
  return occupier // Exposes domain internals!
}
```

**Repository Queries for Business Rules**:
```typescript
// WRONG: Business rule checking in handler
const existing = await this._repository.findByName(command.name)
if (existing.length > 0) {
  throw new Error('Duplicate name')
}
```

## Expected Pattern Scores

### Excellent Implementation
- Overall Score: ≥ 4.5
- All critical tactics: 5.0
- Clean orchestration with no business logic
- Proper return types (void or ID)
- Dependency injection configured

### Poor Implementation (Business Logic)
- Overall Score: < 4.0
- `orchestration-not-logic` tactic: ≤ 3
- Contains validation, business rules, or domain logic
- Should be refactored to move logic into aggregate

### Poor Implementation (Returns Aggregate)
- Overall Score: < 4.0
- `return-void-or-id` tactic: ≤ 3
- Exposes domain internals
- Breaks command/query separation
- Should return void or ID only
