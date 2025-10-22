---
name: implement:hex-arc
description: "Implement hexagonal architecture layer: /implement:hex-arc <feature-name> <layer>"
---

# Hexagonal Architecture Layer Implementation

Implements a specific layer for a feature following the implementation plan created by `/plan:hex-arc`.

## Usage

```
/implement:hex-arc <feature-name> <layer>
```

**Layer**: Any layer name that exists in the implementation plan (e.g., `domain`, `application`, `infrastructure`, or custom layer names)

**Example**: `/implement:hex-arc tenant-onboarding domain`

## Instructions for Claude

You are implementing a **specific layer** for a feature based on its implementation plan.

### Step 1: Validate Inputs and Locate Layer

**Check plan exists:**
- Verify `docs/{feature_name}/plan.md` exists

If plan doesn't exist:
```
❌ Error: Implementation plan not found
Expected: docs/{feature_name}/plan.md

Please run /plan:hex-arc {feature_name} first to create the plan.
```

**Validate layer exists in plan:**
1. Read `docs/{feature_name}/plan.md`
2. Search for a section titled `## {Layer} Layer` (case-insensitive match)
   - E.g., `## Domain Layer`, `## Application Layer`, `## Infrastructure Layer`
   - Or custom layers: `## Presentation Layer`, `## Integration Layer`, etc.
3. Check if that section has content (tasks, components to implement)

If layer section not found in plan:
```
❌ Error: Layer "{layer}" not found in implementation plan

Available layers in docs/{feature_name}/plan.md:
  • Domain Layer
  • Application Layer
  • Infrastructure Layer

Please specify one of the layers above, or update the plan to include a "{layer} Layer" section.
```

### Step 2: Read the Implementation Plan

Read `docs/{feature_name}/plan.md` thoroughly:

1. **Understand the full feature context**:
   - Overview section
   - Pattern Compliance strategy
   - All layer designs (to understand dependencies)

2. **Focus on the target layer**:
   - Read the `{layer} Layer` section in detail
   - Study the pseudo-code interfaces (these are your contracts)
   - Note which patterns apply to this layer

3. **Review Test Strategy**:
   - Identify test scenarios for this layer
   - Understand Given-When-Then specifications

### Step 3: Review Governance Patterns

