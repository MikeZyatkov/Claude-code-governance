---
name: git-ops
description: Handles git operations with standardized commit messages including quality metrics. Provides centralized git operations - commit message generation, staging, and committing, with clean professional format.
---

# Git Ops Skill

Handles git operations with standardized commit messages including quality metrics.

## Purpose

Provides centralized git operations - commit message generation, staging, committing, with clean format (no Claude footer).

## Input

```json
{
  "action": "commit",
  "feature": "tenant-onboarding",
  "layer": "domain",
  "review_score": 4.6,
  "fix_iterations": 1,
  "pattern_scores": [
    {"name": "DDD Aggregates v1", "score": 4.8},
    {"name": "Event Sourcing v1", "score": 4.5}
  ]
}
```

## Output

```json
{
  "success": true,
  "commit_hash": "abc1234",
  "commit_message": "feat(tenant-onboarding): implement domain layer\n\nReview score: 4.6/5.0\nFix iterations: 1\nPatterns: DDD Aggregates v1 (4.8), Event Sourcing v1 (4.5)"
}
```

## Instructions for Claude

### Step 1: Generate Commit Message

**Format:**
```
feat({feature}): implement {layer} layer

Review score: {review_score}/5.0
Fix iterations: {fix_iterations}
Patterns: {pattern_list}
```

**Example:**
```
feat(tenant-onboarding): implement domain layer

Review score: 4.6/5.0
Fix iterations: 1
Patterns: DDD Aggregates v1 (4.8), Event Sourcing v1 (4.5)
```

**Pattern list format:**
```
{pattern.name} ({pattern.score}), {pattern.name} ({pattern.score}), ...
```

**NO Claude footer** - clean, professional commit messages only.

### Step 2: Stage Changes

```bash
git add .
```

### Step 3: Create Commit

**Use heredoc for proper formatting:**
```bash
git commit -m "$(cat <<'EOF'
feat({feature}): implement {layer} layer

Review score: {review_score}/5.0
Fix iterations: {fix_iterations}
Patterns: {pattern_list}
EOF
)"
```

### Step 4: Get Commit Hash

```bash
git rev-parse --short HEAD
```

### Step 5: Return Result

```json
{
  "success": true,
  "commit_hash": "{hash}",
  "commit_message": "{full_message}"
}
```

## Error Handling

**Nothing to commit:**
```json
{
  "success": false,
  "error": "Nothing to commit",
  "message": "Working directory clean, no changes to commit"
}
```

**Commit failed:**
```json
{
  "success": false,
  "error": "Commit failed",
  "details": "{error_message from git}"
}
```

**Conflicts:**
```json
{
  "success": false,
  "error": "Merge conflicts detected",
  "message": "Resolve conflicts manually before committing"
}
```

## Usage Example

**Orchestrator after passing quality gate:**
```markdown
Call git-ops skill with:
- action: "commit"
- feature: "tenant-onboarding"
- layer: "domain"
- review_score: 4.6
- fix_iterations: 1
- pattern_scores: [...]

Receive result.

If result.success:
  Log to audit: "Commit: {result.commit_hash}"
  Proceed to next layer

If NOT result.success:
  Handle error (ask user for intervention)
```

## Notes for Claude

**Commit Message Format:**
- Subject: feat({feature}): implement {layer} layer
- Body: Quality metrics (review score, iterations, patterns)
- NO Claude footer or co-authorship
- Professional and concise

**Git Operations:**
- Stage all changes (git add .)
- Use heredoc for multi-line messages
- Capture commit hash for audit trail

**Error Recovery:**
- Check git status before committing
- Detect conflicts
- Provide actionable error messages
