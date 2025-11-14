import { EventBase } from 'es-aggregates'

// VIOLATION: Mutable domain event
export class OccupierCreatedMutable extends EventBase {
  public static readonly typename = 'OccupierCreatedMutable'

  // VIOLATION: Properties are not readonly - can be mutated after creation
  constructor(
    public id: string,
    public operatorAccountId: string,
    public occupierName: string,
    public intelligenceEnabled: boolean,
    public billingSiteId: string | null,
    public createdBy: string
  ) {
    super(OccupierCreatedMutable.typename)
  }

  // VIOLATION: Methods that modify state on the event
  public updateOccupierName(newName: string): void {
    this.occupierName = newName
  }

  // VIOLATION: Methods on events (domain events should be immutable data containers)
  public markIntelligenceEnabled(): void {
    this.intelligenceEnabled = true
  }

  // VIOLATION: Business logic in domain event
  public isValid(): boolean {
    return this.occupierName.trim().length > 0 && this.createdBy.trim().length > 0
  }
}

// Example of violation:
// const event = new OccupierCreatedMutable('id', 'account', 'name', false, null, 'user')
// event.updateOccupierName('new name') // Should not be possible!
// event.occupierName = 'directly mutated' // Should not be possible!
