# Implementation Plan: Separate Occupier User Invitation from Creation

**Feature**: invite-occupier-users
**Jira**: [SSP-20253](https://essensys.atlassian.net/browse/SSP-20253)
**Date**: 2025-10-07

## Overview

This feature decouples occupier user creation from platform access provisioning, enabling a workflow where occupier users are created first, then invited to use the platform when needed. Currently, `CreateOccupierUsersCommandHandler` creates all users with immediate Cognito provisioning, which doesn't align with the business workflow where invitation is a separate step.

The implementation will add an `invite()` method to the OccupierUser aggregate, create a new command handler for invitation operations, emit a new domain event, and update the projector to handle invitation status in the read model.

## Pattern Compliance

### Pattern: DDD Aggregates (v1)

**Key tactics**:
- `extend-aggregate-root`: OccupierUser already extends AggregateRoot
- `encapsulate-state`: Add private `_invitedToApp`, `_invitedToPortal`, `_invitedOn` fields with public getters
- `apply-via-events`: New `invite()` method emits domain events via `applyChange()`
- `validate-before-events`: Business rules validated before creating events (e.g., can't invite already-invited user, can't revoke existing access)
- `register-event-handlers`: Register OccupierUserInvited event in constructor

**Constraints**:
- All state changes produce domain events (OccupierUserInvited)
- Validation throws DomainError on invariant violations
- No public setters, only aggregate methods

**Risks**:
- Could violate pattern if invitation logic is placed in command handler instead of aggregate
- Risk of direct state mutation if we forget to use events

### Pattern: Domain Events (v1)

**Key tactics**:
- `extend-event-base`: New events extend EventBase from es-aggregates
- `past-tense-naming`: OccupierUserInvited (not InviteOccupierUser)
- `static-typename`: Each event has static readonly typename matching class name
- `immutable-properties`: All properties are public readonly
- `self-contained-events`: Events contain all data needed (userId, occupierId, invitedToApp, invitedToPortal, invitedBy)

**Constraints**:
- Events must be immutable (all properties readonly)
- Events contain IDs, not aggregate references
- Events must be self-contained for replay

**Risks**:
- Could violate if we forget to include necessary data (like invitedBy for audit trail)

### Pattern: CQRS (v1)

**Key tactics**:
- `separate-command-query-directories`: Commands in application/commands/
- `commands-return-id-only`: InviteOccupierUserCommandHandler returns void (acknowledgment)
- `commands-orchestrate-domain`: Handlers load aggregate, call domain methods, save back
- `use-dependency-injection`: @injectable decorator, inject repositories via constructor
- `validate-inputs-in-handler`: Basic validation in handler, business validation in domain

**Constraints**:
- Command handlers must save aggregates via repository.writeAsync()
- Commands return void or ID, never full aggregate
- Handlers decorated with @injectable

**Risks**:
- Could violate if we return full user data instead of void/acknowledgment

### Pattern: Projectors (v1)

**Key tactics**:
- `projector-per-aggregate`: OccupierUserProjector already exists, add event handlers to it
- `handle-method-pattern`: Update existing handle() method with new event cases
- `use-ports-for-writing`: Use IUsersRDSWriter port for database updates
- `injectable-projectors`: Already decorated with @injectable

**Constraints**:
- Projectors must not contain business logic (only data transformation)
- Projectors must handle events idempotently
- Projectors must not emit domain events (except EventBridge projector)

**Risks**:
- Could violate if we add business validation in projector instead of aggregate

### Pattern: Infrastructure & API (v1)

**Key tactics**:
- `inline-mapping`: Map API requests inline in Lambda handlers (no new mapper needed)
- `api-snake-case`: InviteOccupierUserRequest uses snake_case (invite_to_app, invite_to_portal)
- `domain-camelcase`: Domain uses camelCase (invitedToApp, invitedToPortal)
- `adapter-interface-first`: Use existing ports (ICognitoUserPoolPort, IPermissionSyncPort)

**Constraints**:
- API types must use snake_case
- Domain types must use camelCase
- Don't create mapper class for single-use conversion

**Risks**:
- Could violate by mixing case conventions or creating unnecessary mapper

## Domain Level

**What and why**:

The OccupierUser aggregate needs to track invitation status and support invitation operations. Adding three new fields (`invitedToApp`, `invitedToPortal`, `invitedOn`) captures the state of platform access. The `invite()` method enforces business rules: can only invite created users, cannot revoke existing access, but can grant additional access (app → both, portal → both).

This design keeps business logic in the domain where it belongs, making rules explicit and testable. Event sourcing ensures all invitation state changes are auditable.

**Public interface (pseudo-code)**:

```
// Domain Events
OccupierUserInvited:
  - userId: string
  - operatorAccountId: string
  - occupierId: string
  - invitedToApp: boolean
  - invitedToPortal: boolean
  - invitedBy: string
  - invitedOn: Date

// Aggregate Methods
OccupierUser.invite(invitedToApp, invitedToPortal, invitedBy):
  - Validates: user not already invited to same access level
  - Validates: not revoking existing access (can only grant additional)
  - Applies: OccupierUserInvited event
  - Throws: DomainError if validation fails

// New Getters
OccupierUser.invitedToApp → boolean
OccupierUser.invitedToPortal → boolean
OccupierUser.invitedOn → Date | undefined
OccupierUser.isInvited() → boolean (either app or portal)
```

**Business Rules**:
1. Cannot invite already-invited users to same access level
2. Can grant additional access: portal → both, app → both
3. Cannot revoke access via invite()
4. Only created users can be invited (checked by handler via repository)

## Application Level

**What and why**:

The `InviteOccupierUserCommandHandler` orchestrates the invitation workflow. It validates the user exists, delegates invitation to the aggregate, creates Cognito user in T1 pool, syncs permissions, and saves the aggregate.

The projector needs to handle the OccupierUserInvited event by updating the read model with invitation status and timestamps. This maintains eventual consistency between the event store (write model) and RDS (read model).

No new ports needed - we reuse existing ICognitoUserPoolPort and IPermissionSyncPort.

**Public interface (pseudo-code)**:

```
// Commands
InviteOccupierUserCommand:
  - accountId: string
  - userId: string
  - invitedToApp: boolean
  - invitedToPortal: boolean
  - invitedBy: string

// Command Handlers
InviteOccupierUserCommandHandler.handle(command) → void:
  1. Load aggregate from repository
  2. Validate user exists (throw OccupierUserNotFoundError)
  3. Call aggregate.invite()
  4. Get T1 domain from IAccountDomainsPort
  5. Create Cognito user via ICognitoUserPoolPort.createUserInPool()
  6. Sync permissions via IPermissionSyncPort.syncUserPermissions()
  7. Save aggregate via repository.writeAsync()

// Projector Updates
OccupierUserProjector.handle(eventType, eventData):
  - Add case for OccupierUserInvited.typename

OccupierUserProjector._handleOccupierUserInvited(event):
  - Update RDS with invite_to_app, invite_to_portal, invited_on
  - Lookup Cognito sub and update user_sub
```

**Ports (reused)**:
- ICognitoUserPoolPort.createUserInPool() → string (sub)
- ICognitoUserPoolPort.getUserByEmail() → {sub, email} | undefined
- IAccountDomainsPort.getOccupierDomain() → {pool_id: string}
- IPermissionSyncPort.syncUserPermissions() → void

**Handler Returns**:
- InviteOccupierUserCommandHandler → void

## Infrastructure Level

**What and why**:

A new Lambda handler exposes an HTTP endpoint for invitation operations. API types follow snake_case convention. Inline mapping converts API requests to domain commands (no mapper class needed for single-use conversion).

Reuse existing Cognito and permission sync adapters - no new infrastructure code needed beyond Lambda handlers and API types.

Existing `CreateOccupierUsersCommandHandler` needs modification: remove Cognito creation logic, only create aggregate and save to repository. Invitation becomes a separate step.

**Public interface (pseudo-code)**:

```
// API Types (snake_case)
InviteOccupierUserRequest:
  - invite_to_app: boolean
  - invite_to_portal: boolean

InviteOccupierUserResponse:
  - success: boolean
  - message?: string

// Lambda Handlers
invite-occupier-user-handler.ts:
  - POST /accounts/{account_id}/occupier-users/{user_id}/invite
  - Parse request, inline map to InviteOccupierUserCommand
  - Call InviteOccupierUserCommandHandler.handle()
  - Return 200 OK or error response

// Adapters (existing, reused)
CognitoUserPoolAdapter implements ICognitoUserPoolPort
PermissionSyncAdapter implements IPermissionSyncPort
```

**Modifications**:
- Remove Cognito creation from `CreateOccupierUsersCommandHandler._createOccupierUser()`
- Remove permission sync from creation flow
- Keep aggregate creation and repository save only

## Data Strategy

**Event Store**:
- Store OccupierUserInvited events with full invitation context
- Events immutable, provide complete history of invitation operations

**RDS (Read Model)**:
- Update existing `people` table fields:
  - `invite_to_app` (boolean)
  - `invite_to_portal` (boolean)
  - `invited_on` (timestamp, nullable)
  - `user_sub` (string, Cognito sub, nullable)
- Projector updates read model on event handling

**EventBridge** (optional future enhancement):
- Could publish OccupierUserInvited to external systems
- Not required for initial implementation

**Why this model**:
- Event store is source of truth for all state changes
- RDS read model optimized for queries (backward compatible with existing services)
- Separation allows independent evolution of write/read concerns

## Test Strategy

**Critical Scenarios (Given-When-Then)**:

1. **Invite new occupier user**
   - GIVEN: Uninvited occupier user exists
   - WHEN: I call invite() with invitedToApp=true
   - THEN: OccupierUserInvited event emitted, Cognito user created, permissions synced

2. **Grant additional access**
   - GIVEN: User invited to portal only (invitedToPortal=true, invitedToApp=false)
   - WHEN: I call invite() with invitedToApp=true
   - THEN: OccupierUserInvited event emitted with both flags true

3. **Prevent duplicate invitation**
   - GIVEN: User already invited to app
   - WHEN: I call invite() with invitedToApp=true only
   - THEN: DomainError thrown "User already has app access"

4. **Prevent access revocation via invite**
   - GIVEN: User invited to both app and portal
   - WHEN: I call invite() with invitedToApp=false, invitedToPortal=true
   - THEN: DomainError thrown "Cannot revoke existing access"

5. **Handle non-existent user invitation**
   - GIVEN: User ID does not exist
   - WHEN: InviteOccupierUserCommandHandler.handle() called
   - THEN: OccupierUserNotFoundError thrown with 404 status

**Edge Cases**:

6. **Cognito creation failure during invite**
   - GIVEN: Uninvited user exists, Cognito service unavailable
   - WHEN: InviteOccupierUserCommandHandler.handle() called
   - THEN: Error propagated, aggregate not saved (transaction consistency)

7. **Projector handles OccupierUserInvited event**
   - GIVEN: OccupierUserInvited event in event store
   - WHEN: Projector processes event
   - THEN: RDS updated with invitation status and timestamps

8. **CreateOccupierUsers without immediate invitation**
   - GIVEN: New occupier user creation request
   - WHEN: CreateOccupierUsersCommandHandler.handle() called
   - THEN: User created without Cognito provisioning or permission sync

**Test Files**:
- `OccupierUser.aggregate.test.ts` - Domain logic tests (scenarios 1-4)
- `InviteOccupierUserCommandHandler.test.ts` - Command handler tests (scenarios 5-6)
- `OccupierUserProjector.components.test.ts` - Projector tests (scenario 7)
- `CreateOccupierUsersCommandHandler.test.ts` - Updated tests (scenario 8)

## Key Considerations

### Architectural Decisions

1. **Separation of Concerns**: Invitation is a separate domain operation from creation, reflecting real business workflow where users are added to system first, then granted platform access later.

2. **Event Sourcing**: Using domain events captures complete invitation history for audit and debugging. Every invitation is traceable.

3. **Eventual Consistency**: Projector updates read model asynchronously. Brief window where event store (write) and RDS (read) may differ, but system remains consistent.

4. **Reuse Over Duplication**: Leverage existing ports and adapters for Cognito and permission sync rather than creating new infrastructure.

5. **Backward Compatibility**: Maintain existing API schema from legacy implementation (`invite_to_app`, `invite_to_portal` fields) to ease migration.

### Potential Risks and Mitigation

| Risk | Mitigation |
|------|-----------|
| Business logic leaks into command handler | Keep invitation rules in aggregate.invite(), handler only orchestrates |
| Forgetting to update projector | Add projector tests, verify RDS updated after event emission |
| Cognito failures leave inconsistent state | Wrap Cognito calls in try-catch, don't save aggregate if Cognito fails |
| Breaking existing CreateOccupierUsers flow | Update tests to verify no Cognito creation, test invitation separately |
| Permission sync failures | Log errors clearly, consider retry mechanism in PermissionSyncAdapter |

### Technical Complexity: **Medium**

**Justification**:
- Multiple layers touched: domain (aggregate + events), application (commands + projector), infrastructure (API handlers)
- Event sourcing adds complexity but patterns well-established in codebase
- Cognito integration has edge cases (user already exists, pool errors)
- Testing requires comprehensive coverage across domain, application, and projector layers

**However**:
- Similar patterns exist in codebase (OperatorUser provides clear reference)
- No new adapters/ports needed, reuse existing infrastructure
- Domain logic straightforward: validate, emit event, update state
- Clear separation between invite and create simplifies each operation

## Implementation Checklist

### Domain Layer
- [x] Add invitation fields to OccupierUser aggregate (`_invitedToApp`, `_invitedToPortal`, `_invitedOn`)
- [x] Add getters for invitation fields
- [x] Implement `invite()` method with validation
- [x] Create OccupierUserInvited event class
- [x] Register event handler in OccupierUser constructor
- [x] Write OccupierUser aggregate tests for invite behavior

### Application Layer - Commands
- [x] Create InviteOccupierUserCommand
- [x] Create InviteOccupierUserCommandHandler with dependencies
- [x] Implement InviteOccupierUserCommandHandler.handle() logic
- [x] Update CreateOccupierUsersCommandHandler (remove Cognito logic)
- [x] Write command handler tests

### Application Layer - Projector
- [x] Add OccupierUserInvited case to OccupierUserProjector.handle()
- [x] Implement _handleOccupierUserInvited() private method
- [x] Update OccupierUserProjectionDTO if needed
- [x] Write projector tests for invitation event

### Infrastructure Layer - API
- [x] Create InviteOccupierUserRequest type (snake_case)
- [x] Create InviteOccupierUserResponse type
- [x] Implement invite-occupier-user-handler.ts Lambda
- [x] Register handler in container-factory.ts

### Infrastructure Layer - Fakes
- [x] Extend FakeOccupierUserRepository if needed (should work as-is)
- [x] Verify FakeCognitoUserPoolAdapter supports createUserInPool()
- [x] Verify FakePermissionSyncAdapter supports needed operations

### Testing
- [x] Run all OccupierUser aggregate tests
- [x] Run all command handler tests
- [x] Run all projector tests
- [x] Integration test: create user → invite → verify Cognito + permissions
- [x] Update CreateOccupierUsersCommandHandler tests

### Documentation
- [ ] Update API documentation for new endpoint
- [ ] Document invitation workflow in CLAUDE.md
- [ ] Add examples of invite patterns

---

**Next Steps**: Review this plan, then proceed with implementation starting with domain layer (aggregate + events), then application layer (commands + projector), finally infrastructure (API handlers).
