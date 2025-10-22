---
name: review:hex-arc
description: "Review hexagonal architecture code: /review:hex-arc <feature-name>"
---

# Hexagonal Architecture Code Review

Reviews implemented code against governance patterns using calibrated scoring rubrics (LLM-as-judge approach).

## Usage

```
/review:hex-arc <feature-name>
```

**Auto-detects** which layers have uncommitted changes and reviews them.

**Example**: `/review:hex-arc tenant-onboarding`

## What It Does

1. **Detects changes**: Analyzes uncommitted changes (git diff HEAD) to identify which layers were modified
2. **Loads patterns**: Reads applicable patterns from the implementation plan
3. **Loads calibration**: Gets scoring rubrics for each pattern
4. **Evaluates code**: Uses LLM-as-judge with calibrated rubrics (same as evaluation framework)
5. **Provides feedback**: Detailed report with scores and improvement suggestions

## Instructions for Claude

### Step 1: Load Implementation Plan

**Read the plan:**
- Load `docs/{feature_name}/plan.md`
- Extract "Pattern Compliance" section to understand which patterns apply to which layers

If plan not found:
```
❌ Error: Implementation plan not found
Expected: docs/{feature_name}/plan.md

Please run /plan:hex-arc {feature_name} first to create the plan.
```

### Step 2: Detect Changed Layers

**Get git diff to identify uncommitted changes:**

```bash
# All uncommitted changes (staged + unstaged)
git diff HEAD
```

If empty, no changes to review.

**Map changed files to layers:**

Analyze file paths to determine which layers were modified:
- Files matching `**/domain/**` → Domain layer
- Files matching `**/application/**` → Application layer
- Files matching `**/infrastructure/**` → Infrastructure layer
- Files matching custom patterns → Check plan for layer organization

**Identify layers to review:**
- If uncommitted changes found in 1 layer → Review that layer
- If uncommitted changes found in multiple layers → Review all changed layers
- If no uncommitted changes found → Show error message

Example output:
```
📊 Detected changes in git diff:

Changed files:
  • src/domain/Tenant.aggregate.ts (45 lines)
  • src/domain/TenantCreated.event.ts (12 lines)
  • src/domain/EmailAddress.vo.ts (23 lines)
  • test/domain/Tenant.test.ts (67 lines)

Layers identified: Domain

Proceeding to review Domain layer...
```

If no uncommitted changes detected:
```
⚠️ No uncommitted changes found to review

Checked: git diff HEAD (staged + unstaged changes)

Result: No changes detected

Next steps:
  1. Make your code changes (or stage/unstage existing changes)
  2. Run /review:hex-arc {feature_name} again

Note: This command only reviews uncommitted changes in your working directory.
To review committed code on your branch, compare the git diff manually or use the evaluation framework.
```

### Step 3: Extract Code for Each Layer

For each layer to review:

1. **Get all changed files for that layer** from git diff
2. **Read the full content** of each changed file
3. **Combine into code block** for evaluation:

```typescript
// File: src/domain/Tenant.aggregate.ts
{file_content}

// File: src/domain/TenantCreated.event.ts
{file_content}

// ... other files
```

**Include test files** if present (helps evaluate test coverage).

### Step 4: Load Patterns and Calibrations for Layer

**From the plan's "Pattern Compliance" section:**

Identify which patterns apply to the layer being reviewed.

**Pattern mapping (typical):**
- **Domain layer**: DDD Aggregates, Value Objects, Domain Events, Event Sourcing, Repository (interfaces)
- **Application layer**: CQRS, Domain Services, Projectors, Ports and Adapters
- **Infrastructure layer**: Infrastructure API, Repository (implementations), Adapters

**For each applicable pattern:**

1. **Load pattern YAML** from plugin's `patterns/` directory:
   - Example: `patterns/domain/ddd-aggregates/v1.yaml`
   - Extract: pattern_name, version, domain, goal, guiding_policy, tactics, constraints

2. **Load calibration YAML** from plugin's `calibration/` directory:
   - Example: `calibration/ddd-aggregates/v1-scoring.yaml`
   - Extract: tactic_scoring (maps tactic_id to scoring_rubric)

### Step 5: Evaluate Code Using LLM-as-Judge

**IMPORTANT**: Use the **exact same prompt structure** as the evaluation framework.

For each pattern, construct the evaluation prompt:

