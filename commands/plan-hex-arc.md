---
name: plan:hex-arc
description: Create implementation plan for hexagonal architecture feature following DDD/CQRS/Event Sourcing patterns
---

# Hexagonal Architecture Feature Planning

Creates a comprehensive implementation plan for a new feature using hexagonal architecture with DDD, CQRS, and Event Sourcing patterns.

## Usage

```
/plan:hex-arc <feature-name>
```

Example: `/plan:hex-arc tenant-onboarding`

## Instructions for Claude

### Step 1: Load Requirements

Read the requirements from `docs/{feature_name}/requirements.md`

If the file doesn't exist, inform the user and ask them to create it first with:
- Feature description
- User stories or use cases
- Acceptance criteria
- Technical requirements
- Constraints or assumptions

### Step 2: Discover and Review Governance Patterns

**Pattern Discovery:**
1. List all YAML files in the plugin's `patterns/` directory (search recursively)
2. Read each pattern file to understand:
   - Pattern name and version
   - Domain (which layer/concern it addresses)
   - Goal (what problem it solves)
3. Based on the requirements, identify which patterns are applicable to this feature

**Pattern Review:**
For each applicable pattern, deeply understand:
- **Goal**: What strategic challenge this pattern solves
- **Guiding Policy**: The overall approach to achieving the goal
- **Tactics**: Specific implementation steps, paying special attention to:
  - **Critical** priority tactics (must follow, weight: 3.0)
  - **Important** priority tactics (should follow, weight: 2.0)
  - **Optional** tactics (context-dependent, weight: 1.0)
- **Constraints**: Hard rules (MUST/MUST NOT) with documented exceptions
- **Anti-patterns**: Common mistakes to avoid

**Common patterns for hexagonal/DDD/CQRS/ES features:**
- **Domain layer**: DDD Aggregates, Value Objects, Domain Events, Event Sourcing, Repository Pattern
- **Application layer**: CQRS, Domain Services, Projectors, Ports and Adapters
- **Infrastructure layer**: Infrastructure API design
- **Core**: Error Handling, Testing

**Important:** Only include patterns that are genuinely relevant to the specific feature requirements. Not every feature needs every pattern. Use your judgment based on the requirements.

### Step 3: Explore Codebase

Before planning, understand what already exists:

1. **Find similar implementations** in the codebase as reference examples
   - Search for similar aggregates, command handlers, or features
   - Understand established patterns and conventions

2. **Review ./CLAUDE.md** for workspace-specific conventions
   - Naming conventions
   - Code organization
   - Team-specific practices

