import { IRepository } from 'es-aggregates'
import { Occupier } from '../../../../code-samples-candidates/domain/model/Occupier.aggregate'

// VIOLATION: Repository returns DTOs instead of aggregates

/**
 * Mock DTO types for demonstration
 */
export interface OccupierDTO {
  id: string
  name: string
  operatorId: string
}

export interface OccupierListItemDTO {
  id: string
  name: string
  siteCount: number
}

export interface OccupierDetailsDTO extends OccupierDTO {
  sites: string[]
  contracts: string[]
  metrics: {
    totalRevenue: number
    activeSites: number
  }
}

/**
 * VIOLATION: Repository mixes command (aggregate) and query (DTO) concerns
 */
export interface IOccupierRepositoryWithDTOs extends IRepository<Occupier> {
  // Standard aggregate methods (good)
  readAsync(id: string): Promise<Occupier | null>
  writeAsync(aggregate: Occupier): Promise<void>

  // VIOLATION: Returns DTO instead of aggregate
  getOccupierSummary(id: string): Promise<OccupierDTO>

  // VIOLATION: Query-specific method returning DTOs
  listOccupiers(operatorId: string, page: number, limit: number): Promise<OccupierListItemDTO[]>

  // VIOLATION: Complex query with joined data
  getOccupierWithDetails(id: string): Promise<OccupierDetailsDTO>

  // VIOLATION: Search method with DTOs
  searchOccupiersByName(query: string): Promise<OccupierListItemDTO[]>

  // VIOLATION: Filtering and projection
  getActiveOccupiersForOperator(operatorId: string): Promise<OccupierDTO[]>
}

// Problems with this approach:
// 1. Mixes command (write aggregates) and query (read DTOs) concerns
// 2. Repository returns both aggregates and DTOs
// 3. CQRS principle violated (no separation of read/write)
// 4. Query methods should be in separate read models/query handlers
// 5. Repository does more than CRUD operations
// 6. DTOs leak into domain layer