```
# Code Evaluation Task

You are an expert code reviewer evaluating code against established architecture patterns.

## Pattern to Evaluate Against

**Pattern Name**: {pattern.pattern_name} ({pattern.version})
**Domain**: {pattern.domain}

### Goal
{pattern.goal}

### Guiding Policy
{pattern.guiding_policy}

## Implementation Plan (What Was Supposed to Be Implemented)

{relevant_section_from_plan_for_this_layer}

**IMPORTANT**: Use this implementation plan to understand what was supposed to be implemented. When evaluating the code:
- Check if all planned features are actually implemented
- Verify that planned event registrations are present
- Confirm that planned methods and fields exist
- Look for any regressions or missing implementations

If the implementation plan specifies certain events should be registered, methods should exist, or specific functionality should be present, and you don't see them in the code, this is a critical issue that should result in low scores for relevant tactics.

## Code to Evaluate

```typescript
{combined_code_from_all_changed_files}
```

## Evaluation Instructions

### Part 1: Evaluate Tactics

Score each tactic on a scale of 0-5 using the provided rubric:

#### Tactic 1: {tactic.name}
**Priority**: {tactic.priority}
**Description**: {tactic.description}

**Scoring Rubric**:
- **5**: {rubric[5]}
- **4**: {rubric[4]}
- **3**: {rubric[3]}
- **2**: {rubric[2]}
- **1**: {rubric[1]}
- **0**: {rubric[0]}

{... repeat for all tactics}

For each tactic, provide:
1. Score (0-5, or -1 if not applicable)
2. Brief reasoning (2-3 sentences)

**IMPORTANT**: If a tactic is not applicable to the code being evaluated (e.g., entity-related tactics when there are no child entities), use a score of **-1** and explain why it's not applicable in the reasoning. Non-applicable tactics will be excluded from scoring calculations.

Examples of non-applicable tactics:
- "Define entities within aggregate using Entity base class" when the aggregate has no child entities
- "Keep entity collections private" when there are no entity collections
- "Route child entity events" when there are no child entities

### Part 2: Evaluate Constraints

Check each constraint and determine: PASS, FAIL, or EXCEPTION_ALLOWED

#### Constraint 1: {constraint.rule}
**Description**: {constraint.description}
**Evaluation Type**: {constraint.evaluation}
**Allowed Exceptions**:
  - {exception1}
  - {exception2}

{... repeat for all constraints}

For each constraint, provide:
1. Status (PASS/FAIL/EXCEPTION_ALLOWED)
2. Brief reasoning
3. If EXCEPTION_ALLOWED, specify which exception applies

## Output Format

**CRITICAL**: You MUST respond with ONLY a JSON code block. Do not include explanatory text, summaries, or markdown formatting outside the JSON block.

Your response should be exactly this format (nothing else):

```json
{
  "tactic_scores": [
    {
      "tactic_name": "...",
      "score": 4,
      "reasoning": "..."
    }
  ],
  "constraint_checks": [
    {
      "constraint_rule": "...",
      "status": "PASS",
      "reasoning": "...",
      "exception_used": "..." // only if EXCEPTION_ALLOWED
    }
  ],
  "overall_reasoning": "Summary of the evaluation (2-3 sentences)"
}
```

**IMPORTANT**:
- Start your response with ```json
- Include ALL tactics and constraints in the JSON
- End with ```
- Do NOT add any text before or after the JSON block

Be objective and precise. Focus on observable patterns in the code, not potential improvements.
```

**Send this prompt** to evaluate the code and get back JSON response with scores.

**Parse the JSON response** to extract:
- `tactic_scores`: array of {tactic_name, score, reasoning}
- `constraint_checks`: array of {constraint_rule, status, reasoning, exception_used?}
- `overall_reasoning`: summary

### Step 6: Calculate Scores

**Per-Pattern Scoring:**

For each pattern:

1. **Filter out non-applicable tactics** (score = -1)

2. **Calculate weighted tactics score**:
   ```
   applicable_tactics = tactics.filter(t => t.score >= 0)

   weighted_sum = Σ(tactic.score × weight) for applicable tactics
   total_weight = Σ(weight) for applicable tactics

   tactics_score = weighted_sum / total_weight

   where weight = {
     critical: 3.0,
     important: 2.0,
     optional: 1.0
   }
   ```

3. **Check constraints**:
   ```
   constraints_passed = (FAIL count == 0)
   ```

4. **Calculate overall pattern score**:
   ```
   pattern_score = (tactics_score / 5.0) × 0.7 + (constraints_passed ? 1 : 0) × 0.3

   Result: 0.0 to 1.0
   ```

**Overall Layer Score:**

```
layer_score = average(all pattern_scores) × 5.0

Result: 0.0 to 5.0
```

### Step 7: Generate Review Report

Provide a comprehensive review report:

```markdown
# Code Review Report: {Feature Name} - {Layer(s)} Layer

**Reviewed**: {number} files, {number} lines changed
**Date**: {current_date}
**Patterns Evaluated**: {number}
**Git Diff**: {commit_range or "uncommitted changes"}

---

## Overall Score: {layer_score}/5.0 ({percentage}%) - {Grade}

**Grade Scale**:
- 4.5-5.0: Excellent ✅
- 4.0-4.4: Good ✅
- 3.0-3.9: Acceptable ⚠️
- 2.0-2.9: Needs Improvement ⚠️
- 0.0-1.9: Poor ❌

---

## Files Reviewed

{list_of_changed_files_with_line_counts}

---

## Pattern Compliance Summary

### {Pattern Name} v{version} - {pattern_score}/5.0 ({percentage}%)

**Tactics Score**: {tactics_score}/5.0 (weighted average)
- Critical tactics (weight 3.0): {avg}/5.0
- Important tactics (weight 2.0): {avg}/5.0
- Optional tactics (weight 1.0): {avg}/5.0
- Non-applicable tactics: {count} (excluded from scoring)

**Constraints**: {pass_count} passed, {fail_count} failed, {exception_count} exceptions

---

### Tactic Evaluation

{For each tactic with score >= 0:}

#### {✅/⚠️/❌} {Tactic Name} - {score}/5 (Priority: {priority})

**Score**: {score}/5 - "{rubric_text_for_score}"
**Weight**: {weight}

**Reasoning**:
{reasoning_from_llm}

{If score < 4:}
**Improvement Suggestions**:
- {suggestion_based_on_rubric}

---

{For non-applicable tactics:}

#### ⊝ {Tactic Name} - Not Applicable (Priority: {priority})

**Reasoning**:
{reasoning_from_llm_explaining_why_not_applicable}

---

### Constraint Validation

{For each constraint:}

#### {✅/❌/⚠️} {status}: {Constraint Rule}

**Status**: {status}
**Evaluation**: {evaluation_type}

**Reasoning**:
{reasoning_from_llm}

{If EXCEPTION_ALLOWED:}
**Exception Applied**: {exception_used}

{If FAIL:}
**Required Action**: {what_needs_to_be_fixed}

---

## Summary

{overall_reasoning_from_llm}

---

## Critical Issues {if any}

{count} critical issues found (MUST FIX before proceeding):

1. **{Tactic/Constraint Name}** ({Pattern Name})
   - Score: {score}/5 (Critical priority)
   - Issue: {brief_description}
   - Impact: {why_this_matters}

---

## Recommendations

**Priority 1 - Critical** (Block next layer):
- {issues_with_critical_priority_and_score_<_3}
- {constraint_failures}

**Priority 2 - Important** (Should fix):
- {issues_with_important_priority_and_score_<_3}

**Priority 3 - Optional** (Nice to have):
- {suggestions_for_improvement}

---

## Next Steps

{If score >= 4.0:}
✅ **Quality gate passed** - Ready to proceed to next layer

{If score < 4.0:}
⚠️ **Quality gate not met** - Address issues before proceeding

### To improve score:
1. {specific_action_from_failed_constraint_or_low_score_critical_tactic}
2. {another_specific_action}

### Re-review:
After making changes, run review again:
```bash
/review:hex-arc {feature_name}
```

Once quality gate is met (score ≥ 4.0):
```bash
git add .
git commit -m "Implement {layer} layer for {feature_name}"
```

Target: Score ≥ 4.0 before committing.

---

## Pattern References

For detailed guidance, see pattern files:
{list_of_pattern_files_with_paths}

---

**Evaluation Method**: LLM-as-Judge with calibrated scoring rubrics
**Prompt**: Same as evaluation framework (`evaluation/src/llm-judge/prompt-builder.ts`)
```

### Step 8: Handle Multiple Layers

If multiple layers were detected:

1. Run evaluation separately for each layer
2. Generate separate report section for each layer
3. Calculate overall feature score:
   ```
   feature_score = average(all_layer_scores)
   ```

Report structure:
```markdown
# Code Review Report: {Feature Name}

**Layers Reviewed**: {list_of_layers}
**Overall Feature Score**: {feature_score}/5.0

---

## Domain Layer - {score}/5.0
{domain_layer_evaluation}

---

## Application Layer - {score}/5.0
{application_layer_evaluation}

---

## Overall Summary
{combined_summary}
```

## Important Notes for Claude

**Prompt Consistency**:
- ✅ Use the **exact same prompt structure** as `evaluation/src/llm-judge/prompt-builder.ts`
- ✅ This ensures consistency between manual review and automated evaluation
- ✅ Improvements to the prompt benefit both workflows

**Auto-Detection**:
- ✅ Only reviews uncommitted changes (git diff HEAD)
- ✅ Map file paths to layers intelligently
- ✅ If ambiguous, ask user for clarification

**Scoring Objectivity**:
- Use rubrics strictly - don't invent your own criteria
- Score -1 for non-applicable tactics (don't force a score)
- Be objective and evidence-based

**JSON Parsing**:
- Expect JSON response from LLM evaluation
- Parse carefully and handle errors
- If JSON is malformed, show error and ask to retry

**Implementation Plan Context**:
- Include relevant layer section from plan in evaluation prompt
- This helps LLM understand what *should* have been implemented
- Missing planned features = low scores on relevant tactics

**Quality Gates**:
- Score < 3 on critical tactic = block next layer
- Constraint FAIL = block next layer
- Score >= 4.0 overall = ready to proceed

**Tone**:
- Professional and constructive
- Celebrate what's done well
- Frame issues as opportunities for improvement
