import 'reflect-metadata'
import { Logger } from '@sailplane/logger'
import { inject, injectable } from 'tsyringe'
import { OccupierCreated } from 'contexts/tenant-management/domain/events/OccupierCreated'
import { OccupierContractCreated } from 'contexts/tenant-management/domain/events/OccupierContractCreated'
import { OccupancyCreated } from 'contexts/tenant-management/domain/events/OccupancyCreated'
import { OccupierProjectionDTO } from '../types/OccupierProjectionDTO'
import { ContractProjectionDTO } from '../types/ContractProjectionDTO'
import { IOccupierRDSWriter } from '../ports/IOccupierRDSWriter'
import { IContractRDSWriter } from '../ports/IContractRDSWriter'
import { TimeZoneConversionService } from '../services/TimeZoneConversionService'
import { ISiteReader } from '../ports/ISiteReader'

const logger = new Logger('OccupierProjector')

/**
 * Projector for occupier-related events
 * Projects events from event store to RDS read models
 *
 * This is an EXCELLENT example because:
 * - Pure transformation: event → DTO → write
 * - No business validation
 * - No domain event emission
 * - Idempotent (replaying same event has same result)
 * - Only fetches supplementary data needed for projection
 */
@injectable()
export class OccupierProjector {
  constructor(
    @inject('IOccupierRDSWriter')
    private readonly _occupierRDSWriter: IOccupierRDSWriter,
    @inject('IContractRDSWriter')
    private readonly _contractRDSWriter: IContractRDSWriter,
    @inject(TimeZoneConversionService)
    private readonly _timeZoneConversionService: TimeZoneConversionService,
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
      case OccupancyCreated.typename:
        logger.info('OccupancyCreated Event Received:', eventData)
        await this._handleOccupancyCreated(eventData as OccupancyCreated)
        break
      default:
        logger.info(`Skipping event of unknown type: ${eventType}`)
    }
  }

  private async _handleOccupierCreated(event: OccupierCreated): Promise<void> {
    logger.info(`Projecting OccupierCreated event for occupier ${event.id}`)

    // Pure transformation: event → DTO
    const occupierProjection = new OccupierProjectionDTO(event)

    // Write to read model
    await this._occupierRDSWriter.writeOccupier(occupierProjection)

    logger.info(`Successfully projected OccupierCreated event for occupier ${event.id}`)
  }

  private async _handleOccupierContractCreated(event: OccupierContractCreated): Promise<void> {
    logger.info(`Projecting OccupierContractCreated event for contract ${event.id}`)

    // Fetch supplementary data for projection (acceptable in projectors)
    const site = await this._siteReader.getSiteById(event.operatorAccountId, event.siteId)
    if (!site) {
      logger.error(`Site not found: ${event.siteId}`)
      throw new Error(`Site not found: ${event.siteId}`)
    }

    // Transform dates for read model (pure transformation)
    const { timezone } = site
    const { startDate, endDate } = this._timeZoneConversionService.convertContractDatesToSiteLocal(
      event.startDate,
      event.endDate,
      timezone
    )

    const eventWithLocalDates = { ...event, startDate, endDate }
    const contractProjection = new ContractProjectionDTO(eventWithLocalDates, event.operatorAccountId)

    await this._contractRDSWriter.writeContract(contractProjection)

    logger.info(`Successfully projected OccupierContractCreated event for contract ${event.id}`)
  }

  private async _handleOccupancyCreated(event: OccupancyCreated): Promise<void> {
    logger.info(`Projecting OccupancyCreated event for occupancy ${event.id}`)

    const site = await this._siteReader.getSiteById(event.operatorAccountId, event.siteId)
    if (!site) {
      logger.error(`Site not found: ${event.siteId}`)
      throw new Error(`Site not found: ${event.siteId}`)
    }

    const { timezone } = site
    const { startDate, endDate } = this._timeZoneConversionService.convertOccupancyDatesToSiteLocal(
      event.startDate,
      event.endDate,
      timezone
    )

    const eventWithLocalDates = { ...event, startDate, endDate }

    await this._contractRDSWriter.addOccupancyToContract(event.contractId, eventWithLocalDates)

    logger.info(`Successfully projected OccupancyCreated event for occupancy ${event.id}`)
  }
}
