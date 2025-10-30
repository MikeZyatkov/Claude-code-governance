---
name: implementation-engine
description: Executes the implementation of a specific layer for a feature, following the plan and governance patterns. Builds components with tests, validates pattern compliance, and returns structured results.
---

# Implementation Engine Skill

Core implementation logic for building a layer following governance patterns and implementation plans.

## Purpose

Executes the implementation of a specific layer for a feature, following the plan and governance patterns. Returns structured results that callers can format and use as needed.

## Input

```json
{
  "feature": "tenant-onboarding",
  "layer": "domain",
  "plan_path": "docs/tenant-onboarding/plan.md"
}
```

## Output

```json
{
  "success": true,
  "layer": "domain",
  "summary": "Implemented Tenant aggregate root with value objects, domain events, and repository interface following DDD patterns",
  "components": [
    {
      "name": "Tenant aggregate",
      "description": "Aggregate root managing tenant lifecycle with create() and activate() methods",
      "rationale": "Encapsulates tenant business rules and ensures state changes produce domain events"
    },
    {
      "name": "EmailAddress value object",
      "description": "Validates and encapsulates email addresses",
      "rationale": "Prevents invalid emails from entering the system"
    },
    {
      "name": "CompanyName value object",
      "description": "Validates company name constraints",
      "rationale": "Ensures company names meet business requirements"
    }
  ],
  "deviations": [
    {
      "description": "Added TenantSuspended event not in original plan",
      "rationale": "Discovered during implementation that suspension is a critical business state that needs tracking"
    }
  ],
  "tests": {
    "total": 8,
    "passed": 8,
    "failed": 0,
    "test_files": [
      "test/domain/Tenant.test.ts",
      "test/domain/EmailAddress.test.ts"
    ]
  },
  "files": {
    "created": [
      "src/domain/Tenant.aggregate.ts",
      "src/domain/value-objects/EmailAddress.ts",
      "src/domain/value-objects/CompanyName.ts",
      "src/domain/events/TenantCreated.ts",
      "src/domain/events/TenantActivated.ts",
      "src/domain/interfaces/ITenantRepository.ts"
    ],
    "modified": []
  },
  "patterns_applied": [
    "DDD Aggregates v1",
    "Value Objects v1",
    "Domain Events v1",
    "Event Sourcing v1"
  ],
  "errors": [],
  "warnings": []
}
```

## Instructions for Claude

### Step 1: Validate Inputs

**Check plan exists:**
```bash
test -f docs/{feature}/plan.md
```

If not found:
```json
{
  "success": false,
  "error": "Implementation plan not found",
  "path": "docs/{feature}/plan.md",
  "message": "Please run /plan:hex-arc {feature} first"
}
```

**Validate layer exists in plan:**
1. Read `docs/{feature}/plan.md`
2. Search for section `## {Layer} Layer` (case-insensitive)
3. Verify section has content (not empty)

If layer not found:
```json
{
  "success": false,
  "error": "Layer not found in plan",
  "layer": "{layer}",
  "available_layers": ["domain", "application", "infrastructure"]
}
```

### Step 2: Load Implementation Plan

**Read plan thoroughly:**

1. **Extract Overview:**
   - Feature summary
   - Approach
   - Scope

2. **Extract Pattern Compliance:**
   - Which patterns apply to this layer
   - Key tactics to follow
   - Constraints to respect

3. **Extract Layer Design:**
   - Read full `## {Layer} Layer` section
   - Extract "What and Why" (understanding)
   - Extract "Public Interface" (pseudo-code contracts)

4. **Extract Test Strategy:**
   - Critical scenarios (Given-When-Then)
   - Edge cases
   - Test layers mapping

### Step 3: Load Governance Patterns

**Use pattern-loader skill:**

```json
{
  "action": "load",
  "filter": {
    "pattern_names": ["ddd-aggregates", "event-sourcing", ...]
  }
}
```

Extract pattern names from plan's "Pattern Compliance" section for this layer.

**Focus on:**
- **Critical tactics** (priority: critical) - MUST follow
- **Important tactics** (priority: important) - Should follow
- **Constraints** - MUST/MUST NOT rules
- **Anti-patterns** - Avoid these

### Step 4: Explore Codebase

**Find reference implementations:**

1. Search for similar aggregates/handlers/adapters
2. Understand established coding patterns
3. Identify reusable components:
   - Base classes
   - Existing value objects
   - Existing utilities
   - Testing helpers

**Review workspace conventions:**
- Read `./CLAUDE.md` if exists
- Understand naming conventions
- Understand directory structure
- Understand testing patterns

### Step 5: Implement Components

**Implementation order by layer:**

**Domain Layer:**
1. Value Objects (no dependencies)
2. Domain Events (simple DTOs)
3. Aggregates (use VOs and events)
4. Repository interfaces (reference aggregates)

**Application Layer:**
1. Commands and Queries (DTOs)
2. Port interfaces (external dependencies)
3. Command Handlers (orchestrate domain)
4. Query Handlers (read from repositories)
5. Projectors (subscribe to events)
6. Domain Services (if needed)

**Infrastructure Layer:**
1. API types (request/response DTOs)
2. Adapters (implement ports)
3. Repository implementations (implement domain interfaces)
4. Lambda handlers (call application handlers)

