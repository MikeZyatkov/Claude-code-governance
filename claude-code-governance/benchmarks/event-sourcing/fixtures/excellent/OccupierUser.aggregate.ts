import { AggregateRoot } from 'es-aggregates'
import { randomUUID } from 'crypto'
import { OccupierUserCreated } from '../events/OccupierUserCreated'
import { OccupierUserInvited } from '../events/OccupierUserInvited'
import { OccupierUserUninvited } from '../events/OccupierUserUninvited'
import { OccupierUserUpdated, OccupierUserChange } from '../events/OccupierUserUpdated'
import { OccupierUserEmailChanged } from '../events/OccupierUserEmailChanged'
import { OccupierUserDeleted } from '../events/OccupierUserDeleted'
import { CreateOccupierUserParams } from '../types/CreateOccupierUserParams'
import { UpdateOccupierUserParams } from '../types/UpdateOccupierUserParams'
import { OccupierUserRole } from '../types/OccupierUserRole'
import { AccessCredential } from './AccessCredential.vo'
import { DomainError } from '../errors/DomainError'
import { OccupierUserNotInvitedError } from '../errors/OccupierUserNotInvitedError'

export class OccupierUser extends AggregateRoot {
  public id: string

  private _operatorAccountId: string

  public get operatorAccountId(): string {
    return this._operatorAccountId
  }

  private _occupierId: string

  public get occupierId(): string {
    return this._occupierId
  }

  private _email: string

  public get email(): string {
    return this._email
  }

  private _firstName: string

  public get firstName(): string {
    return this._firstName
  }

  private _lastName: string

  public get lastName(): string {
    return this._lastName
  }

  private _role: OccupierUserRole

  public get role(): OccupierUserRole {
    return this._role
  }

  private _phone: string | undefined

  public get phone(): string | undefined {
    return this._phone
  }

  private _mobile: string | undefined

  public get mobile(): string | undefined {
    return this._mobile
  }

  private _jobTitle: string | undefined

  public get jobTitle(): string | undefined {
    return this._jobTitle
  }

  private _language: string

  public get language(): string {
    return this._language
  }

  private _createdBy: string

  public get createdBy(): string {
    return this._createdBy
  }

  private _createdOn: string

  public get createdOn(): string {
    return this._createdOn
  }

  private _invitedToApp: boolean = false

  public get invitedToApp(): boolean {
    return this._invitedToApp
  }

  private _invitedToPortal: boolean = false

  public get invitedToPortal(): boolean {
    return this._invitedToPortal
  }

  private _accessCredential?: AccessCredential

  public get accessCredential(): AccessCredential | undefined {
    return this._accessCredential
  }

  private _deleted: boolean = false

  public get deleted(): boolean {
    return this._deleted
  }

  public get cardUid(): string | undefined {
    return this._accessCredential?.cardUid
  }

  public get accessControlEnabled(): boolean | undefined {
    return this._accessCredential?.accessControlEnabled
  }

  public get offlineAccessEnabled(): boolean | undefined {
    return this._accessCredential?.offlineAccessEnabled
  }

  public get provisioningCredentialIdentifier(): string | undefined {
    return this._accessCredential?.provisioningCredentialIdentifier
  }

