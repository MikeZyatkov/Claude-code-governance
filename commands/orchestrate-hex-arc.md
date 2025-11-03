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

**🚨 CRITICAL - Sub-Agent Architecture:**

**DO NOT use the Skill tool for implementation, review, or fix operations.**

Instead, use the **Task tool** to spawn isolated sub-agents:

✅ **Use Task tool for** (spawn sub-agents):
- Implementation (implementation-engine)
- Review + Quality Gate (review-engine + quality-gate)
- Fix Cycle (fix-coordinator)

⚡ **Use Skill tool for** (inline execution):
- Audit logging (audit-logger) - fast append operations
- Git commits (git-ops) - fast git operations

**Why?** Heavy operations executed inline will fill the orchestrator context window rapidly (you'll run out of context before completing all layers). Sub-agents execute in isolation and return only structured summaries, keeping the orchestrator context clean.

**How to spawn a sub-agent:**
```
Use the Task tool with:
- subagent_type: "general-purpose"
- description: Brief description
- prompt: Full instructions including skill file path to read
```

---

**IMPORTANT - Audit Logging:**

The audit-logger skill generates timestamps automatically by running `date '+%Y-%m-%d %H:%M:%S'` internally at the start of each action. You do NOT need to run `date` commands or pass timestamps to the skill - simply invoke it with the appropriate context (feature name, entry type, and relevant data).

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

**Invoke audit-logger skill to initialize:**

Invoke the audit-logger skill using the FULLY-QUALIFIED name:
  Skill(claude-code-governance:audit-logger)

This will create the audit trail for `{feature_name}`.

Context to provide:
- Feature: {feature_name}
- Threshold: {threshold}
- Max iterations: {max_iterations}
- Layers: {layers_to_implement}

The skill will generate a timestamp and create `docs/{feature_name}/implementation-audit.md` with initial metadata.

### Step 3: Orchestration Loop - For Each Layer

**Initialize layer state:**
```
layer_name = current layer
iteration_count = 0
quality_gate_passed = false
```

#### 3.1 Implementation Phase

**Log implementation start:**

**Invoke audit-logger skill:**

Invoke using FULLY-QUALIFIED name: Skill(claude-code-governance:audit-logger)

Log implementation start for the {layer_name} layer.

Context:
- Feature: {feature_name}
- Entry type: implementation_start
- Layer: {layer_name}
- Goal: {extract goal from plan}

The skill will generate a timestamp internally.

**Spawn implementation agent:**

⚠️ **DO NOT use the Skill tool here** - it will fill the orchestrator context.

**Use the Task tool** to spawn an isolated agent that will execute implementation.

**Task tool parameters:**
- `subagent_type`: "general-purpose"
- `description`: "Implement {layer_name} layer"
- `prompt`:

```
You are implementing the {layer_name} layer for the {feature_name} feature.

Read the implementation-engine skill instructions from:
skills/implementation-engine/SKILL.md

Then invoke the skill using the Skill tool with the FULLY-QUALIFIED name:
  Skill(claude-code-governance:implementation-engine)

Provide this context to the skill:
- Feature: {feature_name}
- Layer: {layer_name}
- Plan: docs/{feature_name}/plan.md

The skill will build all components specified in the plan, following governance patterns and writing tests.

When complete, return a structured summary:
{
  "success": true/false,
  "components": ["list of components built"],
  "tests": ["list of test files created"],
  "files": ["paths to all files created"],
  "error": "error message if failed"
}
```

**Monitor agent:**
- Wait for agent completion
- If agent returns `success: false`: Log error, abort orchestration
- If agent returns `success: true`: Extract results for audit logging

**Log implementation completion:**

**Invoke audit-logger skill:**

Invoke using Skill(claude-code-governance:audit-logger) to log implementation completion for the {layer_name} layer.

Context:
- Feature: {feature_name}
- Entry type: implementation_complete
- Success: true
- Components: {list components from implementation-engine output}
- Tests: {test results from implementation}
- Files: {files created during implementation}

The skill will generate a timestamp and append the completion entry to the audit trail.

**Display progress to user:**
```
[{timestamp}] ✅ Implementation complete
```

#### 3.2 Review Phase

**Log review start:**

**Invoke audit-logger skill:**

Invoke using Skill(claude-code-governance:audit-logger) to log review start for the {layer_name} layer.

Context:
- Feature: {feature_name}
- Entry type: review_start
- Layer: {layer_name}
- Threshold: {threshold}

The skill will generate a timestamp internally.

**Spawn review agent:**

⚠️ **DO NOT use the Skill tool here** - it will fill the orchestrator context.

**Use the Task tool** to spawn an isolated agent that will execute review and quality gate.

**Task tool parameters:**
- `subagent_type`: "general-purpose"
- `description`: "Review {layer_name} layer"
- `prompt`:

```
You are reviewing the {layer_name} layer for the {feature_name} feature.

Step 1: Read the review-engine skill instructions from:
skills/review-engine/SKILL.md

Then invoke the skill using the Skill tool with the FULLY-QUALIFIED name:
  Skill(claude-code-governance:review-engine)

Provide this context to the skill:
- Feature: {feature_name}
- Layer: {layer_name}
- Implementation files: contexts/{feature_name}/{layer_name}/
- Plan: docs/{feature_name}/plan.md

This will evaluate code against governance patterns, score each tactic, and identify issues.

Step 2: Read the quality-gate skill instructions from:
skills/quality-gate/SKILL.md

Then invoke the skill using the Skill tool with the FULLY-QUALIFIED name:
  Skill(claude-code-governance:quality-gate)

Provide this context to the skill:
- Review results: {from review-engine output above}
- Threshold: {threshold}

The quality gate makes a pass/fail decision and categorizes issues by priority.

When complete, return a structured summary:
{
  "review": {
    "overall_score": number,
    "patterns": [{"name": "...", "score": number, "tactics": [...]}]
  },
  "gate": {
    "passed": true/false,
    "reasons": ["list of failure reasons if failed"],
    "issues": {
      "critical": [...],
      "important": [...],
      "optional": [...],
      "constraint_failures": [...]
    }
  }
}
```

**Monitor agent:**
- Wait for agent completion
- Extract review results and quality gate decision

**Log review result:**

**Invoke audit-logger skill:**

Invoke using Skill(claude-code-governance:audit-logger) to log review completion for the {layer_name} layer.

Context:
- Feature: {feature_name}
- Entry type: review_complete
- Passed: {gate_result.passed}
- Score: {review_result.overall_score}
- Threshold: {threshold}
- Patterns: {review_result.patterns with scores}
- Issues: {gate_result.issues if any}

The skill will generate a timestamp and append the review results to the audit trail.

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

**Spawn fix coordinator agent:**

⚠️ **DO NOT use the Skill tool here** - it will fill the orchestrator context.

**Use the Task tool** to spawn an isolated agent that will manage the fix cycle.

**Task tool parameters:**
- `subagent_type`: "general-purpose"
- `description`: "Fix {layer_name} layer issues"
- `prompt`:

```
You are coordinating fixes for the {layer_name} layer of the {feature_name} feature.

Read the fix-coordinator skill instructions from:
skills/fix-coordinator/SKILL.md

Then invoke the skill using the Skill tool with the FULLY-QUALIFIED name:
  Skill(claude-code-governance:fix-coordinator)

Provide this context to the skill:
- Feature: {feature_name}
- Layer: {layer_name}
- Issues to fix: {gate_result.issues categorized by priority}
- Threshold: {threshold}
- Max iterations: {max_iterations}
- Current iteration: 1 (first attempt)
- Previous score: {review_result.overall_score}

The skill will:
- Manage up to 3 fix iterations
- Generate detailed fix prompts
- Apply fixes to code
- Re-run review-engine and quality-gate after each fix
- Track score improvement
- Return final result

When complete, return a structured summary:
{
  "fixed": true/false,
  "intervention_needed": true/false,
  "intervention_reason": "why intervention needed if applicable",
  "final_review": {
    "overall_score": number,
    "patterns": [...]
  },
  "iterations_used": number,
  "final_gate": {
    "passed": true/false,
    "issues": {...}
  }
}
```

**Monitor agent:**
- Wait for agent completion
- Extract fix results

**Handle fix-coordinator result:**

If `result.fixed = true`:
- quality_gate_passed = true
- final_review = result.final_review
- Continue to Commit Phase

If `result.intervention_needed = true`:
- Log intervention request
- Ask user for decision (continue manually, lower threshold, skip layer, abort)
- Handle user decision

#### 3.5 Commit Phase (after quality gate passed)

**Log commit start:**

**Invoke audit-logger skill:**

Invoke using Skill(claude-code-governance:audit-logger) to log commit action for the {layer_name} layer.

Context:
- Feature: {feature_name}
- Entry type: commit
- Layer: {layer_name}
- Action: Committing implementation

The skill will generate a timestamp internally.

**Invoke git-ops skill:**

Invoke using FULLY-QUALIFIED name: Skill(claude-code-governance:git-ops)

Create a commit for the {layer_name} layer.

Context:
- Feature: {feature_name}
- Layer: {layer_name}
- Review score: {final_review.overall_score}
- Fix iterations: {iteration_count}
- Pattern scores: {extract from final_review.patterns}
- Implementation details: {from implementation-engine output}

The skill will stage files, generate a commit message with quality metrics, and create the commit.

**Monitor commit result:**

After git-ops completes:
- If successful: Note commit hash for audit logging
- If failed: Log error and ask user for intervention
- Display progress: `[{timestamp}] 💾 Committed: {commit_hash}`

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

**Invoke audit-logger skill:**

Invoke using Skill(claude-code-governance:audit-logger) to log orchestration completion.

Context:
- Feature: {feature_name}
- Entry type: completion
- Layers completed: {layers_completed.length}
- Total layers: {total_layers}
- Average score: {average_score}
- Total fix iterations: {sum of all iteration counts}
- Total commits: {total_commits}

The skill will generate a timestamp internally.

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

**Invoke audit-logger skill:**

Invoke using Skill(claude-code-governance:audit-logger) to log user intervention request.

Context:
- Feature: {feature_name}
- Entry type: intervention
- Layer: {layer_name}
- Iteration: {iteration}/{max_iterations}
- Score: {current_score}
- Reason: {intervention_reason}
- Issues: {categorized_issues}

The skill will generate a timestamp internally.

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

**Sub-Agent Architecture:**
This command uses the Task tool to spawn isolated sub-agents for heavy operations:

**Phases executed in sub-agents:**
- ✅ **Implementation** - Spawns agent to execute implementation-engine skill
- ✅ **Review + Quality Gate** - Spawns agent to execute review-engine and quality-gate skills
- ✅ **Fix Cycle** - Spawns agent to execute fix-coordinator skill (manages iterations internally)

**Phases executed inline (orchestrator context):**
- ⚡ **Audit logging** - Fast, inline skill invocation (audit-logger)
- ⚡ **Git commits** - Fast, inline skill invocation (git-ops)
- ⚡ **User prompts** - Direct communication with user
- ⚡ **Flow control** - Quality gate decisions, layer iteration

**Why sub-agents?**
- **Context preservation**: Heavy operations (implementation, review, fixes) don't pollute orchestrator context
- **Focused execution**: Each sub-agent loads only what it needs
- **Isolation**: Implementation details stay in sub-agent, orchestrator only sees results
- **Scalability**: Orchestrator stays clean even for large multi-layer features

**Sub-agent prompts:**
- Load skill instructions from `skills/{skill-name}/SKILL.md`
- Execute with provided context
- Return structured results (JSON format)
- Orchestrator uses results for audit logging and flow decisions

**Timestamps:**
- The audit-logger skill generates timestamps internally
- Each skill invocation automatically runs `date '+%Y-%m-%d %H:%M:%S'`
- You do NOT need to run date commands or manage timestamps
- Timestamps follow "YYYY-MM-DD HH:MM:SS" format (24-hour)

**Progress Reporting:**
- Show real-time progress after each phase
- Use emojis for visual clarity
- Keep user informed throughout
- Display sub-agent status (spawning → executing → completed)

**Error Recovery:**
- Sub-agents return structured errors
- Orchestrator logs errors and aborts gracefully
- Clear error messages with actions
- User intervention for complex issues

**Commit Strategy:**
- One commit per layer after quality gate passes
- Clean messages with quality metrics
- No Claude footer

**This command is now a pure orchestrator:**
- Spawns sub-agents for heavy work (Task tool)
- Inline operations for fast tasks (audit, git, prompts)
- Makes flow control decisions
- Logs everything to audit trail
- Reports progress to user
- Orchestrator context stays clean
