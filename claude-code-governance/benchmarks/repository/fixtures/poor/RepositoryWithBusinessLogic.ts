import { IRepository } from 'es-aggregates'
import { Occupier } from '../../../../code-samples-candidates/domain/model/Occupier.aggregate'

// VIOLATION: Repository with business logic and validation

/**
 * VIOLATION: Repository contains business logic
 * Repositories should only handle data access, not business rules
 */
export interface IOccupierRepositoryWithLogic extends IRepository<Occupier> {
  readAsync(id: string): Promise<Occupier | null>
  writeAsync(aggregate: Occupier): Promise<void>

  // VIOLATION: Business validation in repository
  validateOccupier(occupier: Occupier): Promise<boolean>

  // VIOLATION: Business rule checking
  canDecommission(occupierId: string): Promise<boolean>

  // VIOLATION: Complex business logic query
  findActiveOccupiersWithPendingContracts(operatorId: string): Promise<Occupier[]>

  // VIOLATION: Business calculation
  calculateOccupierMetrics(occupierId: string): Promise<{
    totalSites: number
    activeContracts: number
    revenue: number
  }>

  // VIOLATION: Enforces business rules
  ensureNoDuplicateName(name: string, excludeId?: string): Promise<void>
}

// Problems with this approach:
// 1. Business logic in repository (should be in domain/application)
// 2. Repository knows about business rules
// 3. Tight coupling between persistence and business logic
// 4. Cannot test business logic without database
// 5. Violates single responsibility
// 6. Hard to change persistence without affecting business logic
