---
name: audit-logger
description: Manages audit trails for orchestrated implementation workflows. Creates and maintains audit logs at docs/{feature}/implementation-audit.md with timestamped entries tracking all orchestration activities.
allowed-tools: Read, Write, Bash
---

# Audit Logger Skill

Creates and maintains audit trails for orchestrated implementation workflows.

## Purpose

Tracks all orchestration activities in a chronological audit trail:
- Initializes audit file when orchestration starts
- Appends timestamped entries for each phase (implementation, review, fix, commit)
- Formats issues with actionable details
- Provides full traceability of decisions and outcomes

## File Location

Audit trails are stored at: `docs/{feature}/implementation-audit.md`

## When to Use

This skill is invoked by the orchestrator at key workflow moments:
- **Start:** Initialize audit trail with configuration
- **Implementation:** Log when layer implementation starts/completes
- **Review:** Log when code review starts/completes
- **Fix:** Log fix iterations
- **Commit:** Log successful commits
- **Intervention:** Log when user intervention is needed

## How It Works

### Context from Orchestrator

When invoked, this skill reads context from:
1. **Feature name:** From orchestrator's command argument or recent context
2. **Timestamp:** From most recent `date '+%Y-%m-%d %H:%M:%S'` bash command output
3. **Action:** Initialize (first time) or Append (subsequent entries)
4. **Entry data:** From orchestrator's description of what to log

### Workflow

#### Initializing Audit Trail

**When:** First time orchestration starts for a feature

**Steps:**
1. **Generate timestamp:** Run `date '+%Y-%m-%d %H:%M:%S'` and capture output
2. Identify feature name from orchestrator context
3. Extract configuration: threshold, max_iterations, layers
4. Create directory: `mkdir -p docs/{feature}/`
5. Create audit file: `docs/{feature}/implementation-audit.md`
6. Write initial content with timestamp from step 1

**Initial File Template:**
```markdown
# Implementation Audit Trail: {feature}

Started: {timestamp}
Threshold: {threshold}/5.0
Max iterations: {max_iterations}
Layers: {layers_as_comma_separated_list}

---

## Session: {date_from_timestamp}

```

**Example:**
```markdown
# Implementation Audit Trail: tenant-onboarding

Started: 2025-10-30 16:23:45
Threshold: 4.5/5.0
Max iterations: 3
Layers: domain, application, infrastructure

---

## Session: 2025-10-30

```

---

#### Appending Audit Entries

**When:** Every major orchestration event (implementation, review, fix, commit)

**Steps:**
1. **Generate timestamp:** Run `date '+%Y-%m-%d %H:%M:%S'` and capture output
2. Identify feature name from context
3. Determine entry type from context:
   - implementation_start
   - implementation_complete
   - review_start
   - review_complete
   - fix_start
   - fix_complete
   - commit
   - intervention
4. Read entry format from ENTRY-FORMATS.md (see below)
5. Fill in entry data from orchestrator's context
6. Append to audit file with blank line separator

**Entry Format Reference:**
For detailed entry templates, see [ENTRY-FORMATS.md](./ENTRY-FORMATS.md)

**Quick Reference:**
- **implementation_start:** `**{timestamp}: Orchestrator → Implementation Agent** Command: Implement {layer} layer`
- **implementation_complete:** Status, summary, components, tests, files
- **review_start:** `**{timestamp}: Orchestrator → Review Agent** Command: Review {layer} layer`
- **review_complete:** Status, score, patterns, issues
- **fix_start:** Fix iteration with target issues
- **fix_complete:** Changes applied and files modified
- **commit:** Commit details with hash and scores
- **intervention:** User intervention request with reason

---

## Instructions for Claude

### Reading Context

**Feature name:**
- Look for the feature name in the orchestrator's recent messages
- Check for command arguments like `/orchestrate:hex-arc tenant-onboarding`
- Check for references to feature in recent workflow

**Timestamp:**
- Run `date '+%Y-%m-%d %H:%M:%S'` at the start of EVERY action (initialize or append)
- Capture the output immediately
- Use this timestamp in the audit entry
- Format: "YYYY-MM-DD HH:MM:SS" (e.g., "2025-10-30 16:23:45")

**Action (Initialize vs Append):**
- Initialize: When audit file doesn't exist yet, or orchestrator says "initialize"
- Append: When audit file exists and orchestrator describes what to log

