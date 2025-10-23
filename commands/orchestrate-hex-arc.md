---
name: orchestrate:hex-arc
description: "Orchestrate feature implementation with quality gates: /orchestrate:hex-arc <feature-name> [--layers <list>] [--threshold <score>]"
---

# Hexagonal Architecture Orchestrated Implementation

Orchestrates the complete implementation lifecycle for a feature - managing implementation and review agents with automated quality gates, fix cycles, and git commits.

## Usage

```bash
/orchestrate:hex-arc <feature-name> [--layers <layer-list>] [--threshold <score>]
```

**Parameters:**
- `feature-name` (required): Name of the feature to implement
- `--layers` (optional): Semicolon-separated layer list (e.g., "domain;application;infrastructure"). Default: all layers from plan
- `--threshold` (optional): Minimum review score to pass quality gate (0.0-5.0). Default: 4.5

**Examples:**
```bash
# Orchestrate all layers with default threshold
/orchestrate:hex-arc tenant-onboarding

# Orchestrate specific layers
/orchestrate:hex-arc tenant-onboarding --layers "domain;application"

# Custom quality threshold
/orchestrate:hex-arc tenant-onboarding --threshold 4.0

# Both custom layers and threshold
/orchestrate:hex-arc tenant-onboarding --layers "domain" --threshold 4.2
```

## What It Does

For each layer, the orchestrator:

1. **Implementation** → Spawns implementation agent to build the layer
2. **Review** → Spawns review agent to evaluate code quality
3. **Quality Gate** → Checks if review passes threshold (score ≥ 4.5, no critical/important issues < 4)
4. **Fix Cycle** → If failed, spawns fix agent to address issues (max 3 iterations)
5. **User Intervention** → If stuck after 3 iterations or architectural issues found
6. **Commit** → Once passed, commits layer with quality metrics
7. **Next Layer** → Proceeds to next layer

## Audit Trail

Creates detailed audit trail at `docs/{feature-name}/implementation-audit.md` with:
- Timestamp for every orchestrator action
- Agent commands and outcomes
- Detailed issue descriptions from reviews
- Fix iterations and changes
- Git commits with metrics

## Quality Gate Criteria

**Must satisfy ALL to proceed:**
- Overall review score ≥ threshold (default: 4.5/5.0)
- No critical tactics with score < 4
- No important tactics with score < 4
- No constraint violations (FAIL status)

If any criterion fails, enter fix cycle (up to 3 iterations).

## Instructions for Claude

### Step 1: Parse Arguments and Validate

**Parse command arguments:**

```bash
# Expected format: /orchestrate:hex-arc <feature-name> [--layers <list>] [--threshold <score>]
feature_name = first argument
layers_arg = extract from --layers flag (if present)
threshold_arg = extract from --threshold flag (if present)
```

**Set defaults:**
```
threshold = threshold_arg || 4.5
max_iterations = 3
```

**Validate feature name:**
- Check if `docs/{feature_name}/plan.md` exists
- If not, error: "Implementation plan not found at docs/{feature_name}/plan.md. Run /plan:hex-arc {feature_name} first."

**Extract available layers from plan:**
- Read `docs/{feature_name}/plan.md`
- Find all sections matching `## {LayerName} Layer` (e.g., "## Domain Layer", "## Application Layer")
- Extract layer names (lowercase): ["domain", "application", "infrastructure", ...]

**Determine layers to implement:**
- If `--layers` provided: Parse semicolon-separated list, validate each exists in plan
- If not provided: Use all layers from plan
- Error if any specified layer not found in plan

**Validation complete - confirm with user:**
```
🚀 Starting Orchestrated Implementation

Feature: {feature_name}
Layers: {layer_list}
Quality threshold: {threshold}/5.0
Max fix iterations per layer: 3

Plan: docs/{feature_name}/plan.md
Audit trail: docs/{feature_name}/implementation-audit.md

Proceed? [This will create commits for each layer]
```

### Step 2: Initialize Audit Trail

**Create audit file:** `docs/{feature_name}/implementation-audit.md`

