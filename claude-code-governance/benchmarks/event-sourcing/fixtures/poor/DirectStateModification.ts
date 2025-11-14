import { AggregateRoot } from 'es-aggregates'
import { randomUUID } from 'crypto'
import { OccupierUserCreated } from '../../../../code-samples-candidates/domain/events/OccupierUserCreated'
import { OccupierUserInvited } from '../../../../code-samples-candidates/domain/events/OccupierUserInvited'
import { CreateOccupierUserParams } from '../../../../code-samples-candidates/domain/types/CreateOccupierUserParams'
import { OccupierUserRole } from '../../../../code-samples-candidates/domain/types/OccupierUserRole'
import { DomainError } from '../../../../code-samples-candidates/domain/errors/DomainError'

// VIOLATION: Event-sourced aggregate that bypasses event sourcing
export class OccupierUserDirectModification extends AggregateRoot {
  public id: string
  private _operatorAccountId: string
  private _occupierId: string
  private _email: string
  private _firstName: string
  private _lastName: string
  private _role: OccupierUserRole
  private _createdBy: string
  private _invitedToApp: boolean = false
  private _invitedToPortal: boolean = false

  get operatorAccountId(): string {
    return this._operatorAccountId
  }

  get invitedToApp(): boolean {
    return this._invitedToApp
  }

  get invitedToPortal(): boolean {
    return this._invitedToPortal
  }

  constructor() {
    super()

    // Event handlers ARE registered (which is good)
    this.register(OccupierUserCreated.typename, (event: OccupierUserCreated) => {
      this.id = event.userId
      this._operatorAccountId = event.operatorAccountId
      this._occupierId = event.occupierId
      this._email = event.email
      this._firstName = event.firstName
      this._lastName = event.lastName
      this._role = event.role
      this._createdBy = event.createdBy
    })

    this.register(OccupierUserInvited.typename, (event: OccupierUserInvited) => {
      this._invitedToApp = event.invitedToApp
      this._invitedToPortal = event.invitedToPortal
    })
  }

  public static create(params: CreateOccupierUserParams): OccupierUserDirectModification {
    const occupierUser = new OccupierUserDirectModification()

    if (!params.email?.trim()) {
      throw new DomainError('Email is required')
    }

    const userId = params.id || randomUUID()

    const occupierUserCreated = new OccupierUserCreated(
      userId,
      params.operatorAccountId,
      params.occupierId,
      params.email,
      params.firstName,
      params.lastName,
      params.role,
      params.phone,
      params.mobile,
      params.jobTitle,
      params.language || 'en',
      params.createdBy,
      params.cardUid,
      params.accessControlEnabled,
      params.offlineAccessEnabled,
      params.provisioningCredentialIdentifier
    )

    occupierUser.applyChange(occupierUserCreated)
    return occupierUser
  }

  // VIOLATION: Direct state modification bypassing applyChange()
  public invite(invitedToApp: boolean, invitedToPortal: boolean, invitedBy: string): void {
    if (!invitedBy?.trim()) {
      throw new DomainError('Invited by is required')
    }

    // VIOLATION: Directly modifying state without creating an event
    this._invitedToApp = invitedToApp
    this._invitedToPortal = invitedToPortal

    // No event created! This bypasses event sourcing entirely
  }

  // VIOLATION: Public setters allowing direct state mutation
  public setEmail(email: string): void {
    this._email = email
  }

  // VIOLATION: Update method with direct field assignment
  public updateName(firstName: string, lastName: string): void {
    // Business validation
    if (!firstName?.trim() || !lastName?.trim()) {
      throw new DomainError('Names cannot be empty')
    }

    // VIOLATION: Direct state mutation bypassing applyChange()
    this._firstName = firstName
    this._lastName = lastName

    // No event created or applied! Event sourcing is bypassed
  }
}

// Problems with this approach:
// 1. State changes don't create events (lost audit trail)
// 2. Cannot replay aggregate state from events
// 3. Event sourcing is effectively disabled for these methods
// 4. Inconsistent - some methods use events, others don't
// 5. Breaks event-driven architecture and integration