  constructor() {
    super()

    this.register(OccupierUserCreated.typename, (event: OccupierUserCreated) => {
      this.id = event.userId
      this._operatorAccountId = event.operatorAccountId
      this._occupierId = event.occupierId
      this._email = event.email
      this._firstName = event.firstName
      this._lastName = event.lastName
      this._role = event.role
      this._phone = event.phone
      this._mobile = event.mobile
      this._jobTitle = event.jobTitle
      this._language = event.language
      this._createdBy = event.createdBy
      this._createdOn = event.timestamp

      // Handle optional credential fields (atomic user creation with credentials)
      if (event.cardUid) {
        this._accessCredential = AccessCredential.create({
          cardUid: event.cardUid,
          accessControlEnabled: event.accessControlEnabled ?? false,
          offlineAccessEnabled: event.offlineAccessEnabled ?? false,
          provisioningCredentialIdentifier: event.provisioningCredentialIdentifier,
          issuedBy: event.createdBy,
        })
      }
    })

    this.register(OccupierUserInvited.typename, (event: OccupierUserInvited) => {
      this._invitedToApp = event.invitedToApp
      this._invitedToPortal = event.invitedToPortal
    })

    this.register(OccupierUserUninvited.typename, () => {
      this._invitedToApp = false
      this._invitedToPortal = false
    })

    this.register(OccupierUserUpdated.typename, (event: OccupierUserUpdated) => {
      // Track if any credential fields changed
      let credentialChanged = false
      let newCardUid = this._accessCredential?.cardUid
      let newAccessControlEnabled = this._accessCredential?.accessControlEnabled ?? false
      let newOfflineAccessEnabled = this._accessCredential?.offlineAccessEnabled ?? false
      let newProvisioningCredentialIdentifier = this._accessCredential?.provisioningCredentialIdentifier

      event.changes.forEach((change) => {
        switch (change.field) {
          case 'firstName':
            this._firstName = change.newValue
            break
          case 'lastName':
            this._lastName = change.newValue
            break
          case 'role':
            this._role = change.newValue
            break
          case 'phone':
            this._phone = change.newValue
            break
          case 'mobile':
            this._mobile = change.newValue
            break
          case 'jobTitle':
            this._jobTitle = change.newValue
            break
          case 'language':
            this._language = change.newValue
            break
          case 'cardUid':
            newCardUid = change.newValue
            credentialChanged = true
            break
          case 'accessControlEnabled':
            newAccessControlEnabled = change.newValue
            credentialChanged = true
            break
          case 'offlineAccessEnabled':
            newOfflineAccessEnabled = change.newValue
            credentialChanged = true
            break
          case 'provisioningCredentialIdentifier':
            newProvisioningCredentialIdentifier = change.newValue
            credentialChanged = true
            break
          default:
            // Ignore unknown fields
            break
        }
      })

      // Reconstruct AccessCredential if any credential field changed
      if (credentialChanged && newCardUid) {
        this._accessCredential = AccessCredential.create({
          cardUid: newCardUid,
          accessControlEnabled: newAccessControlEnabled,
          offlineAccessEnabled: newOfflineAccessEnabled,
          provisioningCredentialIdentifier: newProvisioningCredentialIdentifier,
          issuedBy: event.updatedBy,
        })
      } else if (credentialChanged && !newCardUid) {
        // If cardUid is cleared, remove the credential
        this._accessCredential = undefined
      }
    })

    this.register(OccupierUserEmailChanged.typename, (event: OccupierUserEmailChanged) => {
      this._email = event.newEmail
    })

    this.register(OccupierUserDeleted.typename, () => {
      this._deleted = true
    })
  }

  public static factory = (): OccupierUser => new OccupierUser()

  public static create(params: CreateOccupierUserParams): OccupierUser {
    const occupierUser = new OccupierUser()

    if (!params.email?.trim()) {
      throw new DomainError('Email is required')
    }

    if (!params.firstName?.trim()) {
      throw new DomainError('First name is required')
    }

    if (!params.lastName?.trim()) {
      throw new DomainError('Last name is required')
    }

    if (!params.operatorAccountId?.trim()) {
      throw new DomainError('Operator account ID is required')
    }

    if (!params.occupierId?.trim()) {
      throw new DomainError('Occupier ID is required')
    }

    if (!params.createdBy?.trim()) {
      throw new DomainError('Created by is required')
    }

    const language = params.language?.trim() || 'en'

    const userId = params.id || randomUUID()

    // Validate credentials if provided
    if (params.cardUid) {
      // Note: elumoSiteId validation skipped for OccupierUser as field doesn't exist yet
      // This should be added when elumoSiteId is added to OccupierUser aggregate

      // Validate credential using AccessCredential value object
      AccessCredential.create({
        cardUid: params.cardUid,
        accessControlEnabled: params.accessControlEnabled ?? false,
        offlineAccessEnabled: params.offlineAccessEnabled ?? false,
        provisioningCredentialIdentifier: params.provisioningCredentialIdentifier,
        issuedBy: params.createdBy,
      })
    }

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
      language,
      params.createdBy,
      params.cardUid,
      params.accessControlEnabled,
      params.offlineAccessEnabled,
      params.provisioningCredentialIdentifier
    )

    occupierUser.applyChange(occupierUserCreated)

