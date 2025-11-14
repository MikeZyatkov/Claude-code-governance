# Repository Fixtures

## Excellent: IOccupierRepository.ts (Expected: ≥ 4.5)
- ✅ Interface-based
- ✅ Extends IRepository
- ✅ Simple data access contract
- ✅ No business logic
- ✅ Returns aggregates only

## Poor: RepositoryWithBusinessLogic.ts (Expected: < 4.0)
- ❌ Contains business validation
- ❌ Business rule checking
- ❌ Complex queries with logic
- ❌ Violates single responsibility

## Poor: RepositoryReturningDTOs.ts (Expected: < 4.0)
- ❌ Returns DTOs instead of aggregates
- ❌ Query-specific methods
- ❌ Mixes command and query concerns
- ❌ Violates CQRS principles
