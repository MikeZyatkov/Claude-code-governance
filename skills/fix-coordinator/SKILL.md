---
name: fix-coordinator
description: Manages fix cycles with iteration tracking, progress monitoring, and user intervention triggers. Coordinates multiple fix iterations for code that fails quality gate, generates detailed fix prompts, and triggers user intervention when needed.
---

# Fix Coordinator Skill

Manages fix cycles with iteration tracking, progress monitoring, and user intervention triggers.

## Purpose

Coordinates multiple fix iterations for code that fails quality gate. Tracks progress, generates detailed fix prompts, spawns fix agents, and triggers user intervention when needed.

## Input

```json
{
  "feature": "tenant-onboarding",
  "layer": "domain",
  "gate_result": {
    "passed": false,
    "issues": {
      "critical": [...],
      "important": [...],
      "constraint_failures": [...]
    }
  },
  "threshold": 4.5,
  "max_iterations": 3,
  "current_iteration": 0,
  "previous_score": null
}
```

## Output

```json
{
  "fixed": true | false,
  "final_review": {
    "overall_score": 4.6,
    "patterns": [...]
  },
  "iterations_used": 2,
  "intervention_needed": false,
  "intervention_reason": null
}
```

## Instructions for Claude

### Step 1: Check Iteration Limit

```
if current_iteration >= max_iterations:
  return {
    "fixed": false,
    "intervention_needed": true,
    "intervention_reason": "Max iterations reached"
  }
```

### Step 2: Analyze Issues

**Categorize issues:**
- Critical issues (must fix)
- Important issues (must fix)
- Constraint failures (must fix)
- Optional issues (nice to fix, but not blocking)

**Check if fixable:**
- Code-fixable: Syntax, patterns, validation logic
- Architectural: Design decisions, boundary choices → needs user

```
if has_architectural_issues(gate_result.issues):
  return {
    "fixed": false,
    "intervention_needed": true,
    "intervention_reason": "Architectural issues detected"
  }
```

### Step 3: Generate Fix Prompt

**Build detailed fix prompt:**

```
You are fixing code review issues for the {layer} layer of "{feature}".

Current Score: {previous_score or "N/A"}/5.0 (threshold: {threshold})
Iteration: {current_iteration + 1}/{max_iterations}

Issues to fix (in priority order):

{format_issues_for_fix(gate_result.issues)}

Instructions:
1. Focus ONLY on fixing these specific issues
2. Do not refactor unrelated code
3. Maintain existing functionality
4. Run tests after fixes to ensure nothing broke
5. Report what was changed

Fix these issues now.
```

**Format issues for fix:**

```markdown
1. **[CRITICAL]** {issue.tactic_name} ({issue.pattern_name}) - Score: {issue.score}/5

   Problem Found:
   {issue.reasoning}

   What's Required:
   {generate_required_description(issue)}

   Why It Matters:
   {issue.impact or generate_impact(issue)}

   Specific Fixes Needed:
   {extract_specific_fixes(issue.reasoning)}

2. **[IMPORTANT]** {issue.tactic_name}...

{...}

{If constraint_failures:}

N. **[CONSTRAINT FAILED]** {constraint.rule}

   Problem Found:
   {constraint.reasoning}

   What's Required:
   {constraint.description}

   Why It Matters:
   Hard constraint violation - must be fixed before proceeding
```

### Step 4: Spawn Fix Agent

**Use Task tool:**
```
Call Task tool with:
- subagent_type: "general-purpose"
- prompt: {fix_prompt}
```

**Capture result:**
- What was fixed
- Which files modified
- Test results

### Step 5: Re-Review After Fixes

**Call review-engine skill:**
```json
{
  "feature": "{feature}",
  "layer": "{layer}",
  "code_source": "git_diff"
}
```

**Call quality-gate skill:**
```json
{
  "review": {review_result},
  "threshold": {threshold}
}
```

### Step 6: Check Progress

**If quality gate passed:**
```json
{
  "fixed": true,
  "final_review": {review_result},
  "iterations_used": current_iteration + 1,
  "intervention_needed": false
}
```

**If quality gate still failing:**

Check if score improved:
```
if new_score <= previous_score:
  return {
    "fixed": false,
    "intervention_needed": true,
    "intervention_reason": "Score not improving"
  }
```

If improved but not enough, and iterations remaining:
```
Recurse: call fix-coordinator again with:
- current_iteration: current_iteration + 1
- previous_score: new_score
- gate_result: new_gate_result
```

**If max iterations reached:**
```json
{
  "fixed": false,
  "final_review": {review_result},
  "iterations_used": max_iterations,
  "intervention_needed": true,
  "intervention_reason": "Max iterations reached without passing"
}
```

## Architectural Issue Detection

**Check for architectural issues:**

```
function has_architectural_issues(issues):
  architectural_tactics = [
    "aggregate-boundary",
    "consistency-boundary",
    "port-definition",
    "adapter-pattern"
  ]

  for issue in issues.critical + issues.important:
    if issue.tactic_id in architectural_tactics:
      if score < 3:  // Very low score suggests design issue
        return true

  return false
```

## Specific Fixes Extraction

**Parse reasoning for actionable fixes:**

```
function extract_specific_fixes(reasoning):
  fixes = []

  // Look for patterns:
  if "without _ prefix" in reasoning:
    fixes.append("Make field private: Rename to _{field_name}, add getter")

  if "doesn't validate" in reasoning:
    fixes.append("Add validation: Check {condition} before {action}")

  if "missing" in reasoning:
    fixes.append("Add missing: {what_is_missing}")

  return fixes
```

## Usage Example

**Orchestrator after quality gate fails:**
```markdown
Call fix-coordinator skill with:
- feature: "tenant-onboarding"
- layer: "domain"
- gate_result: {from quality-gate}
- threshold: 4.5
- max_iterations: 3
- current_iteration: 0
- previous_score: null

Receive result.

If result.fixed:
  Log success to audit
  Proceed to commit

If result.intervention_needed:
  Log intervention request
  Ask user:
    "⚠️ Intervention required: {result.intervention_reason}

    Current score: {result.final_review.overall_score}
    Iterations used: {result.iterations_used}

    What would you like to do?"
```

## Error Handling

**Fix agent fails:**
```json
{
  "fixed": false,
  "intervention_needed": true,
  "intervention_reason": "Fix agent failed: {error}"
}
```

**Review fails after fix:**
```json
{
  "fixed": false,
  "intervention_needed": true,
  "intervention_reason": "Review failed after fixes"
}
```

## Notes for Claude

**Iteration Tracking:**
- Start at 0
- Increment for each fix attempt
- Max 3 iterations (configurable)

**Progress Monitoring:**
- Track score changes between iterations
- If score not improving → intervention
- If score improved but not enough → continue

**Fix Prompts:**
- Be specific and actionable
- Reference exact code locations if available
- Include pattern context
- Explain why it matters

**User Intervention:**
- Trigger early if architectural issues detected
- Don't waste iterations on unfixable issues
- Provide clear context for user decision

**Recursion:**
- Call self for next iteration if needed
- Pass updated state (score, iteration)
- Stop at max iterations
