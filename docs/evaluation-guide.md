# Evaluation Guide

## Purpose

The evaluation framework assesses code quality against defined patterns using both deterministic checks and LLM-as-judge scoring. This guide explains how to run evaluations, interpret results, and act on recommendations.

## Overview

Evaluation combines two approaches:

**Deterministic Checks** (30% weight): Objective, automated checks
- Unit tests passing
- Linting compliance
- Type checking
- AST-based constraint validation
- Security scans

**LLM-as-Judge** (70% weight): Pattern-specific quality assessment
- Tactics scoring (0-5 per tactic using calibration rubrics)
- Constraint checking (PASS/FAIL/EXCEPTION_ALLOWED)
- Multi-pass consistency (median aggregation)

## Quick Start

### Step 1: Prepare Your Code

Identify the code you want to evaluate. This can be:
- A single file
- A directory of related files
- Newly generated code
- Existing codebase for audit

### Step 2: Identify Applicable Patterns

Determine which patterns apply to your code:
- **DDD Aggregates v1**: For aggregate root and entity classes
- **CQRS v1**: For command and query handlers

### Step 3: Load Pattern and Calibration

Each pattern requires its corresponding calibration file for scoring:

**Pattern**: `patterns/domain/ddd-aggregates/v1.yaml`
**Calibration**: `calibration/ddd-aggregates/v1-scoring.yaml`

### Step 4: Run Evaluation

Execute the evaluation framework with your code, patterns, and calibrations.

### Step 5: Review Results

Examine the evaluation output to understand:
- Overall score (0-5 scale)
- Tactics scores (which tactics scored well/poorly)
- Constraint status (which rules passed/failed)
- Recommendations (specific improvements to make)

## Understanding Results

### Overall Score

The overall score combines deterministic and LLM-judge results:

```
overall_score = (deterministic × 0.3) + (pattern_scores × 0.7)
```

**Score Interpretation**:
- **4.5-5.0**: Excellent - Exemplary implementation
- **4.0-4.4**: Good - Meets standards with minor gaps
- **3.0-3.9**: Acceptable - Functional but needs improvement
- **2.0-2.9**: Needs Work - Significant issues present
- **0.0-1.9**: Poor - Does not follow pattern

### Tactics Score

Each tactic receives a 0-5 score based on its calibration rubric. Tactics are weighted by priority:

**Priority Weights**:
- Critical: 3.0 (core to pattern, must be excellent)
- Important: 2.0 (significant but some flexibility)
- Optional: 1.0 (context-dependent, nice to have)

The weighted tactics score is calculated as:

```
tactics_score = Σ(tactic_score × weight) / Σ(weight)
```

**Focus on Critical Tactics**: Low scores on critical tactics have the biggest impact on overall quality.

### Constraint Checks

Each constraint is evaluated as:

**PASS**: Constraint satisfied, no violations found

**FAIL**: Constraint violated, must be fixed

**EXCEPTION_ALLOWED**: Constraint technically violated, but valid exception applies

Constraints are binary - you either satisfy them or you don't. Even one FAIL means `constraints_passed = false` for that pattern.

### Recommendations

The evaluation generates actionable recommendations prioritized by impact:

**Critical Tactic Issues** (🔴): Immediate attention required
- Core pattern elements scoring < 3.0
- High impact on code quality

**Important Tactic Issues** (🟡): Should address soon
- Significant tactics scoring < 3.5
- Moderate impact on quality

**Constraint Violations** (🚫): Must fix
- Hard rules violated
- Code may be incorrect or unsafe

## Deterministic Checks

### Tests Passing

If code path provided, framework attempts to run tests:
- Looks for test files in standard locations
- Executes test runner (Jest, Vitest, etc.)
- Reports pass/fail status

**Score**: Binary (pass = 100, fail = 0)

### Linter Score

Runs configured linter (ESLint, etc.) and calculates score:

```
linter_score = 100 - (warnings × 5) - (errors × 10)
```

**Interpretation**:
- 100: No issues
- 80-99: Minor warnings
- < 80: Significant style issues

### Type Check

Runs TypeScript compiler in check mode:

**Score**: Binary (pass = 100, fail = 0)

