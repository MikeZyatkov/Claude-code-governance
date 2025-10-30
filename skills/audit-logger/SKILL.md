---
name: audit-logger
description: Manages audit trail operations for orchestrated implementation workflows. Provides centralized audit logging functionality - initializing trails, appending timestamped entries, and formatting detailed issue descriptions.
---

# Audit Logger Skill

Manages audit trail operations for orchestrated implementation workflows.

## Purpose

Provides centralized audit logging functionality - initializing trails, appending timestamped entries, formatting detailed issue descriptions.

## Input

```json
{
  "action": "initialize" | "append",
  "feature": "tenant-onboarding",
  "data": {...}
}
```

## Output

```json
{
  "success": true,
  "file_path": "docs/tenant-onboarding/implementation-audit.md",
  "message": "Audit entry appended"
}
```

## Actions

### Action: Initialize

**Purpose:** Create new audit trail file

**Input data:**
```json
{
  "threshold": 4.5,
  "max_iterations": 3,
  "layers": ["domain", "application", "infrastructure"]
}
```

**Creates file:** `docs/{feature}/implementation-audit.md`

**Content structure:** See "For Initialize Action" instructions below for exact template with real timestamps.

### Action: Append

**Purpose:** Add timestamped entry to audit trail

**Input data:**
```json
{
  "entry_type": "implementation_start" | "implementation_complete" | "review_start" | "review_complete" | "fix_start" | "fix_complete" | "commit" | "intervention",
  "from": "Orchestrator",
  "to": "Implementation Agent",
  "content": {
    // entry-specific data
  }
}
```

**Entry formats by type:**

**NOTE:** In all templates below, `{timestamp_value}` should be replaced with the exact timestamp string from the input `timestamp` parameter.

#### implementation_start
```markdown
**{timestamp_value}: Orchestrator → Implementation Agent**
Command: Implement {layer} layer
Goal: {goal}
```

Example:
```markdown
**2025-10-30 16:23:45: Orchestrator → Implementation Agent**
Command: Implement domain layer
Goal: Build Tenant aggregate with value objects
```

#### implementation_complete
```markdown
**{timestamp_value}: Implementation Agent → Orchestrator**
Status: ✅ Complete

Summary: {brief_summary_of_what_was_implemented}

Components Implemented:
- {component_1_name}: {what_it_does_and_why}
- {component_2_name}: {what_it_does_and_why}
- ...

Key Changes:
- {change_1}: {rationale}
- {change_2}: {rationale}
- ...

Deviations from Plan:
{If any deviations:}
- {deviation_description}: {why_it_was_necessary}
{If no deviations:}
- None - implementation follows plan as specified

Tests: {passing}/{total} passing ({test_count} test cases)
Files: {created_count} created, {modified_count} modified
```

**Remember:** `{timestamp_value}` must be replaced with the ACTUAL output from the Bash date command (e.g., "2025-10-30 16:23:45")

#### review_start
```markdown
**{timestamp}: Orchestrator → Review Agent**
Command: Review {layer} layer implementation
Threshold: {threshold}/5.0
```

#### review_complete
```markdown
**{timestamp}: Review Agent → Orchestrator**
Status: {✅ Quality gate passed | ⚠️ Quality gate failed}
- Score: {score}/5.0 (threshold: {threshold})
- Patterns evaluated: {pattern_list with scores}

{If failed:}
Issues found:

{formatted_issues}

{If passed:}
All critical and important tactics: ✅ Score ≥ 4
Constraints: All passed
```

#### fix_start
```markdown
**{timestamp}: Orchestrator → Fix Agent**
Command: Fix issues from review (iteration {current}/{max})
Target issues:
{issue_list}
```

#### fix_complete
```markdown
**{timestamp}: Fix Agent → Orchestrator**
Status: ✅ Complete
Changes applied:
{changes_list}
Files modified: {file_list}
```

#### commit
```markdown
**{timestamp}: Orchestrator → Git**
Action: Commit {layer} layer
Message: "{commit_message}"
Commit: {commit_hash}
Details: Review score {score}/5.0, {iterations} fix iteration(s), {pattern_scores}
```

#### intervention
```markdown
**{timestamp}: Orchestrator → User**
⚠️ User Intervention Required

Layer: {layer}
Iteration: {current}/{max}
Current Score: {score}/5.0 (threshold: {threshold})

Reason: {reason}

{issue_details}

Recommended actions:
{actions}
```

## Issue Formatting

**For review_complete entries with issues:**

```markdown
1. **[CRITICAL]** {tactic_name} ({pattern_name}) - Score: {score}/5
   Problem: {reasoning from review}
   Required: {what pattern expects}
   Impact: {why this matters}

2. **[IMPORTANT]** {tactic_name} ({pattern_name}) - Score: {score}/5
   Problem: {reasoning}
   Required: {requirement}
   Impact: {impact}

{...}

Constraints:
- {constraint_status}
```

