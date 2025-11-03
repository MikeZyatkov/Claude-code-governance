---
name: review-engine
description: Reviews code against governance patterns using LLM-as-judge with calibrated scoring rubrics. Evaluates implementation quality and identifies issues.
allowed-tools: Read, Bash, Glob, Grep
---

# Review Engine Skill

Reviews code implementation against governance patterns using LLM-as-judge with calibrated scoring rubrics.

## Purpose

Evaluates code quality by scoring against pattern tactics and constraints, identifying issues that need fixing.

## When to Use

Invoked by orchestrator after layer implementation completes to assess quality before committing.

## How It Works

### Context from Orchestrator

Reads context from:
1. **Feature name:** From command or recent messages
2. **Layer:** domain, application, or infrastructure
3. **Patterns:** Already loaded or to be loaded
4. **Implementation files:** Located in `contexts/{feature}/{layer}/`

### Workflow

#### 1. Load Context

**Steps:**
1. Identify feature and layer from context
2. Find implementation files: `find contexts/{feature}/{layer}/ -name "*.ts" -type f`
3. Read implementation code
4. Load patterns via pattern-loader skill (with calibrations)

#### 2. Evaluate Each Pattern

**For each pattern:**

1. **Score each tactic** (0-5 scale):
   - Read calibrated rubric for the tactic
   - Analyze code against rubric criteria
   - Assign score (5=excellent, 4=good, 3=acceptable, 2=poor, 1=bad, 0=not applicable)
   - Provide reasoning for score

2. **Check constraints:**
   - MUST rules: Critical violations
   - SHOULD rules: Important best practices
   - MUST_NOT rules: Anti-patterns to avoid
   - Note any violations

3. **Calculate pattern score:**
   - Average scores of critical and important tactics
   - Exclude N/A tactics (score 0)
   - Weight: Critical tactics matter most

#### 3. Identify Issues

**Categorize issues by priority:**

**Critical issues:** (Score < 4 for critical tactics, or MUST constraint violated)
- Tactic with score
- Problem description
- What pattern expects
- Impact on system

**Important issues:** (Score < 4 for important tactics, or SHOULD constraint violated)
- Similar format to critical
- Less severe impact

**Optional improvements:** (Nice tactics score < 4)
- Enhancement opportunities
- Not required for quality gate

#### 4. Calculate Overall Score

**Formula:**
```
overall_score = average(all_pattern_scores)
```

Only include applicable tactics (exclude N/A).

## Instructions for Claude

### Reading Context

**Feature/Layer:** From orchestrator

**Implementation files:**
```bash
find contexts/{feature}/{layer}/ -name "*.ts" -type f
```

**Patterns:** Invoke pattern-loader to get patterns with calibrations

### Scoring Guidelines

**Use Calibrated Rubrics:**
- Each tactic has a rubric with score descriptions
- Match code behavior to rubric criteria
- Be objective and consistent
- Provide specific evidence from code

**Score Meanings:**
- **5:** Exceeds expectations, best practices applied
- **4:** Meets expectations, pattern followed correctly
- **3:** Acceptable but has minor issues
- **2:** Significant problems, pattern partially followed
- **1:** Major problems, pattern mostly ignored
- **0:** Not applicable (tactic doesn't apply to this code)

**Critical vs Important:**
- Critical tactics: Core to pattern success
- Important tactics: Strongly recommended
- Nice tactics: Optional enhancements

### Issue Formatting

For each issue, provide:
1. **Tactic name** and **pattern name**
2. **Score** (out of 5)
3. **Problem:** What's wrong in the code
4. **Required:** What pattern expects
5. **Impact:** Why this matters (business/technical consequence)

### Reporting Results

Present results clearly:
```
Review Results for {feature} - {layer} layer

Overall Score: {score}/5.0

Pattern: DDD Aggregates and Entities
- encapsulate-state: 3/5 (Some state is public)
- apply-via-events: 5/5 (All state changes emit events)
- invariant-methods: 4/5 (Most invariants enforced)
  Pattern Score: 4.0/5.0

Issues Found:

CRITICAL:
1. encapsulate-state - Score: 3/5
   Problem: Several fields are public (email, name, status)
   Required: All state private with _ prefix, access via getters
   Impact: Breaks encapsulation, allows direct mutation bypassing domain logic

IMPORTANT:
2. [No important issues]

Constraints: All passed
```

## Example Workflow

**Context:**
- Feature: tenant-onboarding
- Layer: domain
- Orchestrator: "Review the domain layer implementation"

**Actions:**
1. Find files: contexts/tenant-onboarding/domain/model/*.ts
2. Read: Tenant.ts, EmailAddress.ts, CompanyName.ts
3. Load pattern: ddd-aggregates with calibration
4. Score each tactic:
   - encapsulate-state: Read rubric, check if state is private → Score 3 (some public fields)
   - apply-via-events: Check if events emitted → Score 5 (all state changes emit events)
   - invariant-methods: Check validation → Score 4 (most enforced)
5. Calculate pattern score: (3+5+4)/3 = 4.0
6. Identify issues: encapsulate-state scored below 4 (critical)
7. Format issue with problem/required/impact
8. Report results with overall score 4.0/5.0

## Notes

**LLM-as-judge:** This skill uses Claude's judgment to score code quality

**Calibration:** Rubrics provide consistency across reviews

**Objectivity:** Base scores on evidence from code, not assumptions

**Tool Restrictions:** Read-only - cannot modify code during review
