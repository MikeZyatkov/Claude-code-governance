# Pattern Validation Scripts

These scripts validate your code against architecture patterns using the LLM-based evaluation framework.

## Quick Start

```bash
# Install dependencies (if not already installed)
npm install

# Validate all patterns
npm run validate:all

# Or validate specific patterns
npm run validate:commands      # Command handlers
npm run validate:queries       # Query handlers
npm run validate:aggregates    # Domain aggregates
npm run validate:value-objects # Value objects
npm run validate:projectors    # Event projectors
```

## Available Commands

### `npm run validate:commands`
Validates all command handlers against the **CQRS pattern**.

**Checks:**
- Handlers use `@injectable()` decorator
- Dependencies injected via `@inject()`
- Returns `string` (ID) or `void`, not full objects
- Calls `repository.writeAsync()` to persist changes
- Business logic delegated to domain layer

**Example output:**
```
🔍 Validating Command Handlers against CQRS Pattern

📋 Pattern: CQRS (v1)

Found 8 command handler(s)

======================================================================
1/8: CreateOccupierCommandHandler.ts
======================================================================

  Overall Score: 4.5/5
  Tactics Score: 4.3/5
  Constraints: ✅ Passed
```

---

### `npm run validate:queries`
Validates all query handlers against the **CQRS pattern**.

**Checks:**
- Queries are read-only (no state modifications)
- Returns DTOs, not domain aggregates
- No calls to `repository.writeAsync()` or `aggregate.save()`
- Uses `@injectable()` for DI

**Critical Check:** Query handlers must NOT modify state

---

### `npm run validate:aggregates`
Validates aggregates against **DDD Aggregates** and **Event Sourcing** patterns.

**Checks:**
- Extends `AggregateRoot` from es-aggregates
- Event handlers registered in constructor
- State changes via `applyChange()`, not direct mutation
- Private fields with public getters
- Static `factory()` method for reconstitution
- Validation before event creation

**Example output:**
```
======================================================================
1/4: Occupier.aggregate.ts
======================================================================

  DDD Pattern Score: 4.8/5
  Event Sourcing Score: 4.6/5

  Overall Average: 4.7/5
```

---

### `npm run validate:value-objects`
Validates value objects against the **Value Objects pattern**.

**Checks:**
- All fields `readonly` (immutable)
- No public setters
- Private constructor with static `create()` factory
- `equals()` method for structural equality
- `toJSON()` for serialization

**Strictness:** Value objects should score ≥4.5 (near-perfect)

---

### `npm run validate:projectors`
Validates projectors against the **Projectors/Read Models pattern**.

**Checks:**
- `handle(eventType, eventData)` method pattern
- Uses port interfaces (`IXxxRDSWriter`)
- No business logic (transformation only)
- Injectable with `@injectable()`
- Event handlers are idempotent

**Critical Check:** Projectors must NOT contain business logic

---

### `npm run validate:all`
Runs all validations sequentially and provides a summary.

**Example output:**
```
📊 FINAL SUMMARY
======================================================================

✅ Command Handlers
✅ Query Handlers
✅ Aggregates
⚠️  Value Objects
✅ Projectors

──────────────────────────────────────────────────────────────────────
Total: 5 | Passed: 4 | Failed: 1
──────────────────────────────────────────────────────────────────────

⚠️  1 validation(s) failed
```

## Configuration

By default, scripts look for code in:
```
/Users/mikhail/Projects/workspace/contexts/tenant-management
```

Override with environment variable:
```bash
export TENANT_MGMT_PATH=/path/to/your/project
npm run validate:commands
```

## Understanding Scores

### Score Ranges
- **4.5-5.0**: Excellent - Exemplary implementation
- **4.0-4.4**: Good - Meets standards with minor gaps
- **3.0-3.9**: Acceptable - Functional but needs improvement
- **2.0-2.9**: Needs Work - Significant issues
- **0.0-1.9**: Poor - Does not follow pattern