**Common issues**:
- Missing type annotations
- Type mismatches
- Incorrect interface implementations

### Security Scans

Checks for common security issues:
- Hardcoded secrets
- SQL injection vulnerabilities
- XSS risks
- Insecure dependencies

**Output**: List of issues with severity

### AST-Based Constraint Checks

For deterministic constraints, analyzes code structure:

**Example**: "Entities MUST NOT have public setters"
- Parse code to AST
- Find all class methods
- Check for public set accessors
- Report violations

**Advantages**: Fast, precise, no false positives

## LLM-as-Judge Evaluation

### How It Works

1. **Load Pattern + Calibration**: Combines tactic definitions with scoring rubrics
2. **Build Prompt**: Creates evaluation prompt with code, tactics, rubrics, and constraints
3. **Call LLM**: Sends prompt to Claude with structured output format
4. **Parse Response**: Extracts scores, reasoning, and constraint checks
5. **Multi-Pass**: Repeats 3-5 times for consistency
6. **Aggregate**: Uses median for scores, majority vote for constraints

### Multi-Pass Consistency

LLM evaluations can vary between runs. Multi-pass aggregation improves reliability:

**Tactic Scores**: Use median across passes
- Reduces impact of outlier scores
- More stable than mean

**Constraint Checks**: Use majority vote
- If 2+ passes say PASS, result is PASS
- If 2+ passes say FAIL, result is FAIL

**Default**: 3 passes (configurable)

### Prompt Structure

The LLM receives:

**Context**: Pattern goal and guiding policy

**Tactics to Evaluate**: Each tactic with:
- Tactic ID and name
- Priority level
- Description of what to look for
- Scoring rubric (0-5 criteria)

**Constraints to Check**: Each constraint with:
- Rule statement
- Valid exceptions
- What to look for

**Code to Evaluate**: The actual code

**Output Format**: Structured JSON with scores and reasoning

### Scoring Calibration

The calibration file provides explicit rubrics for each tactic:

**Example** (encapsulate-state tactic):
- Score 5: "All fields private with underscore prefix, all have public getters, no public setters"
- Score 3: "Some encapsulation but multiple fields directly public or missing getters"
- Score 1: "All fields public, no encapsulation"

The LLM matches observed code against these criteria to assign scores.

## Pattern Score Calculation

Each pattern evaluated produces a pattern score:

```
pattern_score = (tactics_score × 0.7) + (constraints_score × 0.3)

where:
  tactics_score = weighted average of tactic scores
  constraints_score = 5 if all passed, 0 if any failed
```

**Rationale**:
- Tactics are continuous quality measures (70%)
- Constraints are pass/fail gates (30%)
- Both matter, but tactics dominate since most code passes constraints

If multiple patterns evaluated, overall score is average of pattern scores.

## Acting on Results

### High-Priority Actions

**Fix Constraint Violations First**
- These are hard requirements
- May indicate correctness issues
- Usually quick to fix

**Address Low-Scoring Critical Tactics**
- Core pattern elements
- Biggest quality impact
- Often architectural decisions

### Medium-Priority Actions

**Improve Important Tactics**
- Enhance code organization
- Better encapsulation
- Clearer structure

### Low-Priority Actions

**Consider Optional Tactics**
- Context-dependent improvements
- Performance optimizations
- Enhanced readability

### Iterative Improvement

After making changes:
1. Re-run evaluation
2. Verify scores improved
3. Check no regressions occurred
4. Repeat for remaining issues

## Common Patterns

### Evaluating Generated Code

**Use Case**: Claude Code just generated new code, verify quality

**Workflow**:
1. Save generated code to file
2. Run evaluation with applicable patterns
3. Review scores and recommendations
4. If score < 4.0, ask Claude to address low-scoring tactics
5. Re-evaluate after improvements

### Auditing Existing Code

**Use Case**: Assess existing codebase against patterns

**Workflow**:
1. Identify files to evaluate
2. Determine which patterns apply
3. Run evaluation on each file or directory
4. Aggregate scores to find problem areas
5. Prioritize refactoring based on scores

### Pattern Validation

**Use Case**: Test if new pattern definition works correctly

