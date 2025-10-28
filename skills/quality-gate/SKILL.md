---
name: quality-gate
description: Makes pass/fail decisions based on review results against configurable quality criteria. Evaluates review results and determines whether code passes quality gate, categorizing issues by priority for fix cycles.
---

# Quality Gate Skill

Makes pass/fail decisions based on review results against configurable quality criteria.

## Purpose

Evaluates review results from review-engine and determines whether code passes quality gate. Categorizes issues by priority for fix cycles.

## Input

```json
{
  "review": {
    "overall_score": 4.2,
    "patterns": [...]
  },
  "threshold": 4.5
}
```

## Output

```json
{
  "passed": false,
  "reasons": [
    "Overall score 4.2 < threshold 4.5",
    "1 critical tactic scored below 4",
    "1 important tactic scored below 4"
  ],
  "issues": {
    "critical": [
      {
        "tactic_id": "encapsulate-state",
        "tactic_name": "Encapsulate aggregate state",
        "pattern_name": "DDD Aggregates v1",
        "score": 3,
        "reasoning": "Some state fields lack _ prefix...",
        "priority": "critical"
      }
    ],
    "important": [
      {
        "tactic_id": "invariant-methods",
        "tactic_name": "Validate invariants in methods",
        "pattern_name": "DDD Aggregates v1",
        "score": 3,
        "reasoning": "activate() doesn't validate...",
        "priority": "important"
      }
    ],
    "optional": [],
    "constraint_failures": []
  },
  "summary": {
    "overall_score": 4.2,
    "threshold": 4.5,
    "critical_issues_count": 1,
    "important_issues_count": 1,
    "constraint_failures_count": 0
  }
}
```

## Instructions for Claude

### Step 1: Initialize Evaluation

**Set up tracking:**
```
passed = true
reasons = []
issues = {
  critical: [],
  important: [],
  optional: [],
  constraint_failures: []
}
```

### Step 2: Check Overall Score

**Criterion 1: Overall score >= threshold**

```
if review.overall_score < threshold:
  passed = false
  reasons.append(f"Overall score {review.overall_score} < threshold {threshold}")
```

### Step 3: Check Critical Tactics

**Criterion 2: No critical tactics with score < 4**

```
for each pattern in review.patterns:
  for each tactic in pattern.tactics:
    if tactic.priority == "critical" AND tactic.score >= 0 AND tactic.score < 4:
      passed = false
      reasons.append(f"Critical tactic '{tactic.tactic_name}' scored {tactic.score} (< 4)")
      issues.critical.append({
        tactic_id: tactic.tactic_id,
        tactic_name: tactic.tactic_name,
        pattern_name: pattern.name,
        score: tactic.score,
        reasoning: tactic.reasoning,
        priority: "critical"
      })
```

Note: Exclude tactics with score = -1 (not applicable)

### Step 4: Check Important Tactics

**Criterion 3: No important tactics with score < 4**

```
for each pattern in review.patterns:
  for each tactic in pattern.tactics:
    if tactic.priority == "important" AND tactic.score >= 0 AND tactic.score < 4:
      passed = false
      reasons.append(f"Important tactic '{tactic.tactic_name}' scored {tactic.score} (< 4)")
      issues.important.append({
        tactic_id: tactic.tactic_id,
        tactic_name: tactic.tactic_name,
        pattern_name: pattern.name,
        score: tactic.score,
        reasoning: tactic.reasoning,
        priority: "important"
      })
```

### Step 5: Check Constraints

**Criterion 4: No constraint violations**

```
for each pattern in review.patterns:
  for each constraint in pattern.constraints:
    if constraint.status == "FAIL":
      passed = false
      reasons.append(f"Constraint violation: {constraint.rule}")
      issues.constraint_failures.append({
        rule: constraint.rule,
        description: constraint.description,
        reasoning: constraint.reasoning,
        pattern_name: pattern.name
      })
```

### Step 6: Collect Optional Issues (For Awareness)

**Not a pass/fail criterion, but useful for reporting:**

```
for each pattern in review.patterns:
  for each tactic in pattern.tactics:
    if tactic.priority == "optional" AND tactic.score >= 0 AND tactic.score < 3:
      issues.optional.append({
        tactic_id: tactic.tactic_id,
        tactic_name: tactic.tactic_name,
        pattern_name: pattern.name,
        score: tactic.score,
        reasoning: tactic.reasoning,
        priority: "optional"
      })
```

Optional issues don't fail the gate, but worth noting.

### Step 7: Build Summary