3. **Identify reusable components** that already exist:
   - Existing repositories (can we reuse the pattern?)
   - Existing adapters (can we extend or reuse?)
   - Existing fakes for testing (what's the testing pattern?)
   - Existing mappers (API ↔ domain conversion patterns)
   - Existing ports (what external integrations exist?)
   - Existing value objects (can we reuse common types?)

### Step 4: Create Implementation Plan

Generate a comprehensive plan with the following structure:

---

# Implementation Plan: {Feature Name}

## Overview

**Summary**: [2-3 sentence summary of what will be implemented]

**Approach**: [High-level approach - why this architecture makes sense for this feature]

**Scope**: [What's included and what's explicitly out of scope]

---

## Pattern Compliance

> This section documents which governance patterns apply and how we'll follow them.

### [Pattern Name] v[version]

**Pattern File**: `patterns/[category]/[name]/v[version].yaml`

**Why This Pattern Matters**: [Explain why this pattern is relevant for this specific feature]

**Key Tactics to Follow**:
- **[Critical Tactic ID]**: [Tactic name] - [How we'll apply it in this feature]
- **[Critical Tactic ID]**: [Tactic name] - [How we'll apply it]
- **[Important Tactic ID]**: [Tactic name] - [How we'll apply it]
- **[Important Tactic ID]**: [Tactic name] - [How we'll apply it]

**Constraints to Respect**:
- **MUST**: [Constraint rule] - [What this means for our implementation]
- **MUST NOT**: [Constraint rule] - [What we need to avoid]

**Potential Risks**:
- **Risk**: [What could go wrong or violate this pattern]
  - **Mitigation**: [How we'll prevent this]
- **Risk**: [Another potential violation]
  - **Mitigation**: [Prevention strategy]

**Anti-Patterns to Avoid**:
- ❌ **[Anti-pattern name]**: [Description and why it's bad]

---

[Repeat "Pattern Compliance" section for each applicable pattern]

---

## Domain Layer

### What and Why

**Aggregates/Entities**:
- **[AggregateName]**: [What it represents and why it's an aggregate]
  - **Responsibilities**: [What business logic it encapsulates]
  - **Invariants**: [What business rules it enforces]
  - **Child entities** (if any): [What entities it contains]

**Value Objects**:
- **[ValueObjectName]**: [What it represents and why it's a value object]
  - **Validation rules**: [What makes it valid]

**Domain Events**:
- **[EventName]**: [What business fact this captures and why it matters]
  - **Triggered when**: [What action causes this event]
  - **Consumed by**: [Who subscribes to this event]

**Business Rules**:
- [List key business rules/invariants that must be enforced]

**Domain Boundaries**:
- **Why this aggregate boundary**: [Explain the consistency boundary decision]
- **What's inside the boundary**: [What's part of this aggregate]
- **What's outside**: [What's referenced by ID only]

### Public Interface (Pseudo-code)

> This is NOT implementation code - it's a high-level interface definition

#### Domain Events

```typescript
// EventName in past tense, describes what happened
EventName:
  - field1: type  // What data this event carries
  - field2: type
  - timestamp: DateTime
  - aggregateId: string

AnotherEvent:
  - field: type
```

#### Aggregate Methods

```typescript
// Static factory for creation
AggregateName.create(param1: Type, param2: Type) → AggregateName
  // Creates aggregate, validates invariants, emits CreatedEvent
  // Throws: DomainError if validation fails

// Business methods (commands on the aggregate)
AggregateName.doSomething(param: Type) → void
  // Performs business action, validates rules, emits SomethingDoneEvent
  // Throws: DomainError if business rule violated

// Queries (getters)
AggregateName.property → Type
  // Returns property value

AggregateName.derivedValue → Type
  // Returns calculated value based on state
```

---

## Application Layer

### What and Why

**Use Cases**: [What application-level orchestration is needed and why]

**Command Handlers**:
- **[HandlerName]**: [What command it handles and why]
  - **Orchestrates**: [What domain objects and ports it coordinates]

**Query Handlers**:
- **[HandlerName]**: [What query it handles and why]
  - **Returns**: [What data structure]

**Ports (Interfaces)**:
- **[IPortName]**: [What external dependency this abstracts and why]
  - **Operations**: [What operations the port defines]

**Domain Services**:
- **[ServiceName]**: [What cross-aggregate logic and why it's not in aggregates]

**Projectors**:
- **[ProjectorName]**: [What read model it maintains and why]
  - **Subscribes to**: [Which domain events]
  - **Updates**: [Which read model tables]

### Public Interface (Pseudo-code)

#### Commands

```typescript
CommandName:
  - inputField1: type
  - inputField2: type
  // Command represents intent to change state
```

#### Queries

```typescript
QueryName:
  - queryParam1: type
  - queryParam2: type
  // Query represents request for data
```

#### Ports

```typescript
IPortName:
  - methodName(param1: Type, param2: Type) → Promise<ResultType>
    // What this operation does with the external system

  - anotherMethod(param: Type) → Promise<void>
    // Another operation on the external system
```

#### Handler Returns

- **CommandHandlerName** returns: `Promise<string>` (aggregateId)
  - Creates/modifies aggregate, returns identifier

- **QueryHandlerName** returns: `Promise<DTOType>`
  - Returns data transfer object with fields: [list fields]

---

## Infrastructure Layer

### What and Why

**API Endpoints**:
- **POST /api/resource**: [What this creates]
- **GET /api/resource/:id**: [What this retrieves]
- **PUT /api/resource/:id**: [What this updates]

**Lambda Handlers**:
- **createResourceHandler**: [What AWS Lambda function and its trigger]
- **getResourceHandler**: [Another Lambda]

**Adapters**:
- **[AdapterName]**: [What port it implements and how]
  - **External system**: [What third-party service or AWS service it uses]

**External Integrations**:
- **[Service Name]**: [Why we need this integration]
  - **Purpose**: [What it's used for]

**Infrastructure Rationale**: [Why these choices align with patterns and requirements]

### Public Interface (Pseudo-code)

#### API Types (snake_case)

```typescript
// Request DTOs use snake_case for JSON API
CreateResourceRequest:
  - field_one: string
  - field_two: number

CreateResourceResponse:
  - id: string
  - created_at: string
```

#### Adapters

```typescript
AdapterName implements IPortName:
  - methodName(param1: Type, param2: Type) → Promise<ResultType>
    // Implementation: Uses [AWS Service/Third-party API] to perform operation
    // Error handling: [What errors it can throw]
```

---

## Data Strategy

### Event Store

**Aggregate**: [AggregateName]

**Events**: [EventOne, EventTwo, EventThree, ...]

**Storage**:
- **Table**: `{aggregate-name}-events` (DynamoDB)
- **Partition Key**: aggregateId
- **Sort Key**: version (event sequence number)

**Why Event Sourcing**: [Rationale for using event sourcing for this aggregate]

### Read Models (RDS)

**Table**: `{table_name}`

**Columns**:
- `id` (UUID, primary key)
- `field_one` (type)
- `field_two` (type)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes**:
- [Any secondary indexes needed and why]

**Why This Read Model**: [Rationale - what queries does it optimize for]

**Eventual Consistency**: [How projector keeps read model up to date]

### Event Bridge

**Integration Events**:
- **[EventName]**: Published to external systems when [trigger]
  - **Consumers**: [What external systems consume this]
  - **Payload**: [What data is included]

**Why Event Bridge**: [When we need cross-system integration vs internal events]

---

## Test Strategy

### Critical Scenarios (Given-When-Then)

**Scenario: [Primary happy path]**
- **Given**: [Initial state/preconditions]
- **When**: [Action is taken - command executed]
- **Then**:
  - [Expected domain event emitted]
  - [Expected state change in aggregate]
  - [Expected side effects]

**Scenario: [Primary validation/error case]**
- **Given**: [Initial state with invalid condition]
- **When**: [Invalid action attempted]
- **Then**:
  - [DomainError thrown with specific message]
  - [No events emitted]
  - [State unchanged]

**Scenario: [Important business rule]**
- **Given**: [State that triggers business rule]
- **When**: [Action that tests the rule]
- **Then**: [Expected rule enforcement]

### Edge Cases

- **[Edge case 1]**: [What happens and expected behavior]
- **[Edge case 2]**: [Another edge case to test]
- **[Concurrency case]**: [How system handles concurrent operations]
- **[Idempotency]**: [How duplicate commands are handled]

### Test Layers

**Unit Tests** (Domain logic):
- Aggregate business methods with in-memory event store
- Value object validation
- Domain service logic
- Use fakes for all external dependencies

**Integration Tests** (Application orchestration):
- Command handlers with test database
- Query handlers with seeded read models
- Projectors with test event streams
- Use real repositories, fake adapters

**Component Tests** (Full vertical slice):
- API endpoint → Lambda → Application → Domain → Infrastructure
- Real database (ephemeral test DB)
- Fake external services (SES, third-party APIs)

**E2E Tests** (Critical user journeys):
- [Describe 1-2 critical end-to-end flows to test]

---

## Key Considerations

### Architectural Decisions

**Decision 1**: [Important architectural choice made]
- **Rationale**: [Why this decision was made]
- **Alternatives considered**: [What else was considered and why rejected]
- **Trade-offs**: [What we gain vs what we give up]
- **Implications**: [How this affects the rest of the system]

**Decision 2**: [Another key decision]
- **Rationale**: [Why this makes sense]
- **Trade-offs**: [Cost/benefit analysis]

### Potential Risks

**Risk 1**: [Technical or architectural risk]
- **Impact**: [What happens if this risk materializes]
- **Likelihood**: [Low/Medium/High]
- **Mitigation**: [How we'll prevent or handle this]

**Risk 2**: [Another risk to watch]
- **Mitigation**: [Prevention strategy]

### Technical Complexity

**Overall Complexity**: [Low / Medium / High]

**Why This Level**:
- [Explain the complexity assessment]

**Complexity Drivers** (what makes it complex):
- [Factor 1: e.g., "Event sourcing adds conceptual complexity"]
- [Factor 2: e.g., "Multiple external integrations"]
- [Factor 3: e.g., "Complex business rules"]

**Simplicity Factors** (what makes it manageable):
- [Factor 1: e.g., "Clear domain boundaries"]
- [Factor 2: e.g., "Well-established patterns to follow"]
- [Factor 3: e.g., "Existing similar implementations as reference"]

**Team Readiness**: [Does team have experience with these patterns?]

---

### Step 5: Save Plan

Save the generated plan to `docs/{feature_name}/plan.md`

Confirm to user with a summary:

```
✓ Implementation plan created: docs/{feature_name}/plan.md

📋 Patterns Reviewed:
  • [Pattern Name v1] - [One sentence why it's relevant]
  • [Pattern Name v1] - [One sentence why it's relevant]
  • [Pattern Name v1] - [One sentence why it's relevant]

🎯 Next Steps:
  1. Review the plan for completeness and accuracy
  2. Get team feedback on architectural decisions
  3. Begin implementation following the Domain → Application → Infrastructure sequence
  4. Refer to pattern files during development:
     - patterns/domain/[pattern]/v1.yaml
     - patterns/application/[pattern]/v1.yaml
  5. Test as you build (unit → integration → component)

💡 Tips:
  - Start with domain layer (aggregates, value objects, events)
  - Use TDD: write tests before implementation
  - Follow critical tactics from patterns strictly
  - Check constraints frequently during development
  - Avoid anti-patterns called out in the plan

Need help during implementation? Reference the specific pattern files for detailed tactics and examples.
```

## Notes for Claude

**Pattern Application:**
- **Dynamic discovery**: List pattern files from patterns/ directory, don't assume they exist
- **Selective relevance**: Only include patterns genuinely needed for this feature
- **Deep understanding**: Read full pattern YAML before referencing tactics/constraints
- **Cite sources**: Always reference specific pattern file paths

**Plan Quality:**
- **Concrete specifics**: Use actual domain terms from requirements, not generic placeholders
- **Justify decisions**: Every "what" needs a "why"
- **Identify risks early**: Call out potential pattern violations before they happen
- **Use pseudo-code**: Show interfaces/contracts, NOT literal implementation
- **Check reusability**: Always look for existing components first

**Tone:**
- Be thorough but not overwhelming
- Focus on strategic guidance, not tactical implementation details
- Make the plan actionable - developers should know what to build
- Highlight critical vs important vs optional aspects
- Provide enough detail to guide but not so much it becomes prescriptive code
