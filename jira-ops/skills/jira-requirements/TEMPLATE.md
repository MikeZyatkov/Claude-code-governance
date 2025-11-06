# Jira Requirements Template

Use this template to write your requirements. The jira-requirements skill will read this file and convert it to a properly formatted Jira ticket.

**KEY PRINCIPLE:** Focus on WHAT needs to be built (capabilities, outcomes) and WHY (business value), NOT HOW to implement it (specific files, classes, methods). Let the development team decide the implementation approach.

**Business Requirements should be business rules, constraints, and invariants** - NOT implementation tasks like "Create X", "Implement Y", or "Emit Z event".

---

## User Story

**As a** [user role]
**I want to** [capability/feature]
**So that** [business benefit]

---

## Value

[Explain the business value]
- Why is this important?
- What problem does it solve?
- What happens if we don't build this?

---

## Context & Background

**Current State:**
- What exists today?
- What doesn't exist?
- Where does relevant code live?

**[Domain-Specific Details]:**
*(e.g., "Contract Fields", "User Roles", etc.)*
- Field/entity 1: Description
- Field/entity 2: Description

**What Can Be [Action]:**
*(e.g., "What Can Be Updated", "What Can Be Configured")*
- Scope item 1
- Scope item 2

---

## Business Requirements

**Focus on business rules, constraints, and invariants - NOT implementation tasks.**

1. Business rule 1 (e.g., "Only authenticated users can access the system")
2. Constraint 1 (e.g., "Passwords must meet minimum complexity requirements")
3. Validation 1 (e.g., "Cannot delete accounts with active subscriptions")
4. Invariant 1 (e.g., "Account status must transition: ACTIVE → SUSPENDED → CLOSED")
...

❌ **Avoid:** "Create X class", "Implement Y method", "Emit Z event", "Add field to database"
✅ **Instead:** "Users must authenticate before access", "Invalid data must be rejected", "Status transitions must follow business rules"

---

## Acceptance Criteria

### Scenario: [Scenario name - describe the happy path]

Given [precondition]
And [additional context if needed]
When [action taken]
Then [expected outcome]
And [additional validation]

### Scenario: [Scenario name - describe an error case or validation]

Given [precondition]
When [action taken]
Then [expected error/outcome]

### Scenario: [Add more scenarios as needed]

*(Aim for 3-7 scenarios covering happy paths, error cases, edge cases)*

---

## Definition of Done

**Focus on WHAT works, not HOW it's built. List outcomes and quality gates, NOT specific files or implementation tasks.**

* [ ] Capability 1 delivered (e.g., "Contract update functionality works")
* [ ] Capability 2 delivered (e.g., "Date validations prevent invalid updates")
* [ ] All acceptance criteria scenarios pass
* [ ] Domain events published for all operations
* [ ] Tests pass (npm test)
* [ ] Linting passes (npm run lint)
* [ ] Type checking passes (npm run type-check)
* [ ] Deployed to staging

❌ **Avoid:** "Create X.ts file", "Add method to Y class", "Update Z interface"
✅ **Instead:** "Update capability works", "Validation prevents invalid data", "All tests pass"

### Technical consideration

**Provide high-level architectural guidance, NOT detailed implementation instructions.**

*(Optional section - keep it concise, 2-3 sentences or short bullets)*

Examples:
- Follow DDD patterns used in contexts/tenant-management/
- Skip Bluefin integration for ELUMO_ONLY accounts
- Use existing API mapping patterns (snake_case ↔ camelCase)
- Ensure secure password storage and session management

❌ **Avoid:** File paths, line numbers, method signatures, detailed code references
✅ **Instead:** Architectural patterns, constraints, high-level guidance

---

## Example: Contract Update Feature

**As an** operator administrator
**I want to** update contract details (start date, end date)
**So that** contract terms can be adjusted as business arrangements change

---

## Value

Business circumstances change - contract start dates may need to be postponed, end dates extended or shortened. Without the ability to update contracts, operators must delete and recreate them, losing historical continuity and creating administrative overhead.

---

## Context & Background

**Current State:**
- `Occupier.createContract()` exists and creates new contracts
- **NO** `updateContract()` method exists in the new domain model
- Old implementation exists at `services/contracts/handlers/update-operator-occupier-contract-handler.ts`

**Contract Fields:**
- `startDate`: Contract start date
- `endDate`: Contract end date (null for rolling contracts)
- `isPrimary`: Whether this is the primary/default contract for billing
- `siteId`: Site where contract applies

**What Can Be Updated:**
Based on the old implementation, operators should be able to update:
- Start date (with restrictions - only for UPCOMING contracts)
- End date (extend or shorten contracts)

---

## Business Requirements

1. Only operator administrators can update contract dates
2. Start dates can only be changed for upcoming contracts (not yet started)
3. Start dates cannot be set to past dates
4. End dates cannot be moved before yesterday
5. End dates must be after start dates
6. Discarded contracts cannot be updated
7. Contract dates must align with occupancy dates
8. All contract updates must be auditable

---

## Acceptance Criteria

### Scenario: Update contract start date for upcoming contract

Given I have an upcoming contract starting on "2025-02-01"
And today is "2025-01-15"
When I update the start date to "2025-02-15"
Then the contract start date is updated to "2025-02-15"
And the change is recorded in the audit trail
And a contract updated event is published

### Scenario: Prevent updating start date for active contract

Given I have an active contract that started on "2025-01-01"
And today is "2025-01-20"
When I attempt to update the start date to "2025-02-01"
Then I receive an error "Cannot modify start date for active contracts"
And the start date remains "2025-01-01"

### Scenario: Extend contract end date

Given I have a contract ending on "2025-06-30"
When I update the end date to "2025-12-31"
Then the contract end date is updated to "2025-12-31"
And the contract status updates accordingly
And a contract updated event is published

### Scenario: Prevent moving end date before yesterday

Given I have a contract
And today is "2025-01-20"
When I attempt to set the end date to "2025-01-18"
Then I receive an error "Cannot move end date before yesterday"
And the end date remains unchanged

---

## Definition of Done

* [ ] Contract update capability works (start date, end date)
* [ ] Start date validation prevents changes to active contracts
* [ ] End date validation prevents invalid date ranges
* [ ] Contract-occupancy date alignment validated
* [ ] Discarded contracts cannot be updated
* [ ] Contract updated events published correctly
* [ ] All acceptance criteria scenarios pass
* [ ] Tests pass (npm test)
* [ ] Linting passes (npm run lint)
* [ ] Type checking passes (npm run type-check)

### Technical consideration

Follow DDD patterns used in contexts/tenant-management/. Convert occupancy dates to UTC timestamps based on site timezone (similar to CreateContractCommandHandler pattern).

---