**Initial content:**
```markdown
# Implementation Audit Trail: {feature_name}

Started: {ISO timestamp}
Threshold: {threshold}/5.0
Max iterations: {max_iterations}
Layers: {comma-separated layer list}

---

## Session: {date}

```

**Helper function for timestamps:**
```
function getTimestamp() {
  // Format: "2025-10-23 12:35pm"
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  let hour = now.getHours();
  const minute = String(now.getMinutes()).padStart(2, '0');
  const ampm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;

  return `${year}-${month}-${day} ${hour}:${minute}${ampm}`;
}
```

**Helper function for audit logging:**
```
function appendToAudit(entry) {
  // Append entry to docs/{feature_name}/implementation-audit.md
  // Entry format: "\n**{timestamp}: {source} → {destination}**\n{content}\n"
}
```

### Step 3: Orchestration Loop - Iterate Through Layers

**For each layer in layers_to_implement:**

```
Initialize layer state:
  layer_name = current layer
  iteration_count = 0
  review_result = null
  implementation_complete = false
  quality_gate_passed = false
```

### Step 4: Implementation Phase

**Log start:**
```
appendToAudit({
  timestamp: getTimestamp(),
  from: "Orchestrator",
  to: "Implementation Agent",
  content: `
Command: Implement ${layer_name} layer
Goal: ${extractLayerGoalFromPlan(layer_name)}
`
});
```

**Spawn implementation agent:**

Use the **Task tool** with `subagent_type: "general-purpose"` and prompt:

```
You are implementing the ${layer_name} layer for feature "${feature_name}".

Follow the implementation command instructions from /implement:hex-arc.

Feature: ${feature_name}
Layer: ${layer_name}

Execute the implementation following these instructions:

${read commands/implement-hex-arc.md}

Complete the implementation and report what was implemented.
```

**Capture implementation result:**

From agent output, extract:
- Components implemented (aggregates, handlers, adapters, etc.)
- Test results (count, passing/failing)
- Files created/modified
- Any errors or issues

**Log completion:**
```
appendToAudit({
  timestamp: getTimestamp(),
  from: "Implementation Agent",
  to: "Orchestrator",
  content: `
Status: ${implementation_success ? "✅ Complete" : "❌ Failed"}
- Implemented: ${components_list}
- Tests: ${test_count} test cases, ${passing_count}/${total_count} passing
- Files: ${file_list}
${errors ? `- Errors: ${errors}` : ""}
`
});
```

**If implementation failed:**
```
Log error and abort:
appendToAudit({
  timestamp: getTimestamp(),
  from: "Orchestrator",
  to: "User",
  content: "❌ Implementation failed. Aborting orchestration. See errors above."
});

Exit with error message to user.
```

### Step 5: Review Phase

**Log start:**
```
appendToAudit({
  timestamp: getTimestamp(),
  from: "Orchestrator",
  to: "Review Agent",
  content: `
Command: Review ${layer_name} layer implementation
Threshold: ${threshold}/5.0
`
});
```

**Spawn review agent:**

Use the **Task tool** with `subagent_type: "general-purpose"` and prompt:

```
You are reviewing the ${layer_name} layer implementation for feature "${feature_name}".

Follow the review command instructions from /review:hex-arc.

Feature: ${feature_name}

Execute the review following these instructions:

${read commands/review-hex-arc.md}

Provide a complete review report with scores, tactics, constraints, and detailed reasoning.
```

**Parse review result:**

From agent output, extract:
- Overall score
- Pattern scores
- Tactic evaluations (name, score, priority, reasoning)
- Constraint results (status, reasoning)
- Overall reasoning

**Format review result for audit:**

```
function formatReviewForAudit(review, threshold) {
  const status = passesQualityGate(review, threshold) ? "✅ Quality gate passed" : "⚠️ Quality gate failed";

  let content = `
Status: ${status}
- Score: ${review.overall_score}/5.0 (threshold: ${threshold})
- Patterns evaluated: ${review.patterns.map(p => `${p.name} (${p.score}/5.0)`).join(", ")}
`;

  if (!passesQualityGate(review, threshold)) {
    content += formatIssues(review);
  } else {
    content += "\n\nAll critical and important tactics: ✅ Score ≥ 4\nConstraints: All passed\n";
  }

  return content;
}
```

