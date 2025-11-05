---
name: implementation-engine
description: Implements a specific layer following the plan and governance patterns. Builds components with tests and validates pattern compliance.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Implementation Engine Skill

Implements a specific layer for a feature following governance patterns and implementation plans.

## Purpose

Executes layer implementation with pattern guidance, creates components, writes tests, and validates correctness.

## When to Use

Invoked by orchestrator when it's time to implement a specific layer (domain, application, infrastructure).

## How It Works

### Context from Orchestrator

Reads context from:
1. **Feature name:** From command argument or recent messages
2. **Layer:** domain, application, or infrastructure
3. **Plan:** Located at `docs/{feature}/plan.md`
4. **Patterns:** To be loaded via pattern-loader skill

### Workflow

#### 1. Load Context

**Steps:**
1. Identify feature name from orchestrator context
2. Identify layer from context (domain/application/infrastructure)
3. Read plan file: `docs/{feature}/plan.md`
4. Find layer section in plan (e.g., "## Domain Layer")
5. Extract goals, components, patterns to follow

#### 2. Load Patterns

**Steps:**
1. Invoke pattern-loader skill for the layer's domain
2. Get full pattern details with tactics and constraints
3. Understand requirements: encapsulation, events, invariants, etc.

#### 3. Implement Components

**Steps:**
1. For each component in the plan:
   - Create file in appropriate directory
   - Implement following pattern tactics
   - Add inline documentation
   - Ensure pattern compliance (private state, event sourcing, etc.)

2. Follow pattern tactics:
   - **encapsulate-state:** All state private with `_` prefix
   - **apply-via-events:** State changes produce domain events
   - **invariant-methods:** Business rules enforced in methods
   - **aggregate-root:** Single entry point for consistency

3. File organization:
   - Domain layer: `contexts/{feature}/{layer}/model/`
   - Application layer: `contexts/{feature}/{layer}/services/`
   - Infrastructure: `contexts/{feature}/{layer}/adapters/`

#### 4. Write Tests

**Steps:**
1. For each component, create test file
2. Test pattern compliance:
   - State encapsulation (can't access private state)
   - Event emission (events produced on state changes)
   - Invariant enforcement (invalid operations rejected)
   - Edge cases and error conditions

3. Run tests: `npm test -- {test_pattern}`
4. Fix any failures
5. Ensure all tests pass before completing

#### 5. Validate Implementation

**Steps:**
1. Check all planned components are implemented
2. Verify pattern compliance
3. Confirm tests pass
4. Document any deviations from plan

## Instructions for Claude

### Reading Context

**Feature name:** From orchestrator, e.g., "tenant-onboarding"

**Layer:** From orchestrator, e.g., "domain", "application", "infrastructure"

**Plan:** Read from `docs/{feature}/plan.md`, find layer section

### Implementation Guidelines

**Follow the Plan:**
- Implement components as specified in plan
- Use technologies specified in plan
- Maintain consistency with architecture

**Follow Patterns:**
- Load patterns via pattern-loader skill
- Apply all critical and important tactics
- Satisfy all must/should constraints
- Avoid anti-patterns

**Write Tests:**
- Test-driven or test-alongside development
- Cover happy paths and edge cases
- Ensure pattern compliance is testable
- All tests must pass

**Document Deviations:**
- If you deviate from plan, note why
- If you add components, explain rationale
- Transparency helps reviewers understand decisions

### Error Handling

**Plan not found:**
- Check if file exists: `[ -f docs/{feature}/plan.md ]`
- If not, tell orchestrator plan is missing

**Test failures:**
- Fix issues causing failures
- Don't proceed until tests pass
- Document what was fixed

**Pattern conflicts:**
- If patterns contradict, ask orchestrator
- Document the conflict and resolution

## Example Workflow

**Context:**
- Feature: tenant-onboarding
- Layer: domain
- Orchestrator says: "Implement the domain layer"

**Actions:**
1. Read plan from docs/tenant-onboarding/plan.md
2. Extract domain layer requirements:
   - Tenant aggregate root
   - EmailAddress, CompanyName value objects
   - TenantCreated, TenantActivated events
3. Invoke pattern-loader for domain patterns
4. Implement each component:
   - Create contexts/tenant-onboarding/domain/model/Tenant.ts
   - Create contexts/tenant-onboarding/domain/model/EmailAddress.ts
   - Create contexts/tenant-onboarding/domain/model/CompanyName.ts
   - Create event files
5. Write tests for each component
6. Run tests: `npm test -- tenant-onboarding/domain`
7. All tests pass ✅
8. Report completion with summary

## Notes

**Components:** Aggregates, entities, value objects, services, repositories, adapters (depending on layer)

**Patterns:** DDD for domain, CQRS for application, Hexagonal for infrastructure

**Testing:** Unit tests for domain/application, integration tests for infrastructure

**Documentation:** Inline comments explaining business rules and pattern compliance
