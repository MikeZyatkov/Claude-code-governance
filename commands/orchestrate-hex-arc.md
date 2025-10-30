---
name: orchestrate:hex-arc
description: "Orchestrate feature implementation with quality gates: /orchestrate:hex-arc <feature-name> [--layers <list>] [--threshold <score>]"
---

# Hexagonal Architecture Orchestrated Implementation

Orchestrates the complete implementation lifecycle for a feature - managing implementation and review with automated quality gates, fix cycles, and git commits.

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

**IMPORTANT:**

The audit-logger skill handles timestamp generation internally using an executable script. You do not need to provide timestamps when calling it - each call will automatically get a fresh timestamp.

---

### Step 1: Parse Arguments and Validate

**Parse command arguments:**
```
feature_name = first argument
layers_arg = extract from --layers flag (if present)
threshold_arg = extract from --threshold flag (if present)

threshold = threshold_arg || 4.5
max_iterations = 3
```

**Validate feature name:**
Check if `docs/{feature_name}/plan.md` exists.

If not:
```
❌ Error: Implementation plan not found at docs/{feature_name}/plan.md

Please run /plan:hex-arc {feature_name} first.
```

**Extract available layers from plan:**
- Read `docs/{feature_name}/plan.md`
- Find all sections matching `## {LayerName} Layer`
- Extract layer names (lowercase): ["domain", "application", "infrastructure", ...]

**Determine layers to implement:**
- If `--layers` provided: Parse semicolon-separated list, validate each exists in plan
- If not provided: Use all layers from plan

If specified layer not found, show error with available layers.

**Confirm with user:**
```
🚀 Starting Orchestrated Implementation

Feature: {feature_name} 
Layers: {layer_list} 
Quality threshold: {threshold}/5.0 
Max fix iterations per layer: 3 

Plan: docs/{feature_name}/plan.md
Audit trail: docs/{feature_name}/implementation-audit.md

This will create git commits for each layer.

Proceed? (yes/no)
```

If the user says no, exit gracefully.

### Step 2: Initialize Audit Trail

**Call audit-logger skill:**
```json
{
  "action": "initialize",
  "feature": "{feature_name}",
  "data": {
    "threshold": {threshold},
    "max_iterations": {max_iterations},
    "layers": {layers_to_implement}
  }
}
```

The skill will create `docs/{feature_name}/implementation-audit.md` with initial metadata.

### Step 3: Orchestration Loop - For Each Layer

**Initialize layer state:**
```
layer_name = current layer
iteration_count = 0
quality_gate_passed = false
```

#### 3.1 Implementation Phase

**Log implementation start:**

**Call audit-logger skill:**
```json
{
  "action": "append",
  "feature": "{feature_name}",
  "data": {
    "entry_type": "implementation_start",
    "from": "Orchestrator",
    "to": "Implementation Agent",
    "content": {
      "layer": "{layer_name}",
      "goal": "{extract from plan}"
    }
  }
}
```

**Call implementation-engine skill:**
```json
{
  "feature": "{feature_name}",
  "layer": "{layer_name}",
  "plan_path": "docs/{feature_name}/plan.md"
}
```

**Handle result:**
- If result.success = false: Log error, abort orchestration
- If result.success = true: Continue

**Log implementation completion:**

**Call audit-logger skill:**
```json
{
  "action": "append",
  "feature": "{feature_name}",
  "data": {
    "entry_type": "implementation_complete",
    "from": "Implementation Agent",
    "to": "Orchestrator",
    "content": {
      "success": true,
      "components": result.components,
      "tests": result.tests,
      "files": result.files.created
    }
  }
}
```

**Display progress to user:**
```
[{timestamp}] ✅ Implementation complete
```

#### 3.2 Review Phase

**Log review start:**

**Call audit-logger skill:**
```json
{
  "action": "append",
  "feature": "{feature_name}",
  "data": {
    "entry_type": "review_start",
    "from": "Orchestrator",
    "to": "Review Agent",
    "content": {
      "layer": "{layer_name}",
      "threshold": {threshold}
    }
  }
}
```

