---
name: review-engine
description: Performs code review using LLM-as-judge with calibrated scoring rubrics. Evaluates code against governance patterns and returns structured review results with scores and reasoning.
---

# Review Engine Skill

Performs code review using LLM-as-judge with calibrated scoring rubrics.

## Purpose

Evaluates code against governance patterns and returns structured review results. Does NOT make pass/fail decisions - that's quality-gate's job.

## Input

```json
{
  "feature": "tenant-onboarding",
  "layer": "domain",
  "code_source": "git_diff" | "files",
  "plan_path": "docs/tenant-onboarding/plan.md"
}
```

## Output

```json
{
  "feature": "tenant-onboarding",
  "layer": "domain",
  "overall_score": 4.2,
  "patterns": [
    {
      "name": "DDD Aggregates v1",
      "version": "v1",
      "score": 4.0,
      "tactics": [
        {
          "tactic_id": "encapsulate-state",
          "tactic_name": "Encapsulate aggregate state",
          "priority": "critical",
          "score": 3,
          "reasoning": "Some state fields in Tenant aggregate are declared as public or lack the underscore prefix. Found: 'companyName' and 'adminEmail' without '_' prefix, and 'status' declared as public instead of private.",
          "rubric_level": "Score 3: Some fields are encapsulated..."
        },
        {
          "tactic_id": "invariant-methods",
          "tactic_name": "Validate invariants in methods",
          "priority": "important",
          "score": 3,
          "reasoning": "The activate() method doesn't validate business rules before state change. Missing validation: Should check that tenant is not already active, should verify admin email is confirmed before activation."
        }
      ],
      "constraints": [
        {
          "rule": "Aggregate root MUST be only entry point for modifications",
          "status": "PASS",
          "reasoning": "All modifications go through aggregate root methods. No direct access to child entities."
        }
      ]
    }
  ],
  "overall_reasoning": "Implementation follows most DDD patterns but has some encapsulation issues and missing invariant validations that need to be addressed."
}
```

## Instructions for Claude

### Step 1: Load Code to Review

**If code_source = "git_diff":**
```bash
git diff HEAD
```
Parse changed files and extract code.

**If code_source = "files":**
Read files matching layer pattern:
- Domain: `src/domain/**/*.ts` and `test/domain/**/*.ts`
- Application: `src/application/**/*.ts` and `test/application/**/*.ts`
- Infrastructure: `src/infrastructure/**/*.ts` and `test/infrastructure/**/*.ts`

**Combine code into single block:**
```typescript
// File: src/domain/Tenant.aggregate.ts
{file_content}

// File: src/domain/EmailAddress.ts
{file_content}

...
```

### Step 2: Load Implementation Plan

**Read plan:**
- Extract relevant layer section
- Understand what was supposed to be implemented
- This helps evaluate if planned features are present

**Use this to check:**
- Are all planned components implemented?
- Are planned event registrations present?
- Do planned methods exist?
- Any regressions or missing implementations?

### Step 3: Load Patterns and Calibrations

**Use pattern-loader skill:**

From plan's "Pattern Compliance" section, extract pattern names for this layer.

```json
{
  "action": "load",
  "filter": {
    "pattern_names": ["ddd-aggregates", "event-sourcing", ...]
  }
}
```

**Extract from loaded patterns:**
- Goal and guiding_policy
- All tactics (id, name, priority, description)
- All constraints (rule, description, exceptions, evaluation)
- Calibration rubrics (tactic_id → score → description)

### Step 4: Build Evaluation Prompt

**Construct LLM-as-judge prompt:**

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
{combined_code_from_all_files}
```

## Evaluation Instructions

### Part 1: Evaluate Tactics

Score each tactic on a scale of 0-5 using the provided rubric:

{For each tactic:}

#### Tactic: {tactic.name}
**ID**: {tactic.id}
**Priority**: {tactic.priority}
**Description**: {tactic.description}

**Scoring Rubric**:
- **5**: {rubric[5]}
- **4**: {rubric[4]}
- **3**: {rubric[3]}
- **2**: {rubric[2]}
- **1**: {rubric[1]}
- **0**: {rubric[0]}

{...repeat for all tactics}

For each tactic, provide:
1. Score (0-5, or -1 if not applicable)
2. Brief reasoning (2-3 sentences with specific code examples)

**IMPORTANT**: If a tactic is not applicable to the code being evaluated (e.g., entity-related tactics when there are no child entities), use a score of **-1** and explain why it's not applicable in the reasoning. Non-applicable tactics will be excluded from scoring calculations.

### Part 2: Evaluate Constraints

Check each constraint and determine: PASS, FAIL, or EXCEPTION_ALLOWED

{For each constraint:}

#### Constraint: {constraint.rule}
**Description**: {constraint.description}
**Evaluation Type**: {constraint.evaluation}
**Allowed Exceptions**:
  - {exception1}
  - {exception2}

{...repeat for all constraints}

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
      "tactic_id": "...",
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

### Step 5: Execute LLM Evaluation

**Send prompt to LLM** (Task tool or direct invocation)

**Parse JSON response:**
- Extract tactic_scores array
- Extract constraint_checks array
- Extract overall_reasoning

**Handle errors:**
- If JSON is malformed, return error
- If LLM doesn't follow format, return error

### Step 6: Calculate Scores

**For each pattern:**

1. **Filter out non-applicable tactics** (score = -1)

2. **Calculate weighted tactics score:**
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

3. **Check constraints:**
```
constraints_passed = (FAIL count == 0)
```

4. **Calculate overall pattern score:**
```
pattern_score = (tactics_score / 5.0) × 0.7 + (constraints_passed ? 1 : 0) × 0.3

Result: 0.0 to 1.0, then multiply by 5.0 for 0-5 scale
```

5. **Calculate overall score:**
```
overall_score = average(all pattern_scores)
```

### Step 7: Build Output JSON

**Structure output as specified:**
- feature
- layer
- overall_score
- patterns array (with scores, tactics, constraints)
- overall_reasoning

**Return structured JSON.**

## Usage Examples

**Caller (review command):**
```markdown
Call review-engine skill.
Receive review results.

Format for user display:
"# Code Review Report

Overall Score: 4.2/5.0

## DDD Aggregates v1 - 4.0/5.0

### Issues:
1. [CRITICAL] encapsulate-state - 3/5
   {reasoning}

2. [IMPORTANT] invariant-methods - 3/5
   {reasoning}"
```

**Caller (orchestrate command):**
```markdown
Call review-engine skill.
Receive review results.

Pass to quality-gate skill for pass/fail decision.
Log to audit trail with detailed issues.
```

## Notes for Claude

**LLM-as-Judge Prompt:**
- Use the EXACT prompt structure shown above
- This ensures consistency with evaluation framework
- Improvements benefit both review and evaluation

**JSON Parsing:**
- Expect JSON response from LLM
- Parse carefully
- Handle malformed JSON gracefully

**Score Calculation:**
- Use weights: critical=3.0, important=2.0, optional=1.0
- Exclude non-applicable tactics (score=-1)
- Calculate weighted average

**Non-Applicable Tactics:**
- Entity tactics when no child entities
- Collection tactics when no collections
- Score -1 and exclude from calculations

**Output Format:**
- Always valid JSON
- Structure exactly as specified
- Include all fields