**Format issues with detailed descriptions:**

```
function formatIssues(review) {
  let output = "\n\nIssues found:\n\n";

  // Group issues by priority
  const criticalIssues = review.tactics.filter(t => t.priority === 'critical' && t.score < 4);
  const importantIssues = review.tactics.filter(t => t.priority === 'important' && t.score < 4);
  const optionalIssues = review.tactics.filter(t => t.priority === 'optional' && t.score < 3);

  let issueNumber = 1;

  // Format critical issues
  for (const issue of criticalIssues) {
    output += formatIssueDetail(issue, issueNumber++, review);
  }

  // Format important issues
  for (const issue of importantIssues) {
    output += formatIssueDetail(issue, issueNumber++, review);
  }

  // Format optional issues (for awareness)
  if (optionalIssues.length > 0) {
    for (const issue of optionalIssues) {
      output += formatIssueDetail(issue, issueNumber++, review);
    }
  }

  // Format constraint failures
  const failedConstraints = review.constraints.filter(c => c.status === "FAIL");
  if (failedConstraints.length > 0) {
    output += "\n\nConstraint violations:\n\n";
    for (let i = 0; i < failedConstraints.length; i++) {
      output += formatConstraintViolation(failedConstraints[i], i + 1);
    }
  }

  return output;
}

function formatIssueDetail(issue, number, review) {
  const priority = issue.priority.toUpperCase();
  const pattern = issue.pattern_name || extractPatternFromContext(issue, review);

  // Extract specifics from reasoning
  const problem = issue.reasoning;

  // Generate what's required (map to rubric)
  const required = generateRequiredDescription(issue);

  // Generate impact description
  const impact = generateImpactDescription(issue, pattern);

  return `
${number}. **[${priority}]** ${issue.tactic_name} ${pattern ? `(${pattern})` : ""} - Score: ${issue.score}/5
   Problem: ${problem}
   Required: ${required}
   Impact: ${impact}

`;
}

function formatConstraintViolation(constraint, number) {
  return `
${number}. **[CONSTRAINT FAILED]** ${constraint.rule}
   Problem: ${constraint.reasoning}
   Required: ${constraint.description}
   Impact: ${generateConstraintImpact(constraint)}

`;
}

function generateRequiredDescription(issue) {
  // Generate description of what's required based on tactic and score
  // For score 3, describe what score 4 requires
  // Use tactic description and calibration guidance
  return `${issue.tactic_description}. To achieve higher score, address the issues mentioned in the problem.`;
}

function generateImpactDescription(issue, pattern) {
  // Map tactic/pattern to impact
  const impacts = {
    "encapsulate-state": "Breaks encapsulation, allows direct state mutation bypassing domain logic and events.",
    "apply-via-events": "State changes not recorded in event store, breaks event sourcing and audit trail.",
    "invariant-methods": "Business rules can be violated, invalid state transitions possible.",
    "aggregate-root": "Breaks aggregate boundary, consistency guarantees compromised.",
    "value-object-validation": "Invalid data can enter domain, corrupts data integrity.",
    // ... add more mappings
  };

  return impacts[issue.tactic_id] || impacts[issue.tactic_name.toLowerCase()] || "Violates architectural pattern, reduces code quality and maintainability.";
}

function generateConstraintImpact(constraint) {
  return "Hard constraint violation - must be fixed before proceeding. Violates fundamental architectural principle.";
}
```

**Log review completion:**
```
appendToAudit({
  timestamp: getTimestamp(),
  from: "Review Agent",
  to: "Orchestrator",
  content: formatReviewForAudit(review_result, threshold)
});
```

### Step 6: Quality Gate Check

**Evaluate quality gate:**

```
function passesQualityGate(review, threshold) {
  // Check 1: Overall score
  if (review.overall_score < threshold) {
    return false;
  }

  // Check 2: No critical tactics with score < 4
  const criticalIssues = review.tactics.filter(t =>
    t.priority === 'critical' && t.score >= 0 && t.score < 4
  );
  if (criticalIssues.length > 0) {
    return false;
  }

  // Check 3: No important tactics with score < 4
  const importantIssues = review.tactics.filter(t =>
    t.priority === 'important' && t.score >= 0 && t.score < 4
  );
  if (importantIssues.length > 0) {
    return false;
  }

  // Check 4: No constraint failures
  const failedConstraints = review.constraints.filter(c => c.status === "FAIL");
  if (failedConstraints.length > 0) {
    return false;
  }

  return true;
}
```

