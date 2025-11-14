import { DomainError } from '../errors/DomainError'
import { AccessCredentialParams } from '../types/AccessCredentialParams'

export class AccessCredential {
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

  public static create(params: AccessCredentialParams): AccessCredential {
    if (!params.cardUid?.trim()) {
      throw new DomainError('Card UID is required')
    }

    if (params.offlineAccessEnabled && !params.accessControlEnabled) {
      throw new DomainError('Offline access requires online access to be enabled')
    }

    if (!params.issuedBy?.trim()) {
      throw new DomainError('Issued by is required')
    }

    return new AccessCredential(
      params.cardUid.trim(),
      params.accessControlEnabled,
      params.offlineAccessEnabled,
      params.provisioningCredentialIdentifier?.trim(),
      params.issuedBy.trim()
    )
  }

  public equals(other: AccessCredential): boolean {
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
