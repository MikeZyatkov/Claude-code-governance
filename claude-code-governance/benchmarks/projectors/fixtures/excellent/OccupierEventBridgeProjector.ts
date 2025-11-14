import 'reflect-metadata'
import { Logger } from '@sailplane/logger'
import { inject, injectable } from 'tsyringe'
import { OccupierCreated } from 'contexts/tenant-management/domain/events/OccupierCreated'
import { OccupierDecommissionScheduled } from 'contexts/tenant-management/domain/events/OccupierDecommissionScheduled'
import { OccupierRecommissioned } from 'contexts/tenant-management/domain/events/OccupierRecommissioned'
import { IEventBridgePublisher } from 'contexts/tenant-management/application/ports/IEventBridgePublisher'

const logger = new Logger('OccupierEventBridgeProjector')

/**
 * EXCELLENT: EventBridge projector that only transforms events directly
 *
 * This projector publishes domain events to EventBridge for external system integration.
 * It does NOT query RDS projections, maintaining clear separation between integration
 * and read model concerns. All data needed comes directly from the domain events.
 */
@injectable()
export class OccupierEventBridgeProjector {
  constructor(
    @inject('IEventBridgePublisher')
    private readonly _eventBridgePublisher: IEventBridgePublisher
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
      case OccupierRecommissioned.typename:
        logger.info('Publishing OccupierRecommissioned to EventBridge:', eventData)
        await this._handleOccupierRecommissioned(eventData as OccupierRecommissioned)
        break
      default:
        logger.info(`Skipping EventBridge publishing for unknown event type: ${eventType}`)
    }
  }

  private async _handleOccupierCreated(event: OccupierCreated): Promise<void> {
    logger.info(`Publishing OccupierCreated event to EventBridge for occupier ${event.id}`)

    try {
      // GOOD: All data comes from the event directly
      // No queries to RDS projections - maintains clean separation
      await this._eventBridgePublisher.publishOccupierCreated({
        occupierId: event.id,
        occupierName: event.occupierName,
        operatorAccountId: event.operatorAccountId,
        intelligenceEnabled: event.intelligenceEnabled,
        billingSiteId: event.billingSiteId,
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
      // GOOD: Transform event data directly without external queries
      await this._eventBridgePublisher.publishOccupierDecommissionScheduled({
        occupierId: event.occupierId,
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

  private async _handleOccupierRecommissioned(event: OccupierRecommissioned): Promise<void> {
    logger.info(`Publishing OccupierRecommissioned event to EventBridge for occupier ${event.occupierId}`)

    try {
      // GOOD: Pure transformation - event data only
      await this._eventBridgePublisher.publishOccupierRecommissioned({
        occupierId: event.occupierId,
        recommissionedBy: event.recommissionedBy,
        timestamp: event.timestamp
      })

      logger.info(`Successfully published OccupierRecommissioned event to EventBridge for occupier ${event.occupierId}`)
    } catch (error) {
      logger.error(`Failed to publish OccupierRecommissioned event to EventBridge for occupier ${event.occupierId}:`, error)
    }
  }
}