**If quality gate passed:** Skip to Step 8 (Commit Phase)

**If quality gate failed:** Continue to Step 7 (Fix Cycle)

### Step 7: Fix Cycle (up to 3 iterations)

```
iteration_count++

if (iteration_count > max_iterations) {
  // Max iterations reached - user intervention needed
  goto Step 7.5 (User Intervention)
}
```

**Extract issues to fix:**

```
function extractFixableIssues(review) {
  // Get critical and important issues (priority order)
  const criticalIssues = review.tactics.filter(t => t.priority === 'critical' && t.score < 4);
  const importantIssues = review.tactics.filter(t => t.priority === 'important' && t.score < 4);
  const failedConstraints = review.constraints.filter(c => c.status === "FAIL");

  return {
    critical: criticalIssues,
    important: importantIssues,
    constraints: failedConstraints
  };
}
```

**Log fix cycle start:**
```
appendToAudit({
  timestamp: getTimestamp(),
  from: "Orchestrator",
  to: "Fix Agent",
  content: `
Command: Fix issues from review (iteration ${iteration_count}/${max_iterations})
Target issues:
${formatTargetIssues(issues)}
`
});

function formatTargetIssues(issues) {
  let output = "";
  for (const issue of [...issues.critical, ...issues.important]) {
    output += `- [${issue.priority.toUpperCase()}] ${issue.tactic_name}: ${extractShortProblem(issue.reasoning)}\n`;
  }
  for (const constraint of issues.constraints) {
    output += `- [CONSTRAINT] ${constraint.rule}\n`;
  }
  return output;
}
```

**Generate detailed fix prompt:**

```
function generateFixPrompt(feature_name, layer_name, review, issues, threshold) {
  return `
You are fixing code review issues for the ${layer_name} layer of "${feature_name}".

Current Score: ${review.overall_score}/5.0 (threshold: ${threshold})
Iteration: ${iteration_count}/${max_iterations}

Issues to fix (in priority order):

${formatDetailedIssuesForFix(issues, review)}

Instructions:
1. Focus ONLY on fixing these specific issues
2. Do not refactor unrelated code
3. Maintain existing functionality
4. Run tests after fixes to ensure nothing broke
5. Report what was changed

Fix these issues and report completion.
`;
}

function formatDetailedIssuesForFix(issues, review) {
  let output = "";
  let num = 1;

  // Critical issues first
  for (const issue of issues.critical) {
    output += `
${num}. **[CRITICAL]** ${issue.tactic_name} ${issue.pattern_name ? `(${issue.pattern_name})` : ""} - Score: ${issue.score}/5

   Problem Found:
   ${issue.reasoning}

   What's Required:
   ${generateRequiredDescription(issue)}

   Why It Matters:
   ${generateImpactDescription(issue, issue.pattern_name)}

`;
    num++;
  }

  // Important issues
  for (const issue of issues.important) {
    output += `
${num}. **[IMPORTANT]** ${issue.tactic_name} ${issue.pattern_name ? `(${issue.pattern_name})` : ""} - Score: ${issue.score}/5

   Problem Found:
   ${issue.reasoning}

   What's Required:
   ${generateRequiredDescription(issue)}

   Why It Matters:
   ${generateImpactDescription(issue, issue.pattern_name)}

`;
    num++;
  }

  // Constraints
  for (const constraint of issues.constraints) {
    output += `
${num}. **[CONSTRAINT FAILED]** ${constraint.rule}

   Problem Found:
   ${constraint.reasoning}

   What's Required:
   ${constraint.description}

   Why It Matters:
   ${generateConstraintImpact(constraint)}

`;
    num++;
  }

  return output;
}
```

**Spawn fix agent:**

Use the **Task tool** with `subagent_type: "general-purpose"` and prompt:

