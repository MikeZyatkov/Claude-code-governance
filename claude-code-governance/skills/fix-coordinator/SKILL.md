---
name: fix-coordinator
description: Manages fix cycles with iteration tracking and progress monitoring. Coordinates fixes for code that fails quality gate.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Fix Coordinator Skill

Manages fix cycles with iteration tracking, progress monitoring, and user intervention triggers.

## Purpose

Coordinates multiple fix iterations for code that fails quality gate. Tracks progress and triggers user intervention when needed.

## When to Use

Invoked by orchestrator when quality gate fails. Manages the fix-review-gate loop until code passes or max iterations reached.

## How It Works

### Context from Orchestrator

Reads context from:
1. **Feature/Layer:** From recent workflow
2. **Issues to fix:** From quality-gate categorization
3. **Current iteration:** Which fix attempt this is (1, 2, 3...)
4. **Max iterations:** Limit before triggering user intervention (usually 3)
5. **Previous attempts:** What was tried before

### Workflow

#### 1. Initialize Fix Cycle

**Steps:**
1. Read issues from quality-gate output
2. Categorize by priority (must fix, should fix)
3. Initialize iteration counter: iteration = 1
4. Set max_iterations from orchestrator (default: 3)

#### 2. Generate Fix Prompt

**Steps:**
1. Create detailed prompt for fixing issues:
   - List all must-fix issues with context
   - Explain what pattern expects
   - Provide specific code locations
   - Reference pattern requirements
   - Include previous attempt info (if not first iteration)

2. Prompt structure:
   ```
   Fix the following issues in {feature} - {layer} layer:

   CRITICAL ISSUES (Must Fix):
   1. {tactic_name} - Score: {score}/5
      Problem: {problem_description}
      Required: {what_pattern_expects}
      Location: {file}:{line}
      Fix: {specific_guidance}

   2. [...]

   Pattern Requirements:
   - {relevant_tactic_details}
   - {constraint_details}

   [If iteration > 1:]
   Previous Attempt:
   - {what_was_tried}
   - {why_it_didn't_work}
   ```

#### 3. Apply Fixes

**Steps:**
1. Read code files that need fixing
2. Apply fixes following pattern requirements
3. Ensure all must-fix issues addressed
4. Update tests if needed
5. Run tests to verify fixes don't break functionality

#### 4. Track Progress

**Steps:**
1. Increment iteration counter
2. Record what was fixed
3. Note any remaining issues
4. Check iteration limit

#### 5. Decision Point

**After fixes applied:**

**If iteration < max_iterations:**
- Return to orchestrator
- Orchestrator invokes review-engine again
- If gate passes: Success!
- If gate fails: Return to step 2 (next iteration)

**If iteration ≥ max_iterations:**
- Trigger user intervention
- Present situation to user
- Let user decide next steps

## Instructions for Claude

### Reading Issues

**From quality-gate context:**
- Must-fix issues (critical, blocking)
- Should-fix issues (important)
- Pattern requirements
- Failing tactics with scores

### Generating Fix Prompts

**Be Specific:**
- Exact file and line numbers
- Clear problem description
- Concrete fix guidance
- Pattern expectations

**Use Pattern Details:**
- Reference tactic requirements
- Explain why it matters
- Provide examples if helpful

### Applying Fixes

**Systematic Approach:**
1. Fix one issue at a time
2. Verify each fix
3. Run tests after each change
4. Don't introduce new issues

**Pattern Compliance:**
- Follow pattern tactics exactly
- Don't compromise on critical requirements
- Ensure constraints satisfied

### Iteration Tracking

**Keep count:**
- iteration = 1, 2, 3...
- max_iterations (usually 3)
- When iteration ≥ max: intervene

**Record attempts:**
- What was tried
- What worked / didn't work
- Learn from previous iterations

### User Intervention

**When to trigger:**
- Reached max_iterations without passing
- Issues can't be auto-fixed
- Fundamental design problem

**What to present:**
```
⚠️ User Intervention Required

Feature: {feature}
Layer: {layer}
Iteration: {iteration}/{max_iterations}
Current Score: {score}/5.0 (threshold: {threshold})

Issues remaining after {iteration} fix attempts:
{issues_list}

Recommendation:
- [Lower threshold] if current quality acceptable
- [Manual fix] if issues need human judgment
- [Redesign] if fundamental architecture problem

What would you like to do?
```

## Example Workflow

**Context:**
- Feature: tenant-onboarding, Layer: domain
- Quality gate failed: score 4.2, threshold 4.5
- Issues: encapsulate-state (score 3)
- Iteration: 1, Max: 3

**Actions:**
1. Read issues from quality-gate
2. Generate fix prompt:
   ```
   Fix encapsulate-state issue:
   - Problem: Fields email, name, status are public
   - Required: All state private with _ prefix
   - Location: Tenant.ts lines 10-12
   - Fix: Change public fields to private with _ prefix, add getters
   ```
3. Apply fixes:
   - Change `email` to `_email` (private)
   - Add `getEmail()` getter
   - Same for name, status
4. Run tests: All pass ✅
5. Increment iteration: iteration = 2
6. Return to orchestrator
7. Orchestrator runs review again
8. New score: 4.6 → Quality gate PASSED! ✅

**Context 2:**
- After 3 iterations, score still 4.2
- Issues remain: fundamental design problem

**Actions:**
1. Check: iteration = 3 = max_iterations
2. Trigger user intervention
3. Present situation with recommendations
4. Let user decide (lower threshold, manual fix, or redesign)

## Notes

**Max Iterations:** Usually 3, configurable by orchestrator

**Learning:** Each iteration should learn from previous attempts

**Intervention:** Don't keep trying indefinitely - get user involved

**Tool Access:** Full edit access to apply fixes
