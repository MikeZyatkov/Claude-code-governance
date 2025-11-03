# Audit Entry Formats

This document contains detailed templates for all audit entry types.

**NOTE:** In all templates below, `{timestamp}` should be replaced with the actual timestamp from the most recent `date` command.

## Entry Types

### implementation_start

```markdown
**{timestamp}: Orchestrator → Implementation Agent**
Command: Implement {layer} layer
Goal: {goal}
```

**Example:**
```markdown
**2025-10-30 16:23:45: Orchestrator → Implementation Agent**
Command: Implement domain layer
Goal: Build Tenant aggregate with value objects
```

---

### implementation_complete

```markdown
**{timestamp}: Implementation Agent → Orchestrator**
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

**Remember:** Replace `{timestamp}` with the ACTUAL output from the Bash date command (e.g., "2025-10-30 16:23:45")

---

### review_start

```markdown
**{timestamp}: Orchestrator → Review Agent**
Command: Review {layer} layer implementation
Threshold: {threshold}/5.0
```

---

### review_complete

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

---

### fix_start

```markdown
**{timestamp}: Orchestrator → Fix Agent**
Command: Fix issues from review (iteration {current}/{max})
Target issues:
{issue_list}
```

---

### fix_complete

```markdown
**{timestamp}: Fix Agent → Orchestrator**
Status: ✅ Complete
Changes applied:
{changes_list}
Files modified: {file_list}
```

---

### commit

```markdown
**{timestamp}: Orchestrator → Git**
Action: Commit {layer} layer
Message: "{commit_message}"
Commit: {commit_hash}
Details: Review score {score}/5.0, {iterations} fix iteration(s), {pattern_scores}
```

---

### intervention

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

---

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

---

## Issue Formatting Helper

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