```
summary = {
  overall_score: review.overall_score,
  threshold: threshold,
  critical_issues_count: issues.critical.length,
  important_issues_count: issues.important.length,
  constraint_failures_count: issues.constraint_failures.length
}
```

### Step 8: Return Result

**Build output JSON as specified:**
- passed (boolean)
- reasons (array of strings)
- issues (categorized)
- summary

**Return structured JSON.**

## Quality Gate Logic

**Pass if ALL of these are true:**
1. ✅ `overall_score >= threshold`
2. ✅ No critical tactics with `score < 4`
3. ✅ No important tactics with `score < 4`
4. ✅ No constraints with `status = "FAIL"`

**Fail if ANY of these are true:**
1. ❌ `overall_score < threshold`
2. ❌ Any critical tactic has `score < 4`
3. ❌ Any important tactic has `score < 4`
4. ❌ Any constraint has `status = "FAIL"`

## Usage Examples

### Example 1: Gate Passes

**Input:**
```json
{
  "review": {
    "overall_score": 4.6,
    "patterns": [{
      "tactics": [
        {"priority": "critical", "score": 5},
        {"priority": "important", "score": 4}
      ],
      "constraints": [{"status": "PASS"}]
    }]
  },
  "threshold": 4.5
}
```

**Output:**
```json
{
  "passed": true,
  "reasons": [],
  "issues": {
    "critical": [],
    "important": [],
    "optional": [],
    "constraint_failures": []
  },
  "summary": {
    "overall_score": 4.6,
    "threshold": 4.5,
    "critical_issues_count": 0,
    "important_issues_count": 0,
    "constraint_failures_count": 0
  }
}
```

### Example 2: Gate Fails (Multiple Criteria)

**Input:**
```json
{
  "review": {
    "overall_score": 4.2,
    "patterns": [{
      "name": "DDD Aggregates v1",
      "tactics": [
        {
          "tactic_id": "encapsulate-state",
          "tactic_name": "Encapsulate state",
          "priority": "critical",
          "score": 3,
          "reasoning": "Fields lack _ prefix"
        },
        {
          "tactic_id": "invariant-methods",
          "tactic_name": "Validate invariants",
          "priority": "important",
          "score": 3,
          "reasoning": "Missing validation"
        }
      ],
      "constraints": [{"status": "PASS"}]
    }]
  },
  "threshold": 4.5
}
```

**Output:**
```json
{
  "passed": false,
  "reasons": [
    "Overall score 4.2 < threshold 4.5",
    "Critical tactic 'Encapsulate state' scored 3 (< 4)",
    "Important tactic 'Validate invariants' scored 3 (< 4)"
  ],
  "issues": {
    "critical": [
      {
        "tactic_id": "encapsulate-state",
        "tactic_name": "Encapsulate state",
        "pattern_name": "DDD Aggregates v1",
        "score": 3,
        "reasoning": "Fields lack _ prefix",
        "priority": "critical"
      }
    ],
    "important": [
      {
        "tactic_id": "invariant-methods",
        "tactic_name": "Validate invariants",
        "pattern_name": "DDD Aggregates v1",
        "score": 3,
        "reasoning": "Missing validation",
        "priority": "important"
      }
    ],
    "optional": [],
    "constraint_failures": []
  },
  "summary": {
    "overall_score": 4.2,
    "threshold": 4.5,
    "critical_issues_count": 1,
    "important_issues_count": 1,
    "constraint_failures_count": 0
  }
}
```

## Caller Usage

**Orchestrator:**
```markdown
1. Call review-engine skill → get review results
2. Call quality-gate skill with review + threshold
3. Check gate_result.passed:
   - If true → proceed to commit
   - If false → send gate_result.issues to fix-coordinator
```

**Review command:**
```markdown
1. Call review-engine skill → get review results
2. Call quality-gate skill with review + threshold
3. Display to user:
   "Quality Gate: {PASSED/FAILED}

   Score: {overall_score}/{threshold}

   {If failed:}
   Issues to fix:
   - {critical_issues}
   - {important_issues}"
```

## Notes for Claude

**Threshold Flexibility:**
- Default: 4.5
- User can configure (e.g., 4.0 for lenient, 4.8 for strict)
- All criteria must still pass (critical/important < 4, constraints)

**Non-Applicable Tactics:**
- Tactics with score = -1 are not applicable
- Exclude from all checks
- Don't count as issues

**Optional Issues:**
- Don't fail the gate
- Useful for awareness and improvement suggestions
- Only collect if score < 3 (not too strict)

**Output Format:**
- Always valid JSON
- Categorized issues for fix coordinator
- Clear reasons for failure
