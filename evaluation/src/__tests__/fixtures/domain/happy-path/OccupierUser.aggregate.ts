import { AggregateRoot } from 'es-aggregates'
import { randomUUID } from 'crypto'
import { OccupierUserCreated } from '../events/OccupierUserCreated'
import { OccupierUserInvited } from '../events/OccupierUserInvited'
import { CreateOccupierUserParams } from '../types/CreateOccupierUserParams'
import { OccupierUserRole } from '../types/OccupierUserRole'
import { DomainError } from '../errors/DomainError'

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

  private _invitedToApp: boolean = false

  public get invitedToApp(): boolean {
    return this._invitedToApp
  }

  private _invitedToPortal: boolean = false

  public get invitedToPortal(): boolean {
    return this._invitedToPortal
  }

  private _invitedOn: Date | undefined

  public get invitedOn(): Date | undefined {
    return this._invitedOn
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
    })

    this.register(OccupierUserInvited.typename, (event: OccupierUserInvited) => {
      this._invitedToApp = event.invitedToApp
      this._invitedToPortal = event.invitedToPortal
      this._invitedOn = event.invitedOn
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
      params.createdBy
    )

    occupierUser.applyChange(occupierUserCreated)

    return occupierUser
  }

  public isInvited(): boolean {
    return this._invitedToApp || this._invitedToPortal
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

    const invitedOn = new Date()

    const occupierUserInvited = new OccupierUserInvited(
      this.id,
      this._operatorAccountId,
      this._occupierId,
      invitedToApp,
      invitedToPortal,
      invitedBy,
      invitedOn
    )

    this.applyChange(occupierUserInvited)
  }
}
