---
name: git-ops
description: Handles git operations with standardized commit messages including quality metrics. Creates clean, professional commits.
allowed-tools: Bash, Read, Grep
---

# Git Ops Skill

Handles git operations with standardized commit messages including quality metrics.

## Purpose

Creates clean commits with professional messages that include implementation details and quality scores.

## When to Use

Invoked by orchestrator after quality gate passes, when code is ready to commit.

## How It Works

### Context from Orchestrator

Reads context from:
1. **Feature/Layer:** From recent workflow
2. **Review results:** Score, patterns evaluated
3. **Implementation details:** From implementation-engine output
4. **Fix iterations:** How many fix cycles occurred

### Workflow

#### 1. Stage Files

**Steps:**
1. Identify files to stage:
   - New files created during implementation
   - Modified files from implementation or fixes
   - Exclude: node_modules, dist, build artifacts

2. Stage files:
   ```bash
   # For tracked files that were modified
   git add -u

   # For new files explicitly listed
   git add {file_paths}
   ```

**Don't use `git add .`** - only stage files from this implementation.

#### 2. Generate Commit Message

**Format:**
```
feat({feature}): implement {layer} layer

{Brief description of what was implemented}

Components:
- {component_1}: {description}
- {component_2}: {description}

Quality: {score}/5.0 ({iterations} iteration(s))
Patterns: {pattern_scores}
```

**Example:**
```
feat(tenant-onboarding): implement domain layer

Created Tenant aggregate with value objects and domain events following DDD patterns.

Components:
- Tenant aggregate: Manages tenant lifecycle with encapsulated state
- EmailAddress VO: Validates email format
- CompanyName VO: Validates company name constraints
- TenantCreated/Activated events: Track state changes

Quality: 4.7/5.0 (2 iterations)
Patterns: ddd-aggregates (4.7/5.0)
```

#### 3. Create Commit

**Steps:**
1. Generate commit message (see format above)
2. Commit with message:
   ```bash
   git commit -m "$(cat <<'EOF'
   {commit_message}
   EOF
   )"
   ```
3. Capture commit hash: `git rev-parse HEAD`
4. Return hash for audit logging

**Important:**
- Use HEREDOC for message formatting
- No `--no-verify` or `--no-gpg-sign` (respect hooks)
- No force push
- Clean, professional format

#### 4. Verify Commit

**Steps:**
1. Check commit was created: `git log -1 --oneline`
2. Verify files were staged correctly
3. Return commit hash and message

## Instructions for Claude

### Staging Files

**Read implementation results:**
- Check which files were created/modified
- Get file list from implementation-engine context
- Only stage those specific files

**Commands:**
```bash
# Modified tracked files
git add -u

# New files (explicit list)
git add contexts/tenant-onboarding/domain/model/Tenant.ts
git add contexts/tenant-onboarding/domain/model/EmailAddress.ts
# ... etc
```

**Don't:**
- Use `git add .` (stages everything)
- Stage unrelated files
- Skip files that should be committed

### Generating Messages

**Message Structure:**
1. **Header:** `feat({feature}): implement {layer} layer`
2. **Body:** Brief description
3. **Components:** List what was built
4. **Quality:** Score and iterations
5. **Patterns:** Pattern names and scores

**Read from context:**
- Feature name
- Layer name
- Components list (from implementation-engine)
- Review score (from review-engine)
- Fix iterations (from fix-coordinator)
- Pattern scores (from review-engine)

### Commit Creation

**Use HEREDOC:**
```bash
git commit -m "$(cat <<'EOF'
feat(tenant-onboarding): implement domain layer

Created Tenant aggregate with value objects...

Components:
- Tenant aggregate: ...
- EmailAddress VO: ...

Quality: 4.7/5.0 (2 iterations)
Patterns: ddd-aggregates (4.7/5.0)
EOF
)"
```

**Respect hooks:**
- Don't use `--no-verify`
- Let pre-commit hooks run
- If hooks modify files, that's okay

### Error Handling

**Nothing to commit:**
- Check `git status`
- If no changes, tell orchestrator
- Don't create empty commit

**Commit hook failures:**
- Show hook output
- Let orchestrator decide next steps
- Don't force commit

**Conflicts:**
- Check for merge conflicts
- Resolve if possible
- Ask user if complex

## Example Workflow

**Context:**
- Feature: tenant-onboarding
- Layer: domain
- Orchestrator: "Create commit for domain layer"
- Review score: 4.7/5.0, 2 iterations
- Pattern: ddd-aggregates (4.7/5.0)

**Actions:**
1. Read implementation results
2. Files to commit:
   - Tenant.ts (new)
   - EmailAddress.ts (new)
   - CompanyName.ts (new)
   - Tenant.test.ts (new)
3. Stage files:
   ```bash
   git add -u
   git add contexts/tenant-onboarding/domain/model/Tenant.ts
   git add contexts/tenant-onboarding/domain/model/EmailAddress.ts
   git add contexts/tenant-onboarding/domain/model/CompanyName.ts
   git add test/domain/Tenant.test.ts
   ```
4. Generate message (see format above)
5. Commit with HEREDOC
6. Get hash: `git rev-parse HEAD` → `abc123def`
7. Return hash for audit logging

## Notes

**Message Format:** Clean, professional, no Claude footer

**Staging:** Only stage files from this implementation

**Hooks:** Respect pre-commit hooks, don't bypass

**Quality Metrics:** Include score and iterations for transparency

**Tool Restrictions:** Git and read-only operations
