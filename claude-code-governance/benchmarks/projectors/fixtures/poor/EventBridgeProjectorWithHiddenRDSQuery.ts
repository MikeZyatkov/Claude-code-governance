import 'reflect-metadata'
import { Logger } from '@sailplane/logger'
import { inject, injectable } from 'tsyringe'
import { OccupierInformationUpdated } from 'contexts/tenant-management/domain/events/OccupierInformationUpdated'
import { IEventBridgePublisher } from 'contexts/tenant-management/application/ports/IEventBridgePublisher'

const logger = new Logger('OccupierEventBridgeProjector')

/**
 * POOR: EventBridge projector that appears clean but hides RDS query in publisher
 *
 * ANTIPATTERN: This projector looks clean on the surface - it only depends on
 * IEventBridgePublisher, not any RDS readers. However, the publisher implementation
 * queries RDS projections, creating the same coupling problem.
 *
 * The violation is hidden one layer deeper in the infrastructure adapter.
 *
 * See EventBridgePublisherWithRDSQuery.ts for the implementation that violates
 * the separation of concerns by querying the read model.
 */
@injectable()
export class OccupierEventBridgeProjector {
  constructor(
    @inject('IEventBridgePublisher')
    private readonly _eventBridgePublisher: IEventBridgePublisher
  ) {}

  async handle(eventType: string, eventData: Object): Promise<void> {
    switch (eventType) {
      case OccupierInformationUpdated.typename:
        logger.info('Publishing OccupierInformationUpdated to EventBridge:', eventData)
        await this._handleOccupierInformationUpdated(eventData as OccupierInformationUpdated)
        break
      default:
        logger.info(`Skipping EventBridge publishing for unknown event type: ${eventType}`)
    }
  }

  private async _handleOccupierInformationUpdated(event: OccupierInformationUpdated): Promise<void> {
    logger.info(`Publishing OccupierInformationUpdated event to EventBridge for occupier ${event.occupierId}`)

    try {
      // HIDDEN VIOLATION: This looks clean, but publishOccupierInformationUpdated
      // internally queries RDS to enrich the payload
      // The projector doesn't directly query RDS, but its dependency does
      await this._eventBridgePublisher.publishOccupierInformationUpdated(event)

      logger.info(`Successfully published OccupierInformationUpdated event to EventBridge for occupier ${event.occupierId}`)
    } catch (error) {
      logger.error(`Failed to publish OccupierInformationUpdated event to EventBridge for occupier ${event.occupierId}:`, error)
    }
  }
}

/**
 * INFRASTRUCTURE ADAPTER (for context)
 *
 * This is the EventBridge publisher implementation that actually violates the pattern.
 * It's in the infrastructure layer and queries RDS projections:
 */

/*
@injectable()
export class EventBridgePublisherWithRDSQuery implements IEventBridgePublisher {
  constructor(
    // VIOLATION: Infrastructure adapter depends on RDS reader
    @inject('IOccupierReader')
    private readonly _occupierReader: IOccupierReader
  ) {}

  async publishOccupierInformationUpdated(event: OccupierInformationUpdated): Promise<void> {
    // VIOLATION: Query RDS projection to get full current state
    // This creates coupling between EventBridge publishing and read model
    const occupier = await this._occupierReader.getOccupierById(
      event.operatorAccountId,
      event.occupierId
    )

    if (!occupier) {
      throw new Error(`Occupier ${event.occupierId} not found in RDS`)
    }

    // PROBLEM: EventBridge payload built from RDS projection data, not event data
    const payload = {
      occupier_id: occupier.occupier_id,
      account_id: occupier.account_id,
      occupier_name: occupier.occupier_name,        // From RDS
      tax_exempt: occupier.tax_exempt,              // From RDS
      decommission_status: occupier.decommission_status,  // From RDS
      intelligence_enabled: occupier.intelligence_enabled, // From RDS
      billing_site: occupier.billing_site,          // From RDS
    }

    await eventBridgePublish([payload], {
      eventType: EventTypes.occupierUpdated,
      eventBusName: process.env.CUD_EVENT_BUS!,
    })
  }
}
*/

/**
 * WHY THIS IS PROBLEMATIC:
 *
 * 1. COUPLING: EventBridge publishing now depends on RDS projection being populated
 * 2. ORDERING: RDS projector must run before EventBridge projector
 * 3. HIDDEN DEPENDENCY: The projector looks clean but has transitive dependency on read model
 * 4. TESTING: Can't test EventBridge publishing without database
 * 5. MIXED CONCERNS: Integration layer reaching into read model layer
 *
 * THE FIX:
 *
 * The event should contain all necessary data. If OccupierInformationUpdated doesn't
 * have all required fields, then either:
 * - Enrich the event with more data when it's published
 * - Accept that external systems get partial updates (they can query for full state)
 * - Use a different event (like OccupierSnapshot) that contains full state
 */