**Call review-engine skill:**
```json
{
  "feature": "{feature_name}",
  "layer": "{layer_name}",
  "code_source": "git_diff",
  "plan_path": "docs/{feature_name}/plan.md"
}
```

**Call quality-gate skill:**
```json
{
  "review": {review_result},
  "threshold": {threshold}
}
```

**Log review result:**

**Call audit-logger skill:**
```json
{
  "action": "append",
  "feature": "{feature_name}",
  "data": {
    "entry_type": "review_complete",
    "from": "Review Agent",
    "to": "Orchestrator",
    "content": {
      "passed": gate_result.passed,
      "score": review_result.overall_score,
      "threshold": {threshold},
      "patterns": review_result.patterns,
      "issues": gate_result.issues
    }
  }
}
```

**Display progress to user:**
```
[{timestamp}] {gate_result.passed ? "✅" : "⚠️"} Review: {review_result.overall_score}/5.0
```

#### 3.3 Quality Gate Decision

**If gate_result.passed = true:**
- Skip to Step 3.4 (Commit Phase)

**If gate_result.passed = false:**
- Continue to Fix Cycle

#### 3.4 Fix Cycle (if quality gate failed)

**Call fix-coordinator skill:**
```json
{
  "feature": "{feature_name}",
  "layer": "{layer_name}",
  "gate_result": {gate_result},
  "threshold": {threshold},
  "max_iterations": {max_iterations},
  "current_iteration": 0,
  "previous_score": null
}
```

The fix-coordinator skill will:
- Manage up to 3 fix iterations
- Generate detailed fix prompts
- Spawn fix agents
- Re-review after each fix
- Track score improvement
- Return final result

**Handle fix-coordinator result:**

If result.fixed = true:
- quality_gate_passed = true
- final_review = result.final_review
- Continue to Commit Phase

If result.intervention_needed = true:
- Log intervention request
- Ask user for decision (continue manually, lower threshold, skip layer, abort)
- Handle user decision

#### 3.5 Commit Phase (after quality gate passed)

**Log commit start:**

**Call audit-logger skill:**
```json
{
  "action": "append",
  "feature": "{feature_name}",
  "data": {
    "entry_type": "commit",
    "from": "Orchestrator",
    "to": "Git",
    "content": {
      "layer": "{layer_name}",
      "action": "committing"
    }
  }
}
```

**Call git-ops skill:**
```json
{
  "action": "commit",
  "feature": "{feature_name}",
  "layer": "{layer_name}",
  "review_score": {final_review.overall_score},
  "fix_iterations": {iteration_count},
  "pattern_scores": {extract from final_review}
}
```

**Handle git result:**

If commit_result.success = true:
- Log commit to audit with commit hash
- Display progress: `[{timestamp}] 💾 Committed: {commit_result.commit_hash}`

If commit_result.success = false:
- Log error
- Ask user for intervention

**Display layer completion:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ {layer_name} Layer Complete

Score: {final_review.overall_score}/5.0
Fix iterations: {iteration_count}
Commit: {commit_result.commit_hash}

{layers_completed}/{total_layers} layers complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 3.5 Update Plan with Completion

**Mark layer as completed in plan:**

1. Read `docs/{feature_name}/plan.md`
2. Find the `## {Layer} Layer` section
3. Add completion marker at the start of the section:
   ```markdown
   ## Domain Layer ✅
   ```
4. Write updated plan back to file

**Note:** This provides visual progress tracking when reviewing the plan document.

### Step 4: Final Summary

**After all layers complete:**

**Log orchestration completion:**

**Call audit-logger skill:**
```json
{
  "action": "append",
  "feature": "{feature_name}",
  "data": {
    "entry_type": "completion",
    "from": "Orchestrator",
    "to": "User",
    "content": {
      "layers_completed": {layers_completed.length},
      "total_layers": {total_layers},
      "average_score": {average_score},
      "total_fix_iterations": {sum of all iteration counts},
      "total_commits": {total_commits}
    }
  }
}
```