```
${generateFixPrompt(feature_name, layer_name, review_result, fixable_issues, threshold)}
```

**Capture fix result:**

Extract from agent output:
- Changes applied
- Files modified
- Tests results after fixes

**Log fix completion:**
```
appendToAudit({
  timestamp: getTimestamp(),
  from: "Fix Agent",
  to: "Orchestrator",
  content: `
Status: ${fix_success ? "✅ Complete" : "❌ Failed"}
Changes applied:
${changes_list}
Files modified: ${file_list}
${test_results ? `Tests: ${test_results}` : ""}
`
});
```

**Loop back to Step 5:** Re-review the fixed code

### Step 7.5: User Intervention (if max iterations reached or stuck)

**Trigger user intervention when:**
- `iteration_count > max_iterations`
- Score not improving between iterations
- Agent reports architectural issues that need decision

**Log intervention:**
```
appendToAudit({
  timestamp: getTimestamp(),
  from: "Orchestrator",
  to: "User",
  content: `
⚠️ User Intervention Required

Layer: ${layer_name}
Iteration: ${iteration_count}/${max_iterations}
Current Score: ${review_result.overall_score}/5.0 (threshold: ${threshold})

Reason: ${intervention_reason}

${formatCriticalIssuesForUser(review_result)}

Recommended actions:
- Review the issues above
- Consider adjusting architectural approach in the plan
- Manually fix issues and re-run orchestration
- Or lower quality threshold if acceptable

What would you like to do?
`
});
```

**Ask user for decision:**

Use AskUserQuestion tool:
```
{
  question: "Quality gate not passing after ${iteration_count} fix iterations. How should we proceed?",
  header: "Intervention",
  options: [
    {
      label: "Continue with manual fixes",
      description: "I'll fix the issues manually. Abort orchestration and let me work on it."
    },
    {
      label: "Lower threshold and proceed",
      description: "Accept current quality level and commit this layer (score: ${review_result.overall_score})."
    },
    {
      label: "Skip this layer",
      description: "Skip ${layer_name} layer for now, proceed to next layer."
    },
    {
      label: "Abort orchestration",
      description: "Stop the entire orchestration process."
    }
  ]
}
```

**Handle user decision:**
- **Manual fixes**: Log decision, abort orchestration gracefully
- **Lower threshold**: Adjust threshold, pass quality gate, proceed to commit
- **Skip layer**: Log skip, continue to next layer
- **Abort**: Log abort, exit orchestration

**Log user decision:**
```
appendToAudit({
  timestamp: getTimestamp(),
  from: "User",
  to: "Orchestrator",
  content: `Decision: ${user_decision}`
});
```

### Step 8: Commit Phase (after quality gate passed)

**Generate commit message:**

```
function generateCommitMessage(feature_name, layer_name, review_result, iteration_count) {
  const subject = `feat(${feature_name}): implement ${layer_name} layer`;

  const body = `
Review score: ${review_result.overall_score}/5.0
Fix iterations: ${iteration_count}
Patterns: ${review_result.patterns.map(p => `${p.name} (${p.score})`).join(", ")}
`.trim();

  return `${subject}\n\n${body}`;
}
```

**Stage and commit changes:**

```bash
# Stage all changes for this layer
git add .

# Commit with generated message
git commit -m "${commit_message}"

# Capture commit hash
commit_hash=$(git rev-parse --short HEAD)
```

**Log commit:**
```
appendToAudit({
  timestamp: getTimestamp(),
  from: "Orchestrator",
  to: "Git",
  content: `
Action: Commit ${layer_name} layer
Message: "${commit_message.split('\n')[0]}"
Commit: ${commit_hash}
Details: Review score ${review_result.overall_score}/5.0, ${iteration_count} fix iteration(s), ${review_result.patterns.map(p => `${p.name} (${p.score})`).join(", ")}
`
});
```

**If commit fails:**
```
Log error:
appendToAudit({
  timestamp: getTimestamp(),
  from: "Git",
  to: "Orchestrator",
  content: `❌ Commit failed: ${error_message}`
});

Ask user:
"Git commit failed. There may be conflicts or uncommitted changes. Would you like to:
1. Resolve manually and continue
2. Abort orchestration"
```

