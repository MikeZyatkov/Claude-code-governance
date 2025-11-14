# Hidden RDS Query Antipattern

## The Problem

The EventBridge projector isolation rule states:
> "EventBridge projectors MUST NOT query RDS projections"

However, this violation can be **hidden one layer deeper** in the infrastructure adapter.

## Two Levels of Violation

### Level 1: Direct Violation (Easy to Detect)

```typescript
@injectable()
export class EventBridgeProjector {
  constructor(
    @inject('IEventBridgePublisher')
    private readonly _publisher: IEventBridgePublisher,
    @inject('IOccupierReader')  // ❌ VIOLATION: Direct RDS dependency
    private readonly _occupierReader: IOccupierReader
  ) {}

  async handle(event: OccupierInformationUpdated) {
    // ❌ VIOLATION: Projector queries RDS directly
    const occupier = await this._occupierReader.getOccupierById(...)
    await this._publisher.publish(occupier)
  }
}
```

**Detection:** Easy - the projector explicitly depends on RDS reader interface

### Level 2: Hidden Violation (Harder to Detect)

```typescript
@injectable()
export class EventBridgeProjector {
  constructor(
    @inject('IEventBridgePublisher')  // ✓ Looks clean
    private readonly _publisher: IEventBridgePublisher
  ) {}

  async handle(event: OccupierInformationUpdated) {
    // ✓ Projector looks clean - just publishes event
    await this._publisher.publishOccupierInformationUpdated(event)
  }
}

// Infrastructure layer - the actual implementation
@injectable()
export class EventBridgePublisher implements IEventBridgePublisher {
  constructor(
    @inject('IOccupierReader')  // ❌ VIOLATION: Hidden in adapter
    private readonly _occupierReader: IOccupierReader
  ) {}

  async publishOccupierInformationUpdated(event: OccupierInformationUpdated) {
    // ❌ VIOLATION: Publisher queries RDS to enrich payload
    const occupier = await this._occupierReader.getOccupierById(
      event.operatorAccountId,
      event.occupierId
    )

    // Build payload from RDS data instead of event data
    const payload = {
      occupier_name: occupier.occupier_name,  // From RDS
      tax_exempt: occupier.tax_exempt,        // From RDS
      // ... etc
    }

    await eventBridgePublish([payload], {...})
  }
}
```

**Detection:** Hard - the projector code looks clean. The violation is hidden in the infrastructure implementation.

## Real-World Example

From `EventBridgePublisher.ts`:

```typescript
async publishOccupierInformationUpdated(event: OccupierInformationUpdated): Promise<void> {
  // Query RDS to get the full current state of the occupier
  // Note: This runs after OccupierProjector has updated RDS
  const occupiers = await callRDSFunc<OccupierFromRDS[]>('uf_read_occupiers', [
    event.operatorAccountId,
    null,
    [event.occupierId],
  ])

  if (!occupiers || occupiers.length === 0) {
    throw new Error(`Occupier ${event.occupierId} not found in RDS`)
  }

  const occupier = occupiers[0]

  // Build payload from RDS projection data
  const payload: any = {
    occupier_id: occupier.occupier_id,
    occupier_name: occupier.occupier_name,         // From RDS
    tax_exempt: occupier.tax_exempt ?? false,      // From RDS
    decommission_status: occupier.decommission_status,  // From RDS
    intelligence_enabled: occupier.intelligence_enabled, // From RDS
  }

  await eventBridgePublish([payload], {...})
}
```

## Why This Is Still Problematic

Even though the projector looks clean, the system still has:

1. **Coupling**: EventBridge publishing depends on RDS projection
2. **Ordering**: RDS projector must run before EventBridge projector
3. **Hidden Dependency**: Not visible from projector code
4. **Testing Complexity**: EventBridge publishing requires database setup
5. **Mixed Concerns**: Integration layer reaching into read model

## The Root Cause

The event `OccupierInformationUpdated` likely doesn't contain all the fields needed for the external EventBridge payload. So the publisher "fills in the blanks" by querying RDS.

## Solutions

### Option 1: Enrich the Event (Preferred)

```typescript
// When publishing the event, include all necessary data
const event = new OccupierInformationUpdated({
  occupierId: this.id,
  operatorAccountId: this.operatorAccountId,
  // Include full state needed for EventBridge
  occupierName: this.occupierName,
  taxExempt: this.taxExempt,
  decommissionStatus: this.decommissionStatus,
  intelligenceEnabled: this.intelligenceEnabled,
  billingSite: this.billingSite,
  // ... all fields that EventBridge might need
})
```

Then the publisher can use event data only:

```typescript
async publishOccupierInformationUpdated(event: OccupierInformationUpdated) {
  // No RDS query needed - all data from event
  const payload = {
    occupier_id: event.occupierId,
    occupier_name: event.occupierName,      // From event
    tax_exempt: event.taxExempt,            // From event
    // ... etc
  }

  await eventBridgePublish([payload], {...})
}
```

### Option 2: Use Snapshot Events

```typescript
// Separate event for full state sync
class OccupierSnapshotPublished extends DomainEvent {
  constructor(
    public readonly occupierId: string,
    public readonly fullState: {
      occupierName: string
      taxExempt: boolean
      // ... complete state
    }
  ) {}
}
```

### Option 3: Accept Partial Updates

External systems receive partial update events and can query for full state if needed:

```typescript
const payload = {
  occupier_id: event.occupierId,
  // Only include what changed (from event)
  updated_fields: event.changes,
}
```

## Detection Strategy

To detect this hidden violation, code review must:

1. **Review projector AND its dependencies**: Not just the projector code
2. **Check infrastructure implementations**: Look at actual adapter classes
3. **Trace data flow**: Where does EventBridge payload data come from?
4. **Look for database calls in publishers**: Any `callRDSFunc`, reader injections

## Testing Approach

Our benchmark test (`hidden-rds-query.test.ts`) checks if the LLM can:
- Understand the violation from comments/documentation
- Reason about transitive dependencies
- Detect architectural issues beyond surface-level code inspection

## Recommendation

Update the pattern rule to be more explicit:

```yaml
- rule: "EventBridge integration MUST NOT query RDS projections"
  description: "Neither EventBridge projectors nor their publisher implementations
                should depend on or query RDS read models. All data must come from
                domain events. This applies to both application layer projectors and
                infrastructure layer adapters."
```