### Tactics Priority
- **Critical** (weight: 3.0): Core to pattern, must be excellent
- **Important** (weight: 2.0): Significant but some flexibility
- **Optional** (weight: 1.0): Context-dependent

Low scores on **critical** tactics have the biggest impact.

## What Gets Evaluated

Each script:
1. Loads the appropriate pattern YAML (e.g., `patterns/application/cqrs/v1.yaml`)
2. Loads scoring calibration (e.g., `calibration/cqrs/v1-scoring.yaml`)
3. Finds all matching files (e.g., `**/*CommandHandler.ts`)
4. Sends code + pattern to Claude via LLM evaluation
5. Receives structured scores and reasoning
6. Displays results with actionable feedback

## Reading Results

### ✅ Green (Passed)
- Score ≥4.0 for most patterns
- Score ≥4.5 for value objects
- All constraints passed

### ⚠️ Yellow (Warning)
- Tactic scored 3.0-3.9
- Exception allowed for constraint
- Needs minor improvement

### ❌ Red (Failed)
- Critical tactic scored <3.0
- Constraint violation
- Needs immediate attention

## Acting on Results

### 1. Fix Constraint Violations First
Constraints are hard requirements. Look for:
```
❌ Constraint Violations:
  • Command handlers MUST NOT return full domain objects
    Reasoning: CreateUserCommandHandler returns User instead of string ID
```

### 2. Address Low-Scoring Critical Tactics
```
🔴 Critical DDD Issues:
   • encapsulate-state: 2/5
     Fields are public instead of private with getters
```

### 3. Improve Important Tactics
```
⚠️  Tactics needing improvement:
  🟡 use-mapper-for-conversion (important): 3/5
     Some handlers use inline mapping that could be extracted
```

## Examples

### Example 1: Validate Commands Only
```bash
npm run validate:commands
```

**Use when:**
- You just created new command handlers
- Refactored command layer
- Want quick feedback on CQRS compliance

---

### Example 2: Validate Everything
```bash
npm run validate:all
```

**Use when:**
- Pre-commit quality gate
- Before merging PR
- Weekly code quality check
- After major refactoring

---

### Example 3: CI/CD Integration
```yaml
# .github/workflows/validate-patterns.yml
name: Validate Patterns

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run validate:all
```

## Troubleshooting

### "No files found"
Check `TENANT_MGMT_PATH` points to correct directory:
```bash
export TENANT_MGMT_PATH=/path/to/tenant-management
npm run validate:commands
```

### "ts-node not found"
Install dependencies:
```bash
npm install
```

### Inconsistent scores
Run with multi-pass for consistency:
```typescript
// In script, change:
multiPassCount: 1  // Fast, less consistent
// to:
multiPassCount: 3  // Slower, more consistent
```

### Scores seem wrong
Check calibration file (e.g., `calibration/cqrs/v1-scoring.yaml`) and verify rubrics match your quality expectations.

## Related Documentation

- [Evaluation Guide](../docs/evaluation-guide.md) - Deep dive into how evaluation works
- [Pattern Authoring](../docs/pattern-authoring.md) - Create new patterns
- [Benchmarking Guide](../docs/benchmarking.md) - Track pattern effectiveness

## Tips

1. **Run Early**: Validate as soon as code is written
2. **Focus on Critical**: Fix critical tactics (🔴) before important (🟡)
3. **Iterate**: Make changes, re-validate, verify improvement
4. **Track Trends**: One low score is okay, consistent low scores indicate systemic issues
5. **Use in CI/CD**: Automate quality gates with these scripts
6. **Customize Paths**: Set `TENANT_MGMT_PATH` for different projects

## Support

For issues or questions:
1. Check pattern YAML files in `patterns/`
2. Check scoring rubrics in `calibration/`
3. Review evaluation guide in `docs/evaluation-guide.md`
4. Open issue on GitHub