import 'reflect-metadata'
import { Logger } from '@sailplane/logger'
import { inject, injectable } from 'tsyringe'
import { OccupierCreated } from 'contexts/tenant-management/domain/events/OccupierCreated'
import { OccupierContractCreated } from 'contexts/tenant-management/domain/events/OccupierContractCreated'
import { OccupierProjectionDTO } from '../types/OccupierProjectionDTO'
import { ContractProjectionDTO } from '../types/ContractProjectionDTO'
import { IOccupierRDSWriter } from '../ports/IOccupierRDSWriter'
import { IContractRDSWriter } from '../ports/IContractRDSWriter'
import { IEventPublisher } from '../ports/IEventPublisher'
import { OccupierProjectionCreated } from '../events/OccupierProjectionCreated'
import { ContractProjectionCreated } from '../events/ContractProjectionCreated'

const logger = new Logger('OccupierProjector')

/**
 * POOR EXAMPLE: Projector that emits domain events
 *
 * VIOLATIONS:
 * - Emits new domain events
 * - Not passive (has side effects beyond writing to read model)
 * - Creates cascading event chains
 */
@injectable()
export class OccupierProjector {
  constructor(
    @inject('IOccupierRDSWriter')
    private readonly _occupierRDSWriter: IOccupierRDSWriter,
    @inject('IContractRDSWriter')
    private readonly _contractRDSWriter: IContractRDSWriter,
    @inject('IEventPublisher')
    private readonly _eventPublisher: IEventPublisher
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

    const occupierProjection = new OccupierProjectionDTO(event)
    await this._occupierRDSWriter.writeOccupier(occupierProjection)

    // VIOLATION: Projector emitting a new domain event
    // Projectors should be passive consumers, not event producers
    const projectionCreatedEvent = new OccupierProjectionCreated({
      occupierId: event.id,
      projectedAt: new Date(),
      projectionType: 'occupier'
    })

    // VIOLATION: Publishing events creates cascading event chains
    await this._eventPublisher.publish(projectionCreatedEvent)

    logger.info(`Emitted OccupierProjectionCreated event for occupier ${event.id}`)

    // VIOLATION: Triggering notifications (side effect)
    await this._eventPublisher.publishNotification({
      type: 'occupier_created',
      occupierId: event.id
    })

    logger.info(`Successfully projected OccupierCreated event for occupier ${event.id}`)
  }

  private async _handleOccupierContractCreated(event: OccupierContractCreated): Promise<void> {
    logger.info(`Projecting OccupierContractCreated event for contract ${event.id}`)

    const contractProjection = new ContractProjectionDTO(event, event.operatorAccountId)
    await this._contractRDSWriter.writeContract(contractProjection)

    // VIOLATION: Emitting events about projection completion
    const projectionCreatedEvent = new ContractProjectionCreated({
      contractId: event.id,
      projectedAt: new Date(),
      projectionType: 'contract'
    })
    await this._eventPublisher.publish(projectionCreatedEvent)

    // VIOLATION: Triggering workflow events (should use separate mechanism)
    await this._eventPublisher.publishWorkflowEvent({
      workflow: 'contract_created',
      contractId: event.id,
      occupierId: event.occupierId
    })

    logger.info(`Successfully projected OccupierContractCreated event for contract ${event.id}`)
  }
}
