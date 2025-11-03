---
name: quality-gate
description: Makes pass/fail decisions based on review results against quality thresholds. Determines if code is ready to commit or needs fixes.
allowed-tools: Read, Bash
---

# Quality Gate Skill

Makes pass/fail decisions based on review results against configurable quality thresholds.

## Purpose

Evaluates review results and determines whether code passes quality gate or needs fixing.

## When to Use

Invoked by orchestrator immediately after review-engine completes to make go/no-go decision.

## How It Works

### Context from Orchestrator

Reads context from:
1. **Review results:** From most recent review-engine output
2. **Threshold:** Quality score threshold (e.g., 4.5/5.0)
3. **Feature/Layer:** From recent workflow

### Workflow

#### 1. Read Review Results

**Steps:**
1. Get review results from orchestrator context
2. Extract:
   - Overall score (e.g., 4.2/5.0)
   - Issues categorized by priority (critical, important)
   - Pattern scores
   - Constraint violations

#### 2. Apply Quality Gate Logic

**Pass Criteria (ALL must be true):**
1. Overall score ≥ threshold
2. No critical issues with score < 4
3. No MUST constraint violations

**Fail Criteria (ANY triggers failure):**
1. Overall score < threshold
2. Any critical issue with score < 4
3. Any MUST constraint violated

#### 3. Make Decision

**If PASS:**
- Code is ready to commit
- Proceed to git-ops

**If FAIL:**
- Code needs fixes
- Proceed to fix-coordinator
- Categorize issues for fixing

#### 4. Categorize Issues for Fixes

**For failed gate:**

**Must fix** (blocks commit):
- Critical tactics with score < 4
- MUST constraints violated
- Blocks: High severity issues

**Should fix** (important but not blocking):
- Important tactics with score < 4
- SHOULD constraints violated
- Can be addressed in iteration

**Could fix** (optional):
- Nice-to-have improvements
- Not required for passing gate

## Instructions for Claude

### Reading Review Results

**From orchestrator context:**
- Look for review-engine output in recent messages
- Extract overall_score, issues, pattern_scores
- Identify which tactics failed (score < 4)

### Applying Threshold

**Threshold from orchestrator:**
- Usually 4.5/5.0 or 4.0/5.0
- Compare overall_score to threshold
- Account for rounding (4.45 rounds to 4.5)

### Decision Logic

**Simple rule:**
```
if overall_score >= threshold AND no_critical_issues AND no_must_violations:
    decision = PASS
else:
    decision = FAIL
    categorize_issues_for_fixes()
```

### Reporting Decision

**For PASS:**
```
✅ Quality Gate: PASSED

Score: {overall_score}/5.0 (threshold: {threshold})
Ready to commit
```

**For FAIL:**
```
⚠️ Quality Gate: FAILED

Score: {overall_score}/5.0 (threshold: {threshold})

Must Fix (Critical):
- {issue_1}
- {issue_2}

Should Fix (Important):
- {issue_3}

Proceeding to fix cycle...
```

## Example Workflow

**Context:**
- Feature: tenant-onboarding, Layer: domain
- Review complete with score 4.2/5.0
- Threshold: 4.5/5.0
- 1 critical issue found (encapsulate-state: 3/5)

**Actions:**
1. Read review results from context
2. Check score: 4.2 < 4.5 → FAIL
3. Check issues: 1 critical (score 3 < 4) → FAIL
4. Categorize:
   - Must fix: encapsulate-state (score 3, critical)
5. Report: Quality gate FAILED, must fix encapsulate-state
6. Orchestrator proceeds to fix-coordinator

**Context 2:**
- Score: 4.7/5.0, Threshold: 4.5
- No critical issues below 4
- No constraint violations

**Actions:**
1. Read review results
2. Check: 4.7 ≥ 4.5 → PASS
3. No critical issues → PASS
4. Report: Quality gate PASSED, ready to commit
5. Orchestrator proceeds to git-ops

## Notes

**Threshold:** Configurable per orchestration run (default: 4.5)

**Critical matters:** Even if overall score passes, critical issues can fail the gate

**Constraints:** MUST violations always fail, SHOULD violations are warnings

**Tool Restrictions:** Read-only decision logic