**Entry Data:**
- Read from orchestrator's description of the current phase
- For implementation: layer name, goal
- For review: layer name, score, threshold, issues
- For commit: commit hash, message, score
- For intervention: reason, iteration, issues

### Formatting Guidelines

**Markdown Structure:**
- Consistent indentation
- Blank line before each entry
- Use ✅ ⚠️ ❌ symbols for visual status
- Proper markdown list formatting

**Timestamps:**
- Always use the exact timestamp from orchestrator's `date` command
- Never generate or make up timestamps
- Format: "YYYY-MM-DD HH:MM:SS" (24-hour format)

**Issue Formatting:**
- For review_complete with issues, format each issue with:
  - Priority: [CRITICAL] or [IMPORTANT]
  - Tactic name and pattern name
  - Score out of 5
  - Problem description (from review reasoning)
  - Required (what pattern expects)
  - Impact (why this matters)
- See ENTRY-FORMATS.md for full details

### Error Handling

**File doesn't exist (for append):**
- Check if audit file exists: `[ -f docs/{feature}/implementation-audit.md ]`
- If not, switch to initialize action
- Create directory if needed

**Directory doesn't exist:**
- Create directory first: `mkdir -p docs/{feature}/`
- Then create audit file

**Timestamp generation fails:**
- If `date` command fails, report error to orchestrator
- Don't proceed without valid timestamp

### Progressive Disclosure

**Detailed Templates:**
- Main workflow above covers the basics
- For detailed entry format templates: [ENTRY-FORMATS.md](./ENTRY-FORMATS.md)
- Reference that file when formatting complex entries (review_complete, intervention)

---

## Example Workflows

### Example 1: Initialize

**Context:**
- Orchestrator starts: `/orchestrate:hex-arc tenant-onboarding --threshold 4.5`
- Orchestrator invokes audit-logger to initialize

**Actions:**
1. Run `date '+%Y-%m-%d %H:%M:%S'` → output: "2025-10-30 16:23:45"
2. Read feature name from context: "tenant-onboarding"
3. Read config: threshold=4.5, max_iterations=3, layers=[domain, application, infrastructure]
4. Create directory: `mkdir -p docs/tenant-onboarding/`
5. Write audit file with initial template using timestamp from step 1
6. Confirm: "Audit trail initialized at docs/tenant-onboarding/implementation-audit.md"

---

### Example 2: Append Implementation Start

**Context:**
- Orchestrator about to start domain layer implementation
- Orchestrator invokes audit-logger: "Log implementation start for domain layer, goal is to create Tenant aggregate"

**Actions:**
1. Run `date '+%Y-%m-%d %H:%M:%S'` → output: "2025-10-30 16:25:12"
2. Read feature name from context: "tenant-onboarding"
3. Read entry data: layer="domain", goal="create Tenant aggregate"
4. Format entry (implementation_start template from ENTRY-FORMATS.md):
   ```markdown
   **2025-10-30 16:25:12: Orchestrator → Implementation Agent**
   Command: Implement domain layer
   Goal: Create Tenant aggregate with value objects
   ```
5. Append to docs/tenant-onboarding/implementation-audit.md
6. Confirm: "Entry appended"

---

### Example 3: Append Review Complete with Issues

**Context:**
- Review just completed, found issues
- Orchestrator invokes audit-logger with review results

**Actions:**
1. Run `date '+%Y-%m-%d %H:%M:%S'` → output: "2025-10-30 16:45:30"
2. Read review data: score=4.2, threshold=4.5, failed=true, issues=[...]
3. Format entry (review_complete template from ENTRY-FORMATS.md)
4. Format issues list with problem/required/impact
5. Append to audit file
6. Confirm: "Review results logged"

---

## Notes

**Timestamps are Critical:**
- Always run `date '+%Y-%m-%d %H:%M:%S'` at the start of each action
- This ensures accurate, real-time timestamps
- Never use placeholder values like "12:00am" or hardcoded times

**Progressive Loading:**
- Main SKILL.md provides workflow and quick reference
- ENTRY-FORMATS.md has detailed templates (load when formatting complex entries)
- Keep context focused - only load what's needed

**File Operations:**
- Use Write tool to create initial file
- Use Edit tool or append pattern to add entries
- Ensure proper blank line separation between entries
- Maintain markdown formatting consistency