### Step 9: Progress Reporting

**After each layer completion:**

```
Show progress to user:

✅ ${layer_name} Layer Complete

Score: ${review_result.overall_score}/5.0
Fix iterations: ${iteration_count}
Commit: ${commit_hash}

${layers_completed}/${total_layers} layers complete

${remaining_layers.length > 0 ? `Next: ${remaining_layers[0]} layer` : "All layers complete!"}
```

### Step 10: Final Summary (after all layers)

**Log session completion:**
```
appendToAudit({
  timestamp: getTimestamp(),
  from: "Orchestrator",
  to: "User",
  content: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Orchestration Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: ${feature_name}
Layers completed: ${layers_completed.length}/${total_layers}
Average score: ${average_score}/5.0
Total fix iterations: ${total_fix_iterations}
Total commits: ${total_commits}

Audit trail: docs/${feature_name}/implementation-audit.md
`
});
```

**Display final summary to user:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Orchestration Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
  • Feature: ${feature_name}
  • Layers completed: ${layers_completed.join(", ")}
  • Average score: ${average_score}/5.0
  • Total commits: ${total_commits}
  • Total fix iterations: ${total_fix_iterations}

📁 Files:
  • Plan: docs/${feature_name}/plan.md
  • Audit: docs/${feature_name}/implementation-audit.md

🎯 Next Steps:
  • Review git commits: git log --oneline -${total_commits}
  • Review audit trail for full details
  • Run full test suite: npm test
  • Deploy or proceed with next feature
```

## Error Handling

**Handle common errors:**

1. **Plan not found:**
```
❌ Error: Implementation plan not found

Expected: docs/${feature_name}/plan.md

Please run /plan:hex-arc ${feature_name} first to create the implementation plan.
```

2. **Invalid layer specified:**
```
❌ Error: Layer "${invalid_layer}" not found in plan

Available layers: ${available_layers.join(", ")}

Please specify valid layer names from the plan.
```

3. **Invalid threshold:**
```
❌ Error: Invalid threshold "${threshold_arg}"

Threshold must be a number between 0.0 and 5.0.

Example: --threshold 4.5
```

4. **Git not clean (uncommitted changes):**
```
⚠️ Warning: Uncommitted changes detected

The working directory has uncommitted changes. The orchestrator will create commits for each layer.

Current changes:
${git_status}

Options:
1. Commit or stash current changes first
2. Continue anyway (changes will be included in first commit)
3. Abort

What would you like to do?
```

5. **Implementation agent fails:**
```
❌ Error: Implementation agent failed

Layer: ${layer_name}
Error: ${error_message}

Orchestration aborted. Fix the errors and try again.
```

6. **Review agent fails:**
```
❌ Error: Review agent failed

Layer: ${layer_name}
Error: ${error_message}

Cannot proceed without review. Orchestration aborted.
```

## Important Notes for Claude

**Agent Spawning:**
- Use **Task tool** with `subagent_type: "general-purpose"` for all agents
- Provide complete context in prompts (feature name, layer, goals)
- Capture full agent output for parsing

**Audit Trail:**
- Log EVERY orchestrator action with timestamp
- Use consistent format: "YYYY-MM-DD HH:MMam/pm: Source → Destination"
- Include detailed issue descriptions in review logs
- Make audit self-documenting and actionable

**Quality Gate:**
- Strictly enforce all 4 criteria
- No exceptions unless user explicitly approves
- Critical/important issues MUST be < 4 to trigger fix cycle

**Fix Cycles:**
- Max 3 iterations per layer
- Each fix prompt includes full context from review
- Track whether score is improving
- Pause for user if stuck

**Git Commits:**
- Clean messages (no Claude footer)
- Include quality metrics in body
- One commit per successful layer
- Handle failures gracefully

**User Communication:**
- Clear progress reporting after each phase
- Detailed error messages with actionable steps
- Ask for intervention only when necessary
- Final summary with all metrics

**Testing:**
- Verify agents complete successfully before proceeding
- Parse agent outputs carefully (JSON, markdown, etc.)
- Handle edge cases (empty layers, no tests, etc.)
- Test with real feature to validate end-to-end flow
