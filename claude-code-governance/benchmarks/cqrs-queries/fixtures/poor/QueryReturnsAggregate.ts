import { inject, injectable } from 'tsyringe'
import { Logger } from '@sailplane/logger'
import { GetOccupierByIdQuery } from './GetOccupierByIdQuery'
import { IOccupierRepository } from '../../domain/repositories/IOccupierRepository'
import { Occupier } from '../../domain/model/Occupier.aggregate'
import { OccupierNotFoundError } from '../errors/OccupierNotFoundError'

const logger = new Logger('GetOccupierByIdQueryHandler')

@injectable()
export class GetOccupierByIdQueryHandler {
  constructor(
    @inject('IOccupierRepository')
    private readonly _occupierRepository: IOccupierRepository
  ) {}

  // VIOLATION: Returns domain aggregate instead of DTO
  // This exposes internal domain structure to the application/presentation layer
  async handle(query: GetOccupierByIdQuery): Promise<Occupier> {
    logger.info('Handling GetOccupierByIdQuery', query)
    const occupier = await this._occupierRepository.readAsync(query.occupierId)

    if (!occupier) {
      throw new OccupierNotFoundError(query.occupierId)
    }

    try {
      logger.info(`Retrieved occupier ${query.occupierId}`)

      // VIOLATION: Returning the full aggregate with all its methods and internal state
      // Should map to a flat DTO instead
      return occupier
    } catch (error) {
      logger.error('Error getting occupier by ID:', error)
      throw error
    }
  }
}