**Workflow**:
1. Create pattern and calibration files
2. Find 3-5 code examples (good and bad)
3. Run evaluation on examples
4. Verify scores align with your quality assessment
5. Adjust rubrics if scores don't match expectations

### Pre-Commit Quality Gate

**Use Case**: Block commits that violate patterns

**Workflow**:
1. Run evaluation in pre-commit hook
2. Fail commit if score < threshold (e.g., 3.5)
3. Display recommendations to developer
4. Allow commit only after improvements

## Configuration Options

### Evaluation Config

**code**: The code to evaluate (as string)

**codePath**: Path to code file or directory (optional, enables deterministic checks)

**patterns**: Array of pattern objects to evaluate against

**calibrations**: Array of calibration objects with scoring rubrics

**checkDeterministic**: Enable/disable deterministic checks

**checkLLMJudge**: Enable/disable LLM-based evaluation

**llmModel**: Which model to use (default: claude-sonnet-4-5)

**llmApiKey**: API key for LLM service

**multiPassCount**: Number of evaluation passes for consistency (default: 3)

### Typical Configurations

**Fast Feedback** (development):
- checkDeterministic: false
- checkLLMJudge: true
- multiPassCount: 1

**Thorough Evaluation** (CI/CD):
- checkDeterministic: true
- checkLLMJudge: true
- multiPassCount: 3

**Deterministic Only** (pre-commit):
- checkDeterministic: true
- checkLLMJudge: false

## Output Format

### Evaluation Result Structure

**task_id**: Unique identifier for this evaluation

**timestamp**: When evaluation ran

**code_path**: Path to evaluated code

**patterns_used**: Which pattern versions were applied

**deterministic**: Results from deterministic checks

**llm_judge**: Array of LLM judge results (one per pattern)

**overall_score**: Aggregated final score

**recommendations**: Prioritized list of improvements

### Example Result

A typical evaluation result shows:
- Overall score: 4.2/5.0
- Deterministic checks: All passing
- Tactics score: 3.8/5.0
- Three critical tactics needing improvement
- All constraints passing

This indicates solid code with some refinement opportunities.

## Troubleshooting

### Scores Seem Too High/Low

**Issue**: Calibration rubrics may not match your quality standards

**Solution**: Adjust rubrics in calibration file to be more/less strict

### Inconsistent Scores Across Passes

**Issue**: LLM giving different scores each run

**Solution**:
- Increase multiPassCount (5 or 7)
- Refine rubrics to be more explicit
- Check if code is edge case for pattern

### Missing Tactic Scores

**Issue**: Some tactics scored 0 (not applicable)

**Solution**: Verify pattern applies to this code type. Some tactics are context-dependent.

### Constraint False Positives

**Issue**: Constraint fails but exception should apply

**Solution**: Verify exception is listed in constraint definition. LLM checks exceptions.

## Best Practices

**Evaluate Early**: Run evaluation as soon as code is generated

**Focus on Trends**: One low score isn't necessarily bad. Look for patterns across evaluations.

**Use Deterministic Checks**: They're fast and catch obvious issues

**Trust Critical Tactics**: Low scores on critical tactics usually indicate real problems

**Iterate**: Make improvements incrementally, re-evaluate after each change

**Calibrate Expectations**: Not all code will score 5.0. Aim for > 4.0 on average.

**Document Edge Cases**: When code legitimately violates pattern, document why

**Evolve Patterns**: Use evaluation results to inform pattern improvements

## Integration Points

### With Benchmarking

Evaluation powers benchmarking by providing consistent scoring across pattern versions.

### With Pattern Evolution

Evaluation results inform which tactics need clearer guidance or better rubrics.

### With Development Workflow

Evaluation can be integrated at multiple points:
- During development (immediate feedback)
- Pre-commit (quality gate)
- CI/CD (automated checks)
- Code review (objective assessment)

## Next Steps

- [Benchmarking Guide](benchmarking.md) - Measure pattern effectiveness over time
- [Pattern Authoring Guide](pattern-authoring.md) - Create new patterns and calibrations
- [Framework Overview](framework-overview.md) - Understand overall architecture
