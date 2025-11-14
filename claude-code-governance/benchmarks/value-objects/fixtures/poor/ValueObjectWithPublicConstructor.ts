import { DomainError } from '../../../../code-samples-candidates/domain/errors/DomainError'

// VIOLATION: Public constructor allows creating invalid instances
export class AccessCredentialPublicConstructor {
  private readonly _cardUid: string

  public get cardUid(): string {
    return this._cardUid
  }

  private readonly _accessControlEnabled: boolean

  public get accessControlEnabled(): boolean {
    return this._accessControlEnabled
  }

  private readonly _offlineAccessEnabled: boolean

  public get offlineAccessEnabled(): boolean {
    return this._offlineAccessEnabled
  }

  private readonly _provisioningCredentialIdentifier?: string

  public get provisioningCredentialIdentifier(): string | undefined {
    return this._provisioningCredentialIdentifier
  }

  private readonly _issuedBy: string

  public get issuedBy(): string {
    return this._issuedBy
  }

  // VIOLATION: Public constructor allows uncontrolled instantiation
  // Should be private with static factory method for validation
  public constructor(
    cardUid: string,
    accessControlEnabled: boolean,
    offlineAccessEnabled: boolean,
    provisioningCredentialIdentifier: string | undefined,
    issuedBy: string
  ) {
    // VIOLATION: No validation - allows creating invalid instances
    // Users can pass empty strings, null, etc.
    this._cardUid = cardUid
    this._accessControlEnabled = accessControlEnabled
    this._offlineAccessEnabled = offlineAccessEnabled
    this._provisioningCredentialIdentifier = provisioningCredentialIdentifier
    this._issuedBy = issuedBy
  }

  // VIOLATION: No static factory method with validation
  // Consumers must use constructor directly

  public equals(other: AccessCredentialPublicConstructor): boolean {
    return (
      this.cardUid === other.cardUid &&
      this.accessControlEnabled === other.accessControlEnabled &&
      this.offlineAccessEnabled === other.offlineAccessEnabled &&
      this.provisioningCredentialIdentifier === other.provisioningCredentialIdentifier &&
      this.issuedBy === other.issuedBy
    )
  }

  public toJSON() {
    return {
      cardUid: this._cardUid,
      accessControlEnabled: this._accessControlEnabled,
      offlineAccessEnabled: this._offlineAccessEnabled,
      provisioningCredentialIdentifier: this._provisioningCredentialIdentifier,
      issuedBy: this._issuedBy,
    }
  }
}

// Example of how this can be misused:
// const invalidCredential = new AccessCredentialPublicConstructor('', false, false, undefined, '')
// No validation prevents creating invalid instances
