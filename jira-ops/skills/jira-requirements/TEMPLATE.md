# Jira Requirements Template

Use this template to write your requirements. The jira-requirements skill will read this file and convert it to a properly formatted Jira ticket.

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

1. Requirement 1
2. Requirement 2
3. Requirement 3
4. Requirement 4
...

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

* [ ] Task 1 (e.g., "Implement X method in Y aggregate")
* [ ] Task 2 (e.g., "Add validation for Z constraint")
* [ ] Task 3
* [ ] Unit tests cover all validation scenarios
* [ ] Integration tests for key workflows
* [ ] Documentation updated
* [ ] Code reviewed
* [ ] Deployed to staging

### Technical consideration

*(Optional section)*

[Any specific implementation patterns, technical constraints, or references]

Examples:
- Convert dates to UTC timestamps based on site timezone
- Follow existing pattern in `HandlerClass`
- Use bcrypt for password hashing
- Store sessions in Redis with 1-hour TTL

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

1. Operators can update contract start dates and end dates
2. Start date can only be changed for upcoming contracts (not yet started)
3. New start date cannot be in the past
4. End date cannot be moved before yesterday
5. End date must be after start date
6. Cannot update discarded contracts
7. Contract dates must align with occupancy dates
8. Changes are audited and events published

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

* [ ] Implement contract update method in Occupier aggregate
* [ ] Support updating: startDate, endDate
* [ ] Validate start date can only change for upcoming contracts
* [ ] Validate end date constraints (not before yesterday, after start date)
* [ ] Validate contract dates align with occupancy dates
* [ ] Prevent updating discarded contracts
* [ ] Publish contract updated events
* [ ] Audit trail records all changes
* [ ] Unit tests cover all validation scenarios

### Technical consideration

Convert occupancy dates coming from API to UTC timestamps based on the site timezone (check current `CreateContractCommandHandler` to understand the pattern, convert them back during the projection)

---
