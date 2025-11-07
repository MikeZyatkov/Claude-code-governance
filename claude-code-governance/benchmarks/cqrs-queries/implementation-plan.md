# Implementation Plan: CQRS Query Handlers

**Feature**: tenant-management-queries
**Date**: 2025-11-07

## Overview

This plan describes the implementation of query handlers following the CQRS (Command Query Responsibility Segregation) pattern. Query handlers are responsible for read operations in the application layer, retrieving data and mapping it to DTOs without causing any state modifications.

## Pattern Compliance

### Pattern: CQRS Queries (v1)

**Key tactics**:
- `queries-no-state-modification`: Queries must be read-only, no writes
- `queries-return-dtos`: Return flat DTOs, never domain aggregates
- `queries-read-without-modifications`: Read from repo → map to DTO → return
- `dependency-injection`: Use @injectable and inject repositories
- `error-propagation`: Let domain errors bubble up

**Constraints**:
- MUST NOT modify any state (no repository.save(), no aggregate method calls)
- MUST NOT return domain aggregates (breaks CQRS separation)
- MUST return DTOs or read models
- SHOULD be idempotent (calling multiple times has same result)

**Risks**:
- Modifying state in query handler (timestamps, cache updates, etc.)
- Calling aggregate business methods
- Returning full aggregates exposes domain internals
- Querying for one thing but updating something else as side effect

## Implementation Details

### GetOccupierByIdQueryHandler

**Responsibility**: Retrieve occupier data by ID

**Query Pattern**:
1. Read aggregate from repository
2. Check if exists (throw error if not)
3. Map to DTO with only necessary fields
4. Return DTO

**Why This Works**:
- Pure read operation, no state changes
- Returns DTO, not aggregate
- No business logic, just data retrieval and mapping
- Handler is idempotent

### Anti-Patterns to Avoid

**State Modification**:
```typescript
// WRONG: Query modifying state
const occupier = await this._repo.readAsync(id)
occupier.updateLastAccessed()  // Side effect!
await this._repo.writeAsync(occupier)
```

**Returning Aggregates**:
```typescript
// WRONG: Returns full domain object
async handle(query: GetQuery): Promise<Occupier> {
  return await this._repo.readAsync(query.id)  // Exposes domain!
}
```

**Calling Business Methods**:
```typescript
// WRONG: Calling aggregate methods in query
const occupier = await this._repo.readAsync(id)
occupier.calculateSomething()  // This is a side effect!
return occupier.toDTO()
```

## Expected Pattern Scores

### Excellent Implementation
- Overall Score: ≥ 4.5
- All critical tactics: 5.0
- Pure read operation with DTO mapping
- No state modifications
- Proper dependency injection

### Poor Implementation (Mutates State)
- Overall Score: < 4.0
- `queries-no-state-modification` tactic: ≤ 2
- Calls repository.save() or aggregate methods
- Has side effects

### Poor Implementation (Returns Aggregate)
- Overall Score: < 4.0
- `queries-return-dtos` tactic: ≤ 2
- Exposes domain internals
- Breaks CQRS separation
