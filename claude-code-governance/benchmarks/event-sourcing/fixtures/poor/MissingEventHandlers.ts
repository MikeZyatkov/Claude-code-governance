import { AggregateRoot } from 'es-aggregates'
import { randomUUID } from 'crypto'
import { OccupierUserCreated } from '../../../../code-samples-candidates/domain/events/OccupierUserCreated'
import { OccupierUserInvited } from '../../../../code-samples-candidates/domain/events/OccupierUserInvited'
import { OccupierUserUpdated, OccupierUserChange } from '../../../../code-samples-candidates/domain/events/OccupierUserUpdated'
import { CreateOccupierUserParams } from '../../../../code-samples-candidates/domain/types/CreateOccupierUserParams'
import { UpdateOccupierUserParams } from '../../../../code-samples-candidates/domain/types/UpdateOccupierUserParams'
import { OccupierUserRole } from '../../../../code-samples-candidates/domain/types/OccupierUserRole'
import { DomainError } from '../../../../code-samples-candidates/domain/errors/DomainError'

// VIOLATION: Event-sourced aggregate with missing event handlers
export class OccupierUserMissingHandlers extends AggregateRoot {
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

  constructor() {
    super()

    // VIOLATION: Only registers handler for OccupierUserCreated
    // Missing handlers for OccupierUserInvited and OccupierUserUpdated
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

    // VIOLATION: No handler registered for OccupierUserInvited
    // VIOLATION: No handler registered for OccupierUserUpdated
  }

  public static create(params: CreateOccupierUserParams): OccupierUserMissingHandlers {
    const occupierUser = new OccupierUserMissingHandlers()

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

  // VIOLATION: Creates event but no handler registered for it
  public invite(invitedToApp: boolean, invitedToPortal: boolean, invitedBy: string): void {
    if (!invitedBy?.trim()) {
      throw new DomainError('Invited by is required')
    }

    const occupierUserInvited = new OccupierUserInvited(
      this.id,
      this._operatorAccountId,
      this._occupierId,
      this._email,
      invitedToApp,
      invitedToPortal,
      invitedBy
    )

    // applyChange() is called but no handler registered!
    // This will fail at runtime or silently not update state
    this.applyChange(occupierUserInvited)
  }

  // VIOLATION: Creates event but no handler registered for it
  public update(params: UpdateOccupierUserParams): void {
    if (!params.updatedBy?.trim()) {
      throw new DomainError('Updated by is required')
    }

    const changes: OccupierUserChange[] = []

    if (params.firstName !== undefined && params.firstName !== this._firstName) {
      if (!params.firstName?.trim()) {
        throw new DomainError('First name cannot be empty')
      }
      changes.push({ field: 'firstName', oldValue: this._firstName, newValue: params.firstName })
    }

    if (params.lastName !== undefined && params.lastName !== this._lastName) {
      if (!params.lastName?.trim()) {
        throw new DomainError('Last name cannot be empty')
      }
      changes.push({ field: 'lastName', oldValue: this._lastName, newValue: params.lastName })
    }

    if (changes.length > 0) {
      const occupierUserUpdated = new OccupierUserUpdated(
        this.id,
        this._operatorAccountId,
        this._occupierId,
        params.updatedBy,
        changes
      )

      // applyChange() is called but no handler registered!
      // Event will be created but state won't be updated
      this.applyChange(occupierUserUpdated)
    }
  }
}

// Problems with this approach:
// 1. Events created but state not updated (no handlers)
// 2. Aggregate state out of sync with event stream
// 3. Cannot replay events (handlers missing)
// 4. Runtime errors or silent failures
// 5. Incomplete event sourcing implementation
