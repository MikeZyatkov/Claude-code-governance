import 'reflect-metadata'
import { Logger } from '@sailplane/logger'
import { inject, injectable } from 'tsyringe'
import { OccupierCreated } from 'contexts/tenant-management/domain/events/OccupierCreated'
import { OccupierContractCreated } from 'contexts/tenant-management/domain/events/OccupierContractCreated'
import { OccupierProjectionDTO } from '../types/OccupierProjectionDTO'
import { ContractProjectionDTO } from '../types/ContractProjectionDTO'
import { IOccupierRDSWriter } from '../ports/IOccupierRDSWriter'
import { IContractRDSWriter } from '../ports/IContractRDSWriter'
import { ISiteReader } from '../ports/ISiteReader'

const logger = new Logger('OccupierProjector')

/**
 * POOR EXAMPLE: Projector with business validation
 *
 * VIOLATIONS:
 * - Contains business validation logic
 * - Enforces business rules
 * - Not pure transformation
 */
@injectable()
export class OccupierProjector {
  constructor(
    @inject('IOccupierRDSWriter')
    private readonly _occupierRDSWriter: IOccupierRDSWriter,
    @inject('IContractRDSWriter')
    private readonly _contractRDSWriter: IContractRDSWriter,
    @inject('ISiteReader')
    private readonly _siteReader: ISiteReader
  ) {}

  async handle(eventType: string, eventData: object): Promise<void> {
    switch (eventType) {
      case OccupierCreated.typename:
        logger.info('OccupierCreated Event Received:', eventData)
        await this._handleOccupierCreated(eventData as OccupierCreated)
        break
      case OccupierContractCreated.typename:
        logger.info('OccupierContractCreated Event Received:', eventData)
        await this._handleOccupierContractCreated(eventData as OccupierContractCreated)
        break
      default:
        logger.info(`Skipping event of unknown type: ${eventType}`)
    }
  }

  private async _handleOccupierCreated(event: OccupierCreated): Promise<void> {
    logger.info(`Projecting OccupierCreated event for occupier ${event.id}`)

    // VIOLATION: Business validation in projector
    // This should have been validated in the aggregate before the event was emitted
    if (!event.occupierName || event.occupierName.trim() === '') {
      logger.error('Invalid occupier name, skipping projection')
      throw new Error('Occupier name is required')
    }

    // VIOLATION: Business rule checking
    if (event.occupierName.length < 3) {
      logger.error('Occupier name too short, skipping projection')
      throw new Error('Occupier name must be at least 3 characters')
    }

    // VIOLATION: Checking for duplicates (business logic)
    const existingOccupier = await this._occupierRDSWriter.findByName(event.occupierName)
    if (existingOccupier) {
      logger.error('Duplicate occupier name detected, skipping projection')
      throw new Error(`Occupier with name '${event.occupierName}' already exists`)
    }

    const occupierProjection = new OccupierProjectionDTO(event)
    await this._occupierRDSWriter.writeOccupier(occupierProjection)

    logger.info(`Successfully projected OccupierCreated event for occupier ${event.id}`)
  }

  private async _handleOccupierContractCreated(event: OccupierContractCreated): Promise<void> {
    logger.info(`Projecting OccupierContractCreated event for contract ${event.id}`)

    const site = await this._siteReader.getSiteById(event.operatorAccountId, event.siteId)
    if (!site) {
      logger.error(`Site not found: ${event.siteId}`)
      throw new Error(`Site not found: ${event.siteId}`)
    }

    // VIOLATION: Business validation on dates
    // These rules should be in the domain, not the projector
    const now = new Date()
    if (event.startDate < now) {
      logger.error('Contract start date is in the past')
      throw new Error('Contract start date cannot be in the past')
    }

    if (event.endDate <= event.startDate) {
      logger.error('Contract end date must be after start date')
      throw new Error('Contract end date must be after start date')
    }

    const contractProjection = new ContractProjectionDTO(event, event.operatorAccountId)
    await this._contractRDSWriter.writeContract(contractProjection)

    logger.info(`Successfully projected OccupierContractCreated event for contract ${event.id}`)
  }
}