**Pattern Discovery:**
1. List all YAML files in the plugin's `patterns/` directory
2. Read patterns that are relevant to this layer (identified in plan's "Pattern Compliance" section)

**Layer-Specific Patterns:**
- **Domain layer**: DDD Aggregates, Value Objects, Domain Events, Event Sourcing, Repository (interfaces)
- **Application layer**: CQRS, Domain Services, Projectors, Ports (interfaces)
- **Infrastructure layer**: Infrastructure API, Repository (implementations), Adapters

**Pattern Focus:**
For each relevant pattern, pay special attention to:
- **Critical tactics** (priority: critical) - MUST follow these
- **Important tactics** (priority: important) - Should follow these
- **Constraints** with MUST/MUST NOT rules
- **Anti-patterns** to avoid

### Step 4: Explore Existing Codebase

Before implementing:

1. **Find similar implementations** mentioned in the plan
   - Search for reference implementations
   - Understand coding style and conventions

2. **Review ./CLAUDE.md** for workspace conventions
   - Naming patterns
   - Directory structure
   - Testing approach

3. **Identify reusable components**:
   - Existing base classes
   - Existing utilities
   - Existing test helpers

### Step 5: Implement the Layer

**Implementation Guidelines:**

**Use Plan as Specification:**
- Pseudo-code interfaces in plan are your contracts
- Implement exactly what's specified (types, methods, return values)
- If you need to deviate, note it for Implementation Notes section

**Follow Patterns Strictly:**
- Apply critical tactics from patterns without exception
- Apply important tactics unless there's a strong reason not to
- Document any deviations from patterns

**Layer-Specific Implementation:**

**Domain Layer:**
- Start with Value Objects (no dependencies)
- Then Domain Events (simple DTOs)
- Then Aggregates (use value objects and events)
- Repository interfaces last (reference aggregates)
- **No infrastructure dependencies**

**Application Layer:**
- Start with Commands and Queries (simple DTOs)
- Then Port interfaces (define external dependencies)
- Then Command Handlers (orchestrate domain)
- Then Query Handlers (read from repositories)
- Then Projectors (subscribe to events)
- Domain Services if needed (cross-aggregate logic)
- **Depend on domain, define ports for infrastructure**

**Infrastructure Layer:**
- API types (request/response DTOs)
- Adapter implementations (implement ports from application)
- Repository implementations (implement domain interfaces)
- Lambda handlers (call application handlers)
- **Implement ports, depend on application and domain**

**Code Quality:**
- Match coding style from reference implementations
- Use TypeScript with strict types
- Add JSDoc comments for public APIs
- Follow naming conventions from plan

**Work Incrementally:**
- Implement one component at a time
- Write tests for each component before moving to next
- Run tests frequently
- Fix any failures before proceeding

### Step 6: Write Tests

Implement tests based on plan's "Test Strategy" section:

**Test Layer Mapping:**
- **Domain layer**: Unit tests (aggregate logic, value object validation)
- **Application layer**: Integration tests (handlers with test DB, projectors)
- **Infrastructure layer**: Component tests (API → handlers, adapters)

**Test Implementation:**
1. Create test file for each implementation file
2. Implement Given-When-Then scenarios from plan
3. Implement edge case tests from plan
4. Run tests: `npm test` (or appropriate command)
5. Verify all tests pass

**Test Quality:**
- Use descriptive test names from plan
- Follow Given-When-Then structure
- Use fakes for external dependencies
- Test both happy paths and error cases

### Step 7: Verify Against Patterns

Before considering complete, verify:

**Pattern Adherence:**
- [ ] All critical tactics followed
- [ ] All important tactics followed (or deviation documented)
- [ ] All constraints satisfied
- [ ] No anti-patterns present

**Plan Adherence:**
- [ ] All pseudo-code interfaces implemented
- [ ] All public methods match signatures in plan
- [ ] Return types match plan specifications

**Code Quality:**
- [ ] All tests pass
- [ ] No linting errors
- [ ] TypeScript compiles without errors
- [ ] Code matches workspace conventions

### Step 8: Update Implementation Plan

**Update Checklist:**

If the plan has a checklist for this layer, update it:

```markdown
## Implementation Checklist

### Domain Layer
- [x] Value Objects
  - [x] EmailAddress value object
  - [x] CompanyName value object
- [x] Domain Events
  - [x] TenantCreated event
  - [x] TenantActivated event
- [x] Aggregates
  - [x] Tenant aggregate with create() and activate()
- [x] Repository Interfaces
  - [x] ITenantRepository interface
```

**Add Implementation Notes (if needed):**

If you deviated from the plan, add this section at the end of plan.md:

```markdown
---

## Implementation Notes - {Layer} Layer

**Implemented by**: Claude Code
**Date**: {current_date}

### Deviations from Plan

**Deviation 1**: [What changed from original plan]
- **Why**: [Justification - technical constraint, better approach found, etc.]
- **Impact**: [What this affects - other layers, patterns, tests]
- **Pattern Compliance**: [Still compliant? Which tactic/constraint affected?]

**Deviation 2**: [Another change if any]
- **Why**: ...
- **Impact**: ...

### Design Decisions Made

**Decision 1**: [A choice you made during implementation]
- **Options Considered**: [What alternatives were evaluated]
- **Rationale**: [Why this approach was chosen]
- **Trade-offs**: [What was gained vs. what was lost]

### Implementation Details

**Key Implementation Notes**:
- [Any important details about how things were implemented]
- [Performance considerations]
- [Assumptions made]

### Test Results

**Tests Implemented**: {number} test cases
**Tests Passing**: {number} / {number}
**Coverage**: [If known]

**Test Scenarios Covered**:
- [x] Scenario 1 from plan
- [x] Scenario 2 from plan
- [x] Edge case 1
- [ ] Scenario 3 (deferred because...)

### Next Steps

**Ready for Next Layer**: [Yes/No]
- If Yes: Which layer should be implemented next?
- If No: What needs to be resolved first?

**Dependencies for Next Layer**:
- [What the next layer will need from this layer]
- [Any interfaces or contracts established]
```

### Step 9: Report Completion

Provide a summary to the user:

```
✓ {Layer} Layer implementation completed for {feature_name}

📦 Components Implemented:
  • [Component 1 name] - [brief description]
  • [Component 2 name] - [brief description]
  • [Component 3 name] - [brief description]

🧪 Tests:
  • {number} test cases implemented
  • {number}/{number} tests passing
  • Test files: [list test file paths]

📋 Pattern Compliance:
  • DDD Aggregates v1: ✓ All critical tactics followed
  • Event Sourcing v1: ✓ All constraints satisfied
  • [Other patterns]: ✓/⚠️

📝 Plan Updates:
  • Checklist updated: docs/{feature_name}/plan.md
  • Implementation notes added: [Yes/No]

⚠️ Deviations (if any):
  • [Deviation 1 summary]
  • [Deviation 2 summary]

🎯 Next Steps:
  1. Review implementation and tests
  2. Run full test suite to verify integration
  3. Ready to implement {next_layer} layer with:
     /implement:hex-arc {feature_name} {next_layer}

💡 Implementation available at:
  - {list file paths of implemented components}
```

If there were failures or concerns:

```
⚠️ {Layer} Layer implementation completed with concerns

[Same structure as above, but highlight issues]

🔴 Issues Found:
  • [Issue 1: description]
  • [Issue 2: description]

🔧 Recommended Actions:
  1. [Action needed to resolve issue 1]
  2. [Action needed to resolve issue 2]

Do not proceed to next layer until these issues are resolved.
```

## Important Notes for Claude

**Scope Boundaries:**
- **ONLY implement the specified layer** - don't implement other layers
- **ONLY implement what's in the plan** - don't add extra features
- **ONLY write tests for this layer** - don't write tests for other layers

**When to Ask User:**
- Before deviating from plan's design
- Before skipping any component from the plan
- Before changing public interfaces (method signatures, types)
- If you discover the plan is incomplete or has errors
- If tests are failing and you can't resolve

**Pattern Compliance:**
- Critical tactics are non-negotiable - find a way to follow them
- If you must violate a constraint, explain why in Implementation Notes
- Anti-patterns are red flags - avoid them at all costs

**Code Organization:**
- Follow workspace directory structure
- Match naming conventions from similar implementations
- Keep files focused (one aggregate per file, one handler per file)
- Use barrel exports (index.ts) for clean imports

**Testing Priority:**
- Tests are not optional - they're part of implementation
- Failing tests mean incomplete implementation
- If plan's test scenarios are unclear, ask for clarification

**Documentation:**
- Code should match plan's pseudo-code interfaces
- JSDoc comments for public APIs
- Implementation Notes for any deviations
- Clear commit messages describing what was implemented

**Success Criteria:**
All of these must be true before reporting completion:
- ✅ All components from plan's layer section implemented
- ✅ All tests from plan's test strategy passing
- ✅ Critical pattern tactics followed
- ✅ Plan.md checklist updated
- ✅ No TypeScript errors
- ✅ No linting errors
