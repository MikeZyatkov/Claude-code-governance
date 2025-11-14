import 'reflect-metadata'
import { Logger } from '@sailplane/logger'
import { inject, injectable } from 'tsyringe'
import { OccupierCreated } from 'contexts/tenant-management/domain/events/OccupierCreated'
import { OccupierDecommissionScheduled } from 'contexts/tenant-management/domain/events/OccupierDecommissionScheduled'
import { IEventBridgePublisher } from 'contexts/tenant-management/application/ports/IEventBridgePublisher'
import { IOccupierReader } from 'contexts/tenant-management/application/ports/IOccupierReader'
import { ISiteReader } from 'contexts/tenant-management/application/ports/ISiteReader'

const logger = new Logger('OccupierEventBridgeProjector')

/**
 * POOR: EventBridge projector that queries RDS projections
 *
 * ANTIPATTERN: This EventBridge projector depends on RDS read models (projections).
 * This creates tight coupling between integration concerns and read model concerns,
 * introduces ordering dependencies, and violates separation of concerns.
 *
 * EventBridge projectors should only transform events directly, not query read models.
 */
@injectable()
export class OccupierEventBridgeProjector {
  constructor(
    @inject('IEventBridgePublisher')
    private readonly _eventBridgePublisher: IEventBridgePublisher,
    // VIOLATION: EventBridge projector depending on RDS read model readers
    @inject('IOccupierReader')
    private readonly _occupierReader: IOccupierReader,
    @inject('ISiteReader')
    private readonly _siteReader: ISiteReader
  ) {}

  async handle(eventType: string, eventData: Object): Promise<void> {
    switch (eventType) {
      case OccupierCreated.typename:
        logger.info('Publishing OccupierCreated to EventBridge:', eventData)
        await this._handleOccupierCreated(eventData as OccupierCreated)
        break
      case OccupierDecommissionScheduled.typename:
        logger.info('Publishing OccupierDecommissionScheduled to EventBridge:', eventData)
        await this._handleOccupierDecommissionScheduled(eventData as OccupierDecommissionScheduled)
        break
      default:
        logger.info(`Skipping EventBridge publishing for unknown event type: ${eventType}`)
    }
  }

  private async _handleOccupierCreated(event: OccupierCreated): Promise<void> {
    logger.info(`Publishing OccupierCreated event to EventBridge for occupier ${event.id}`)

    try {
      // VIOLATION: Querying RDS projection to get additional data
      // This creates coupling between EventBridge projector and RDS read models
      const occupierProjection = await this._occupierReader.getOccupierById(
        event.operatorAccountId,
        event.id
      )

      if (!occupierProjection) {
        throw new Error(`Occupier projection not found: ${event.id}`)
      }

      // VIOLATION: Querying site projection to enrich the EventBridge payload
      // This means EventBridge projector depends on Site RDS projector running first
      const siteProjection = await this._siteReader.getSiteById(
        event.operatorAccountId,
        event.billingSiteId || ''
      )

      // PROBLEM: Publishing enriched data from projections instead of event data
      await this._eventBridgePublisher.publishOccupierCreated({
        occupierId: event.id,
        occupierName: occupierProjection.occupier_name, // From RDS projection
        operatorAccountId: event.operatorAccountId,
        intelligenceEnabled: occupierProjection.intelligence_enabled, // From RDS projection
        billingSiteId: occupierProjection.billing_site, // From RDS projection
        // VIOLATION: Data from site projection
        billingSiteName: siteProjection?.site_name || 'Unknown',
        billingSiteTimezone: siteProjection?.timezone || 'UTC',
        createdBy: event.createdBy,
        createdAt: event.timestamp
      })

      logger.info(`Successfully published OccupierCreated event to EventBridge for occupier ${event.id}`)
    } catch (error) {
      logger.error(`Failed to publish OccupierCreated event to EventBridge for occupier ${event.id}:`, error)
    }
  }

  private async _handleOccupierDecommissionScheduled(event: OccupierDecommissionScheduled): Promise<void> {
    logger.info(`Publishing OccupierDecommissionScheduled event to EventBridge for occupier ${event.occupierId}`)

    try {
      // VIOLATION: Querying RDS projection to get occupier name
      const occupierProjection = await this._occupierReader.getOccupierById(
        event.operatorAccountId,
        event.occupierId
      )

      // PROBLEM: EventBridge payload depends on read model data
      // This creates tight coupling and ordering issues
      await this._eventBridgePublisher.publishOccupierDecommissionScheduled({
        occupierId: event.occupierId,
        occupierName: occupierProjection?.occupier_name || 'Unknown', // From RDS projection
        scheduledFor: event.scheduledFor,
        reason: event.reason,
        requestedBy: event.requestedBy,
        timestamp: event.timestamp
      })

      logger.info(`Successfully published OccupierDecommissionScheduled event to EventBridge for occupier ${event.occupierId}`)
    } catch (error) {
      logger.error(`Failed to publish OccupierDecommissionScheduled event to EventBridge for occupier ${event.occupierId}:`, error)
    }
  }
}