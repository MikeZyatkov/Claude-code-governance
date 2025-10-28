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

### Step 1: Parse and Validate Inputs

**Parse command arguments:**
```
feature_name = first argument
layer = second argument
```

If missing:
```
❌ Error: Missing required arguments

Usage: /implement:hex-arc <feature-name> <layer>
Example: /implement:hex-arc tenant-onboarding domain
```

### Step 2: Invoke Implementation Engine Skill

**Call the `implementation-engine` skill:**

```json
{
  "feature": "{feature_name}",
  "layer": "{layer}",
  "plan_path": "docs/{feature_name}/plan.md"
}
```

The skill will:
- Validate plan exists and layer is in plan
- Load implementation plan details
- Load governance patterns
- Explore codebase for conventions
- Implement components following patterns
- Write tests
- Verify pattern compliance
- Return structured result

### Step 3: Handle Result

**If result.success = false:**

Display error to user:
```
❌ Implementation failed: {result.error}

{If result.message:}
{result.message}

{If result.available_layers:}
Available layers: {result.available_layers}
```

Stop execution.

**If result.success = true:**

Continue to Step 4.

### Step 4: Display Results to User

**Format implementation summary:**

```
✅ {layer} Layer Implementation Complete

📦 Components Implemented:
{For each component in result.components:}
  • {component}

🧪 Tests:
  • {result.tests.total} test cases implemented
  • {result.tests.passed}/{result.tests.total} tests passing
{If result.tests.failed > 0:}
  ⚠️ {result.tests.failed} tests failing
  {List test failures from result.errors}

📁 Files:
{If result.files.created:}
  Created:
  {For each file in result.files.created:}
    • {file}

{If result.files.modified:}
  Modified:
  {For each file in result.files.modified:}
    • {file}

📋 Patterns Applied:
{For each pattern in result.patterns_applied:}
  • {pattern}

{If result.warnings:}
⚠️ Warnings:
{For each warning in result.warnings:}
  • {warning}

{If result.errors:}
❌ Errors:
{For each error in result.errors:}
  • {error}

💡 Next Steps:
  • Review the implementation
  • Run review: /review:hex-arc {feature_name}
  • Or implement next layer: /implement:hex-arc {feature_name} <next-layer>
```

### Step 5: Optional - Update Plan

**If implementation deviated from plan or has notes:**

Consider updating `docs/{feature_name}/plan.md` with implementation notes section (as skill may have added this already).

## Error Handling

**Plan not found:**
- Skill returns error with clear message
- Display to user with suggestion to run /plan:hex-arc first

**Layer not found:**
- Skill returns available layers
- Display to user

**Tests failing:**
- Display as part of summary
- Mark as warning (implementation complete but tests need fixing)

**TypeScript errors:**
- Display as errors
- Mark implementation as unsuccessful

## Notes for Claude

**This command is now a thin wrapper:**
- Validates inputs
- Calls implementation-engine skill
- Formats output for user display

**All implementation logic is in the skill:**
- Pattern loading
- Code generation
- Testing
- Verification

**User interaction:**
- This command handles user-facing presentation
- Clear, formatted output
- Actionable next steps

**Skill returns structured data:**
- Parse and format for human reading
- Use emojis for visual clarity (✅ ⚠️ ❌ 📦 🧪 📁 📋 💡)
- Keep output concise but informative