**Display final summary to user:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Orchestration Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
  • Feature: {feature_name}
  • Layers completed: {layers_completed.join(", ")}
  • Average score: {average_score}/5.0
  • Total commits: {total_commits}
  • Total fix iterations: {total_fix_iterations}

📁 Files:
  • Plan: docs/{feature_name}/plan.md
  • Audit: docs/{feature_name}/implementation-audit.md

🎯 Next Steps:
  • Review git commits: git log --oneline -{total_commits}
  • Review audit trail for full details
  • Run full test suite: npm test
  • Deploy or proceed with next feature
```

## Error Handling

**Plan not found:**
```
❌ Error: Implementation plan not found
Expected: docs/{feature_name}/plan.md

Please run /plan:hex-arc {feature_name} first to create the plan.
```

**Invalid layer specified:**
```
❌ Error: Layer "{invalid_layer}" not found in plan

Available layers: {available_layers.join(", ")}

Please specify valid layer names from the plan.
```

**Implementation agent fails:**
```
❌ Error: Implementation agent failed

Layer: {layer_name}
Error: {error_message}

Orchestration aborted. Fix the errors and try again.
```

**Review agent fails:**
```
❌ Error: Review agent failed

Layer: {layer_name}
Error: {error_message}

Cannot proceed without review. Orchestration aborted.
```

**Git commit fails:**
```
❌ Error: Git commit failed

Layer: {layer_name}
Error: {commit_result.error}

Resolve conflicts and try again.
```

## User Intervention Flow

**When fix-coordinator requests intervention:**

**Log intervention request:**

**Call audit-logger skill:**
```json
{
  "action": "append",
  "feature": "{feature_name}",
  "data": {
    "entry_type": "intervention",
    "from": "Orchestrator",
    "to": "User",
    "content": {
      "layer": "{layer_name}",
      "iteration": "{iteration}/{max_iterations}",
      "score": "{current_score}",
      "reason": "{intervention_reason}",
      "issues": {categorized_issues}
    }
  }
}
```

**Ask user:**
```
⚠️ User Intervention Required

Layer: {layer_name}
Iteration: {iteration}/{max_iterations}
Current Score: {score}/5.0 (threshold: {threshold})

Reason: {intervention_reason}

Critical Issues:
{List critical issues with details}

What would you like to do?
1. Continue with manual fixes (abort orchestration)
2. Lower threshold and proceed (accept current quality)
3. Skip this layer (proceed to next)
4. Abort entire orchestration
```

**Handle user choice:**
- Option 1: Log decision, abort gracefully
- Option 2: Update threshold, pass quality gate, proceed to commit
- Option 3: Log skip, continue to next layer
- Option 4: Log abort, exit orchestration

## Notes for Claude

**Skills Composition:**
This command orchestrates 7 skills:
- **audit-logger**: Log every action with timestamps
- **implementation-engine**: Build each layer
- **review-engine**: Evaluate code quality
- **quality-gate**: Make pass/fail decisions
- **fix-coordinator**: Manage fix iterations
- **git-ops**: Create clean commits
- All skills return structured data

**Timestamps:**
- Handled automatically by audit-logger skill via executable script
- You do not need to provide timestamps when calling audit-logger
- Each audit-logger call gets a fresh timestamp automatically

**Progress Reporting:**
- Show real-time progress after each phase
- Use emojis for visual clarity
- Keep user informed throughout

**Error Recovery:**
- Graceful abort on critical errors
- Clear error messages with actions
- User intervention for complex issues

**Commit Strategy:**
- One commit per layer after quality gate passes
- Clean messages with quality metrics
- No Claude footer

**This command is now a workflow coordinator:**
- Calls skills in sequence
- Handles results
- Makes flow decisions
- Logs everything
- Reports progress
- Total logic: ~250 lines (down from 962 lines)
