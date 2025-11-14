import { EventBase } from 'es-aggregates'

// Mock aggregate type for demonstration
interface OccupierAggregate {
  id: string
  operatorAccountId: string
  occupierName: string
  intelligenceEnabled: boolean
}

// VIOLATION: Event contains aggregate reference
export class OccupierCreatedWithAggregate extends EventBase {
  public static readonly typename = 'OccupierCreatedWithAggregate'

  constructor(
    public readonly id: string,
    // VIOLATION: Contains reference to aggregate instance
    // Events should be self-contained with serializable data only
    public readonly occupier: OccupierAggregate,
    public readonly createdBy: string
  ) {
    super(OccupierCreatedWithAggregate.typename)
  }

  // VIOLATION: Methods on domain event (should be pure data)
  public getOccupierName(): string {
    return this.occupier.occupierName
  }

  // VIOLATION: Business logic in event
  public hasIntelligence(): boolean {
    return this.occupier.intelligenceEnabled
  }

  // VIOLATION: Not self-contained - missing data for event replay
  // If we serialize this event, we lose the aggregate methods/behavior
  // Event sourcing requires events to be self-contained data
}

// Problems with this approach:
// 1. Cannot serialize/deserialize properly (aggregate has methods/behavior)
// 2. Not self-contained (missing explicit field values)
// 3. Event replay would require aggregate reconstruction
// 4. Tight coupling between events and aggregates
// 5. Methods on events blur the line between events and entities
