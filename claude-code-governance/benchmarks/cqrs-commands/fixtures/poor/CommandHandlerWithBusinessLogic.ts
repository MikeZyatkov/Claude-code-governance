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

  async handle(command: CreateOccupierCommand): Promise<string> {
    logger.info('Handling CreateOccupierCommand...', command)

    const occupierId = this._generateOccupierId()

    // VIOLATION: Business validation logic in command handler instead of aggregate
    if (!command.occupierData.name || command.occupierData.name.trim() === '') {
      throw new Error('Occupier name is required')
    }

    if (command.occupierData.name.length < 3) {
      throw new Error('Occupier name must be at least 3 characters')
    }

    if (command.occupierData.name.length > 100) {
      throw new Error('Occupier name must not exceed 100 characters')
    }

    // VIOLATION: Business rule checking in handler
    const existingOccupiers = await this._occupierRepository.findByNameAsync(command.occupierData.name)
    if (existingOccupiers.length > 0) {
      throw new Error('Occupier with this name already exists')
    }

    // VIOLATION: Additional business logic for email validation
    if (command.occupierData.email && !this._isValidEmail(command.occupierData.email)) {
      throw new Error('Invalid email format')
    }

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
    return occupierId
  }

  private _generateOccupierId(): string {
    return randomUUID()
  }

  // VIOLATION: Business logic method in command handler
  private _isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}
