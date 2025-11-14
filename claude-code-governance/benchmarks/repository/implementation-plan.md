# Repository Benchmark Implementation Plan

## Pattern Rules

1. **Interface-Based** - Repository is an interface, not implementation
2. **Extends IRepository** - Uses event sourcing repository base
3. **Data Access Only** - No business logic or validation
4. **Returns Aggregates** - Not DTOs or projections
5. **CRUD Operations** - Simple read/write methods
6. **Single Responsibility** - Only handles persistence

## Fixtures

- **Excellent**: IOccupierRepository - Simple interface extending IRepository
- **Poor 1**: RepositoryWithBusinessLogic - Contains validation and business rules
- **Poor 2**: RepositoryReturningDTOs - Returns DTOs, mixes query concerns

## Expected Scores
- Excellent: ≥ 4.5 (perfect repository interface)
- Business logic: < 4.0 (repository knows too much)
- DTOs: < 4.0 (violates CQRS, mixes concerns)
