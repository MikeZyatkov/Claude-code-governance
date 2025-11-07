/* eslint-disable class-methods-use-this */
import 'reflect-metadata'
import { inject, injectable } from 'tsyringe'
import { Logger } from '@sailplane/logger'
import { randomUUID } from 'crypto'
import { IOccupierRepository } from 'contexts/tenant-management/domain/repositories/IOccupierRepository'
import { Occupier } from 'contexts/tenant-management/domain/model/Occupier.aggregate'
import { CreateOccupierCommand } from './CreateOccupierCommand'
import { OccupierApiMapper } from '../../infrastructure/mappers/OccupierApiMapper'

const logger = new Logger('CreateOccupierCommandHandler')

@injectable()
export class CreateOccupierCommandHandler {
  constructor(
    @inject('IOccupierRepository')
    private readonly _occupierRepository: IOccupierRepository
  ) {}

  // VIOLATION: Returns domain aggregate instead of void or ID
  async handle(command: CreateOccupierCommand): Promise<Occupier> {
    logger.info('Handling CreateOccupierCommand...', command)

    const occupierId = this._generateOccupierId()

    // Map API request to domain parameters
    const domainParams = OccupierApiMapper.fromApiRequestToDomainParams(
      command.operatorAccountId,
      command.occupierData,
      command.audit || 'system'
    )
    domainParams.id = occupierId

    const occupier = Occupier.create(domainParams)
    logger.info('Occupier aggregate created', occupier.id)

    await this._occupierRepository.writeAsync(occupier)
    logger.info('Occupier saved to repository', occupier.id)

    logger.info('Occupier creation completed successfully', { occupier_id: occupierId })

    // VIOLATION: Returning full domain aggregate exposes internal domain structure
    // Should return void or just the ID
    return occupier
  }

  private _generateOccupierId(): string {
    return randomUUID()
  }
}
