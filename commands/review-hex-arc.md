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
3. **Evaluates code**: Uses LLM-as-judge with calibrated rubrics via review-engine skill
4. **Checks quality**: Uses quality-gate skill to determine pass/fail
5. **Provides feedback**: Detailed report with scores and improvement suggestions

## Instructions for Claude

### Step 1: Parse Input

**Parse command argument:**
```
feature_name = first argument
```

If missing:
```
❌ Error: Missing required argument

Usage: /review:hex-arc <feature-name>
Example: /review:hex-arc tenant-onboarding
```

### Step 2: Load Implementation Plan

**Check plan exists:**
```bash
test -f docs/{feature_name}/plan.md
```

If not found:
```
❌ Error: Implementation plan not found
Expected: docs/{feature_name}/plan.md

Please run /plan:hex-arc {feature_name} first to create the plan.
```

**Read plan** to understand which patterns apply to which layers.

### Step 3: Detect Changed Layers

**Get git diff to identify uncommitted changes:**
```bash
git diff HEAD
```

If empty:
```
⚠️ No uncommitted changes found to review

Checked: git diff HEAD (staged + unstaged changes)

Next steps:
  1. Make your code changes
  2. Run /review:hex-arc {feature_name} again

Note: This command only reviews uncommitted changes in your working directory.
```

Stop execution.

**Map changed files to layers:**
- Files matching `**/domain/**` → Domain layer
- Files matching `**/application/**` → Application layer
- Files matching `**/infrastructure/**` → Infrastructure layer

**Display detection:**
```
📊 Detected changes in git diff:

Changed files:
  • {file1} ({line_count} lines)
  • {file2} ({line_count} lines)

Layers identified: {layer_list}

Proceeding to review {layer_list}...
```

### Step 4: Review Code

**For each detected layer:**

**Call review-engine skill:**
```json
{
  "feature": "{feature_name}",
  "layer": "{layer}",
  "code_source": "git_diff",
  "plan_path": "docs/{feature_name}/plan.md"
}
```

The skill will:
- Load code from git diff
- Load implementation plan for context
- Load patterns and calibrations
- Build LLM-as-judge evaluation prompt
- Execute evaluation
- Calculate weighted scores
- Return structured review results

### Step 5: Evaluate Quality Gate

**Call quality-gate skill:**
```json
{
  "review": {review_result from review-engine},
  "threshold": 4.0
}
```

Note: Use default threshold 4.0 for manual reviews (orchestrator uses 4.5).

The skill will:
- Check overall score >= threshold
- Check no critical tactics < 4
- Check no important tactics < 4
- Check no constraint violations
- Categorize issues
- Return pass/fail decision

### Step 6: Display Review Report

**Format comprehensive report:**

```
# Code Review Report: {feature_name} - {layer} Layer

**Reviewed**: {file_count} files, {line_count} lines changed
**Date**: {current_date}

---

## Overall Score: {review.overall_score}/5.0 ({percentage}%) - {Grade}

**Grade Scale**:
- 4.5-5.0: Excellent ✅
- 4.0-4.4: Good ✅
- 3.0-3.9: Acceptable ⚠️
- 2.0-2.9: Needs Improvement ⚠️
- 0.0-1.9: Poor ❌

---

## Quality Gate: {gate_result.passed ? "✅ PASSED" : "❌ FAILED"}

**Threshold**: 4.0/5.0

{If gate_result.passed:}
All quality criteria met. Ready to commit.

{If NOT gate_result.passed:}
Reasons:
{For each reason in gate_result.reasons:}
  • {reason}

---

## Pattern Compliance Summary

{For each pattern in review.patterns:}

### {pattern.name} - {pattern.score}/5.0 ({percentage}%)

**Tactics Score**: {tactics_avg}/5.0 (weighted average)
**Constraints**: {pass_count} passed, {fail_count} failed

---

## Issues Found

{If gate_result.issues.critical.length > 0:}
### Critical Issues (Must Fix)

{For each issue in gate_result.issues.critical:}

#### ❌ {issue.tactic_name} - {issue.score}/5

**Pattern**: {issue.pattern_name}
**Priority**: Critical

**Problem**:
{issue.reasoning}

**Impact**:
{generate_impact_description(issue)}

**Improvement Suggestions**:
{generate_suggestions_from_score(issue)}

---

{If gate_result.issues.important.length > 0:}
### Important Issues (Should Fix)

{For each issue in gate_result.issues.important:}

#### ⚠️ {issue.tactic_name} - {issue.score}/5

**Pattern**: {issue.pattern_name}
**Priority**: Important

**Problem**:
{issue.reasoning}

**Impact**:
{generate_impact_description(issue)}

**Improvement Suggestions**:
{generate_suggestions_from_score(issue)}

---

{If gate_result.issues.optional.length > 0:}
### Optional Improvements

{For each issue in gate_result.issues.optional:}

#### 💡 {issue.tactic_name} - {issue.score}/5

**Pattern**: {issue.pattern_name}
**Priority**: Optional

**Suggestion**:
{issue.reasoning}

---

{If gate_result.issues.constraint_failures.length > 0:}
### Constraint Violations

{For each constraint in gate_result.issues.constraint_failures:}

#### 🚫 {constraint.rule}

**Pattern**: {constraint.pattern_name}

**Problem**:
{constraint.reasoning}

**Required Action**:
Must fix - hard constraint violation

---

## Next Steps

{If gate_result.passed:}
✅ **Quality gate passed** - Ready to commit

Suggested actions:
  1. Review the feedback above for any optional improvements
  2. Commit your changes:
     ```bash
     git add .
     git commit -m "feat({feature_name}): implement {layer} layer"
     ```
  3. Proceed to next layer or orchestrate full implementation

{If NOT gate_result.passed:}
⚠️ **Quality gate not met** - Address issues before committing

Priority actions:
  1. Fix critical issues (must fix)
  2. Fix important issues (should fix)
  3. Re-run review:
     ```bash
     /review:hex-arc {feature_name}
     ```

Target: Score ≥ 4.0 with no critical/important issues before committing.

---

## Pattern References

For detailed guidance, see pattern files:
{List pattern file paths from review}

---

**Evaluation Method**: LLM-as-Judge with calibrated scoring rubrics
```

### Step 7: Handle Multiple Layers

**If multiple layers detected:**
- Generate separate review for each layer
- Show combined summary at end

```
# Code Review Report: {feature_name}

**Layers Reviewed**: {layer_list}

---

## Domain Layer - {score}/5.0

{domain_review_content}

---

## Application Layer - {score}/5.0

{application_review_content}

---

## Overall Summary

**Average Score**: {average_score}/5.0
**Quality Gates**: {passed_count}/{total_count} passed

{combined_recommendations}
```

## Helper Functions

**generate_impact_description(issue):**
- Map tactic to known impacts
- Use pattern goal if available
- Default generic description

**generate_suggestions_from_score(issue):**
- Based on score and rubric
- What needs to improve to reach score 4 or 5
- Actionable recommendations

## Notes for Claude

**This command is now a thin wrapper:**
- Detects changes (git diff)
- Calls review-engine skill
- Calls quality-gate skill
- Formats output for user display

**All review logic is in skills:**
- review-engine: Performs LLM-as-judge evaluation
- quality-gate: Makes pass/fail decision

**User interaction:**
- Comprehensive, formatted report
- Clear pass/fail indication
- Actionable next steps
- Reference to pattern files

**Thresholds:**
- Manual review: 4.0 (informational, helps developer)
- Orchestrator: 4.5 (stricter for autonomous operation)
