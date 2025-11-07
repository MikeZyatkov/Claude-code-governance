import { inject, injectable } from 'tsyringe'
import { Logger } from '@sailplane/logger'
import { GetOccupierByIdQuery } from './GetOccupierByIdQuery'
import { IOccupierRepository } from '../../domain/repositories/IOccupierRepository'
import { GetOccupierByIdResponse } from '../types/GetOccupierByIdResponse'
import { OccupierNotFoundError } from '../errors/OccupierNotFoundError'

const logger = new Logger('GetOccupierByIdQueryHandler')

@injectable()
export class GetOccupierByIdQueryHandler {
  constructor(
    @inject('IOccupierRepository')
    private readonly _occupierRepository: IOccupierRepository
  ) {}

  async handle(query: GetOccupierByIdQuery): Promise<GetOccupierByIdResponse> {
    logger.info('Handling GetOccupierByIdQuery', query)
    const occupier = await this._occupierRepository.readAsync(query.occupierId)

    if (!occupier) {
      throw new OccupierNotFoundError(query.occupierId)
    }

    try {
      const response: GetOccupierByIdResponse = {
        id: occupier.id,
        operatorAccountId: occupier.operatorAccountId,
        occupierName: occupier.occupierName,
        intelligenceEnabled: occupier.intelligenceEnabled,
        billingSiteId: occupier.billingSiteId,
        createdBy: occupier.createdBy,
      }

      logger.info(`Retrieved occupier ${query.occupierId}:`, response)
      return response
    } catch (error) {
      logger.error('Error getting occupier by ID:', error)
      throw error
    }
  }
}