    return occupierUser
  }

  public invite(invitedToApp: boolean, invitedToPortal: boolean, invitedBy: string): void {
    if (!invitedBy?.trim()) {
      throw new DomainError('Invited by is required')
    }

    // Check if already invited to same access level
    if (invitedToApp === this._invitedToApp && invitedToPortal === this._invitedToPortal) {
      if (invitedToApp && invitedToPortal) {
        throw new DomainError('User already has both app and portal access')
      } else if (invitedToApp) {
        throw new DomainError('User already has app access')
      } else if (invitedToPortal) {
        throw new DomainError('User already has portal access')
      } else {
        throw new DomainError('User must be invited to at least app or portal')
      }
    }

    // Cannot revoke existing access
    if ((this._invitedToApp && !invitedToApp) || (this._invitedToPortal && !invitedToPortal)) {
      throw new DomainError('Cannot revoke existing access')
    }

    // Must grant at least one access type
    if (!invitedToApp && !invitedToPortal) {
      throw new DomainError('User must be invited to at least app or portal')
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

    this.applyChange(occupierUserInvited)
  }

  public update(params: UpdateOccupierUserParams): void {
    if (!params.updatedBy?.trim()) {
      throw new DomainError('Updated by is required')
    }

    if (params.id !== this.id) {
      throw new DomainError('User ID mismatch')
    }

    if (params.operatorAccountId !== this._operatorAccountId) {
      throw new DomainError('Operator account ID mismatch')
    }

    if (params.occupierId !== this._occupierId) {
      throw new DomainError('Occupier ID mismatch')
    }

    const changes: OccupierUserChange[] = []

    // Track profile field changes
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

    if (params.role !== undefined && params.role !== this._role) {
      changes.push({ field: 'role', oldValue: this._role, newValue: params.role })
    }

    if (params.phone !== undefined && params.phone !== this._phone) {
      changes.push({ field: 'phone', oldValue: this._phone, newValue: params.phone })
    }

    if (params.mobile !== undefined && params.mobile !== this._mobile) {
      changes.push({ field: 'mobile', oldValue: this._mobile, newValue: params.mobile })
    }

    if (params.jobTitle !== undefined && params.jobTitle !== this._jobTitle) {
      changes.push({ field: 'jobTitle', oldValue: this._jobTitle, newValue: params.jobTitle })
    }

    if (params.language !== undefined && params.language !== this._language) {
      if (!params.language?.trim()) {
        throw new DomainError('Language cannot be empty')
      }
      changes.push({ field: 'language', oldValue: this._language, newValue: params.language })
    }

    // Track credential field changes (independent updates supported)
    if (params.cardUid !== undefined && params.cardUid !== this._accessCredential?.cardUid) {
      changes.push({
        field: 'cardUid',
        oldValue: this._accessCredential?.cardUid,
        newValue: params.cardUid,
      })
    }

    if (
      params.accessControlEnabled !== undefined &&
      params.accessControlEnabled !== this._accessCredential?.accessControlEnabled
    ) {
      changes.push({
        field: 'accessControlEnabled',
        oldValue: this._accessCredential?.accessControlEnabled,
        newValue: params.accessControlEnabled,
      })
    }

    if (
      params.offlineAccessEnabled !== undefined &&
      params.offlineAccessEnabled !== this._accessCredential?.offlineAccessEnabled
    ) {
      changes.push({
        field: 'offlineAccessEnabled',
        oldValue: this._accessCredential?.offlineAccessEnabled,
        newValue: params.offlineAccessEnabled,
      })
    }

    if (
      params.provisioningCredentialIdentifier !== undefined &&
      params.provisioningCredentialIdentifier !== this._accessCredential?.provisioningCredentialIdentifier
    ) {
      changes.push({
        field: 'provisioningCredentialIdentifier',
        oldValue: this._accessCredential?.provisioningCredentialIdentifier,
        newValue: params.provisioningCredentialIdentifier,
      })
    }

    // Emit OccupierUserUpdated event if there are changes
    if (changes.length > 0) {
      const occupierUserUpdated = new OccupierUserUpdated(
        this.id,
        this._operatorAccountId,
        this._occupierId,
        params.updatedBy,
        changes
      )
      this.applyChange(occupierUserUpdated)
    }

    // Handle email change separately (requires special Cognito handling)
    if (params.email !== undefined && params.email !== this._email) {
      if (!params.email?.trim()) {
        throw new DomainError('Email cannot be empty')
      }

      const occupierUserEmailChanged = new OccupierUserEmailChanged(
        this.id,
        this._operatorAccountId,
        this._occupierId,
        this._email,
        params.email,
        params.updatedBy
      )
      this.applyChange(occupierUserEmailChanged)
    }
  }

  /**
   * Uninvites the user from the platform, removing ALL access (both app and portal).
   *
   * Business Rules:
   * - User must currently have invitation (invitedToApp OR invitedToPortal is true)
   * - Uninvitation removes ALL platform access (both flags set to false)
   * - uninvitedBy must not be empty (for audit trail)
   *
   * @param uninvitedBy - Identifier of who performed the uninvitation (for audit)
   * @throws DomainError if uninvitedBy is empty
   * @throws OccupierUserNotInvitedError if user has no active invitation
   */
  public uninvite(uninvitedBy: string): void {
    // Validate uninvitedBy parameter
    if (!uninvitedBy?.trim()) {
      throw new DomainError('Uninvited by is required')
    }

    // Validate business invariant: user must be currently invited
    if (!this._invitedToApp && !this._invitedToPortal) {
      throw new OccupierUserNotInvitedError(this.id)
    }

    // Capture previous state for audit trail before applying the change
    const previousInvitedToApp = this._invitedToApp
    const previousInvitedToPortal = this._invitedToPortal

    // Create and apply domain event
    const occupierUserUninvited = new OccupierUserUninvited(
      this.id,
      this._operatorAccountId,
      this._occupierId,
      uninvitedBy,
      previousInvitedToApp,
      previousInvitedToPortal
    )

    this.applyChange(occupierUserUninvited)
  }

  public delete(deletedBy: string): void {
    if (!deletedBy?.trim()) {
      throw new DomainError('Deleted by is required')
    }

    if (this._deleted) {
      throw new DomainError('User is already deleted')
    }

    const occupierUserDeleted = new OccupierUserDeleted(
      this.id,
      this._operatorAccountId,
      this._occupierId,
      this._email,
      deletedBy
    )

    this.applyChange(occupierUserDeleted)
  }
}
