import { DomainError } from '../../../../code-samples-candidates/domain/errors/DomainError'
import { AccessCredentialParams } from '../../../../code-samples-candidates/domain/types/AccessCredentialParams'

// VIOLATION: This value object is mutable and violates value object patterns
export class AccessCredentialMutable {
  // VIOLATION: Not readonly - fields are mutable
  private _cardUid: string

  public get cardUid(): string {
    return this._cardUid
  }

  // VIOLATION: Public setter allows mutation
  public set cardUid(value: string) {
    this._cardUid = value
  }

  private _accessControlEnabled: boolean

  public get accessControlEnabled(): boolean {
    return this._accessControlEnabled
  }

  // VIOLATION: Public setter allows mutation
  public set accessControlEnabled(value: boolean) {
    this._accessControlEnabled = value
  }

  private _offlineAccessEnabled: boolean

  public get offlineAccessEnabled(): boolean {
    return this._offlineAccessEnabled
  }

  // VIOLATION: Public setter allows mutation
  public set offlineAccessEnabled(value: boolean) {
    this._offlineAccessEnabled = value
  }

  private _provisioningCredentialIdentifier?: string

  public get provisioningCredentialIdentifier(): string | undefined {
    return this._provisioningCredentialIdentifier
  }

  // VIOLATION: Public setter allows mutation
  public set provisioningCredentialIdentifier(value: string | undefined) {
    this._provisioningCredentialIdentifier = value
  }

  private _issuedBy: string

  public get issuedBy(): string {
    return this._issuedBy
  }

  // VIOLATION: Public setter allows mutation
  public set issuedBy(value: string) {
    this._issuedBy = value
  }

  private constructor(
    cardUid: string,
    accessControlEnabled: boolean,
    offlineAccessEnabled: boolean,
    provisioningCredentialIdentifier: string | undefined,
    issuedBy: string
  ) {
    this._cardUid = cardUid
    this._accessControlEnabled = accessControlEnabled
    this._offlineAccessEnabled = offlineAccessEnabled
    this._provisioningCredentialIdentifier = provisioningCredentialIdentifier
    this._issuedBy = issuedBy
  }

  public static create(params: AccessCredentialParams): AccessCredentialMutable {
    if (!params.cardUid?.trim()) {
      throw new DomainError('Card UID is required')
    }

    if (params.offlineAccessEnabled && !params.accessControlEnabled) {
      throw new DomainError('Offline access requires online access to be enabled')
    }

    if (!params.issuedBy?.trim()) {
      throw new DomainError('Issued by is required')
    }

    return new AccessCredentialMutable(
      params.cardUid.trim(),
      params.accessControlEnabled,
      params.offlineAccessEnabled,
      params.provisioningCredentialIdentifier?.trim(),
      params.issuedBy.trim()
    )
  }

  // VIOLATION: No equals() method - relies on identity comparison
  // Value objects should implement structural equality

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