**Impact descriptions by tactic type:**
- `encapsulate-state`: "Breaks encapsulation, allows direct state mutation bypassing domain logic and events."
- `apply-via-events`: "State changes not recorded in event store, breaks event sourcing and audit trail."
- `invariant-methods`: "Business rules can be violated, invalid state transitions possible."
- `aggregate-root`: "Breaks aggregate boundary, consistency guarantees compromised."
- Default: "Violates architectural pattern, reduces code quality and maintainability."

## Instructions for Claude

### CRITICAL: Getting Current Timestamp

**BEFORE doing anything else in this skill, you MUST get the current timestamp using the Bash tool.**

**DO THIS:**
1. Use the Bash tool to run: `date '+%Y-%m-%d %H:%M:%S'`
2. Capture the exact output (e.g., "2025-10-30 16:23:45")
3. Store this value in a variable to use throughout the skill

**DO NOT:**
- Generate placeholder timestamps like "12:00am" or "{timestamp}"
- Use ISO format like "2025-10-30T12:00:00.000Z"
- Make up any timestamp value
- Skip running the Bash tool

**Example of correct usage:**
```
Step 1: Call Bash tool with command "date '+%Y-%m-%d %H:%M:%S'"
Step 2: Receive output: "2025-10-30 16:23:45"
Step 3: Use "2025-10-30 16:23:45" in all templates below
```

### For Initialize Action

**Steps:**

1. **Get current timestamp using Bash tool** (see CRITICAL section above)
2. Extract date portion: split timestamp on space, take first part (e.g., "2025-10-30")
3. Create file at `docs/{feature}/implementation-audit.md`
4. Write initial content using the timestamp from step 1

Template:
```markdown
# Implementation Audit Trail: {feature}

Started: {use timestamp from Bash tool - step 1}
Threshold: {threshold}/5.0
Max iterations: {max_iterations}
Layers: {layers}

---

## Session: {use date portion from Bash tool timestamp}

```

Example (using actual Bash output "2025-10-30 16:23:45"):
```markdown
# Implementation Audit Trail: tenant-onboarding

Started: 2025-10-30 16:23:45
Threshold: 4.5/5.0
Max iterations: 3
Layers: domain, application, infrastructure

---

## Session: 2025-10-30

```

5. Return success

### For Append Action

**Steps:**

1. **Get current timestamp using Bash tool** (see CRITICAL section above)
2. Format entry based on entry_type, using the timestamp from step 1
3. Use appropriate template below
4. Fill in data from content object
5. Format issues if present

3. **Append to file**
   - Add blank line before entry
   - Write formatted entry
   - Ensure proper markdown formatting

4. **Return success**

### Issue Formatting Helper

**For each issue:**
```
priority_label = issue.priority.toUpperCase()
pattern_name = issue.pattern_name or "Unknown Pattern"

formatted = f"""
{index}. **[{priority_label}]** {issue.tactic_name} ({pattern_name}) - Score: {issue.score}/5
   Problem: {issue.reasoning}
   Required: {get_required_description(issue)}
   Impact: {get_impact_description(issue)}

"""
```

**get_impact_description:**
- Map tactic_id to known impacts
- Use pattern goal if available
- Default generic description

## Usage Examples

**Orchestrator initializes:**
```markdown
Call audit-logger skill with:
- action: "initialize"
- feature: "tenant-onboarding"
- data: {threshold: 4.5, max_iterations: 3, layers: ["domain", "application"]}
```

**Orchestrator logs implementation start:**
```markdown
Call audit-logger skill with:
- action: "append"
- feature: "tenant-onboarding"
- data: {
    entry_type: "implementation_start",
    from: "Orchestrator",
    to: "Implementation Agent",
    content: {
      layer: "domain",
      goal: "Create Tenant aggregate, value objects, and domain events"
    }
  }
```

**Orchestrator logs review with issues:**
```markdown
Call audit-logger skill with:
- action: "append"
- feature: "tenant-onboarding"
- data: {
    entry_type: "review_complete",
    from: "Review Agent",
    to: "Orchestrator",
    content: {
      passed: false,
      score: 4.2,
      threshold: 4.5,
      patterns: [...],
      issues: {
        critical: [...],
        important: [...]
      }
    }
  }
```

## Notes for Claude

**Timestamps:**
- **YOU MUST generate timestamps using the Bash tool** - see CRITICAL section
- Run `date '+%Y-%m-%d %H:%M:%S'` at the START of every action
- Use the exact output from Bash in all entries
- Format: "YYYY-MM-DD HH:MM:SS" (e.g., "2025-10-30 16:23:45")
- Never use placeholders, ISO format, or made-up times

**Markdown Formatting:**
- Consistent structure
- Proper indentation for nested lists
- Use ✅ ⚠️ ❌ symbols for status

**Issue Details:**
- Problem: Specific code examples from reasoning
- Required: Pattern expectations
- Impact: Business/technical consequences

**File Operations:**
- Create file if doesn't exist (initialize)
- Append without overwriting (append)
- Handle file permissions errors