**For each component:**

1. **Follow plan's pseudo-code interface** (your contract)
2. **Apply pattern tactics:**
   - Use pattern descriptions as guide
   - Follow critical tactics strictly
   - Apply important tactics unless strong reason not to
3. **Match coding style** from reference implementations
4. **Add JSDoc comments** for public APIs
5. **Use TypeScript** with strict types

**Quality guidelines:**
- No infrastructure dependencies in domain layer
- Application layer depends on domain, defines ports for infrastructure
- Infrastructure implements ports, depends on application and domain

### Step 6: Write Tests

**Test strategy from plan:**

**Domain layer → Unit tests:**
- Aggregate business methods with in-memory event store
- Value object validation
- Domain service logic
- Use fakes for all external dependencies

**Application layer → Integration tests:**
- Command handlers with test database
- Query handlers with seeded read models
- Projectors with test event streams
- Use real repositories, fake adapters

**Infrastructure layer → Component tests:**
- API endpoint → Lambda → Application → Domain → Infrastructure
- Real database (ephemeral test DB)
- Fake external services (SES, third-party APIs)

**For each implementation file:**
1. Create corresponding test file
2. Implement Given-When-Then scenarios from plan
3. Implement edge case tests
4. Run tests: `npm test` (or appropriate command)
5. Verify all tests pass

**Test naming:**
- Descriptive test names from plan
- Follow Given-When-Then structure
- Group related tests

### Step 7: Verify Pattern Compliance

**Self-check:**

- [ ] All critical tactics followed
- [ ] All important tactics followed (or deviation documented)
- [ ] All constraints satisfied
- [ ] No anti-patterns present
- [ ] All pseudo-code interfaces implemented
- [ ] All public methods match signatures in plan
- [ ] Return types match plan specifications
- [ ] All tests pass
- [ ] No linting errors
- [ ] TypeScript compiles without errors

### Step 8: Collect Results

**Build output JSON:**

1. **Write implementation summary:**
   - Brief 1-2 sentence overview of what was implemented
   - Example: "Implemented Tenant aggregate root with value objects, domain events, and repository interface following DDD patterns"

2. **List components implemented with rationale:**
   - For each component (aggregate, value object, handler, etc.):
     - `name`: Component name (e.g., "Tenant aggregate")
     - `description`: What it does (e.g., "Aggregate root managing tenant lifecycle")
     - `rationale`: Why it was implemented this way (e.g., "Encapsulates business rules and ensures state changes produce events")

3. **Identify deviations from plan:**
   - Compare implementation to plan
   - If you added/changed something not in plan:
     - `description`: What deviated
     - `rationale`: Why it was necessary
   - If no deviations: return empty array

4. **Collect test results:**
   - Total test count
   - Passed count
   - Failed count (if any)
   - List test file paths

5. **List files:**
   - Created files (new)
   - Modified files (existing)

6. **List patterns applied:**
   - Which patterns were followed
   - Version numbers

7. **Collect errors/warnings:**
   - Test failures
   - TypeScript errors
   - Linting errors
   - Pattern violations (if any)

8. **Return structured JSON** as specified in Output section

### Error Handling

**If tests fail:**
```json
{
  "success": false,
  "layer": "domain",
  "components": [...],
  "tests": {
    "total": 8,
    "passed": 6,
    "failed": 2
  },
  "errors": [
    "Test: 'Tenant.create throws error for invalid email' failed",
    "Test: 'Tenant.activate validates state' failed"
  ]
}
```

**If TypeScript compilation fails:**
```json
{
  "success": false,
  "errors": [
    "TypeScript error in Tenant.aggregate.ts:45: Type 'string' is not assignable to type 'EmailAddress'"
  ]
}
```

**If pattern violation detected:**
```json
{
  "success": true,
  "warnings": [
    "Potential pattern violation: Some state fields in Tenant lack _ prefix (encapsulate-state tactic)"
  ]
}
```

## Usage Example

**Caller (implement-hex-arc command):**
```markdown
Call implementation-engine skill with:
- feature: "tenant-onboarding"
- layer: "domain"

Receive result JSON.

If result.success:
  Display to user:
  "✅ Domain layer implementation complete

   Components:
   • Tenant aggregate with create() and activate()
   • EmailAddress value object
   • CompanyName value object
   ...

   Tests: 8/8 passing
   Files: src/domain/..."

If NOT result.success:
  Display errors:
  "❌ Implementation failed:
   {result.errors}"
```

**Caller (orchestrate command):**
```markdown
Call implementation-engine skill with same inputs.

Receive result JSON.

Log to audit trail:
"Status: ✅ Complete
- Implemented: {result.components}
- Tests: {result.tests.passed}/{result.tests.total}
- Files: {result.files.created}"

Use result.success to decide next step (review or abort).
```

## Notes for Claude

**Implementation is your responsibility:**
- Write actual code that follows patterns
- Don't just outline or create stubs
- Implement complete functionality per plan

**Pattern adherence:**
- Critical tactics are non-negotiable
- Find a way to follow them
- If you must deviate, include in warnings

**Testing is mandatory:**
- Tests are part of implementation
- Not optional
- Failing tests mean incomplete implementation

**Output format:**
- Always return valid JSON
- Structure exactly as specified
- Include all fields even if empty arrays
