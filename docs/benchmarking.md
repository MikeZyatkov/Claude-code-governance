# Benchmarking Guide

## Purpose

Benchmarks measure whether changes to patterns, calibrations, or prompts improve code generation quality. They provide objective data to answer:

- Does pattern v2 produce better code than v1?
- Do refined calibration rubrics better distinguish quality?
- Does improved CLAUDE.md guidance lead to higher scores?
- Is the new version more consistent across tasks?

## Core Concept

**Benchmark = Standard Task + Evaluation = Measurable Quality Score**

1. Define a standard coding task
2. Generate code using current patterns/prompts
3. Evaluate generated code using evaluation framework
4. Save results with version metadata
5. Repeat with new patterns/prompts
6. Compare scores to measure improvement

## Repository Structure

```
benchmarks/
├── tasks/                      # Task definitions (what to build)
│   ├── create-aggregate.md
│   ├── add-command-handler.md
│   ├── implement-query.md
│   └── refactor-anemic-model.md
│
├── golden/                     # Optional reference implementations
│   ├── create-aggregate/
│   │   └── Booking.aggregate.ts
│   └── add-command-handler/
│       └── CancelBookingCommandHandler.ts
│
├── results/                    # Evaluation results by run
│   ├── 2025-01-15-baseline/
│   │   ├── run-config.json    # Which pattern/prompt version used
│   │   └── task-results.json  # Scores for each task
│   └── 2025-01-16-v2-test/
│       ├── run-config.json
│       └── task-results.json
│
└── runner.ts                   # Benchmark execution script
```

## Task Definition Format

Each task is a markdown file containing:

### Required Sections

**Context**: Background information about the system being built

**Requirements**: Specific functional requirements the code must satisfy

**Business Rules**: Domain invariants and constraints that must be enforced

**Patterns to Apply**: Which patterns should guide the implementation

**Success Criteria**: Minimum scores and checks that must pass

### Task Characteristics

**Realistic**: Based on actual development work, not toy examples

**Focused**: Tests specific pattern aspects (aggregate creation, command handling, etc.)

**Measurable**: Clear success criteria linked to evaluation framework

**Repeatable**: Same task yields comparable results across runs

**Representative**: Covers common development scenarios

## Golden References (Optional)

Golden references are manually-written, high-quality implementations of benchmark tasks.

### When to Use Golden References

- You have existing high-quality code to serve as baseline
- You want to measure similarity/coverage between generated and reference
- Pattern is mature and you have clear examples of excellence

### When to Skip Golden References

- Pattern is new and best practices are still emerging
- You only care about absolute scores, not comparison to specific implementation
- Maintaining reference code is too time-intensive

### What Golden References Provide

- **Baseline comparison**: How close is generated code to expert implementation?
- **Coverage checking**: Did generated code include all necessary components?
- **Structure validation**: Does generated code follow similar organization?
- **Alternative evaluation**: Supplement scoring with similarity metrics

## Benchmark Run Configuration

Each benchmark run is captured with complete metadata:

### Run Identifier
- Unique name (e.g., "baseline", "v2-test", "strict-scoring")
- Timestamp for tracking history
- Optional git commit hash for reproducibility

### Pattern Versions
- Which pattern versions were used
- Which calibration versions were used
- Pattern source location (file path or URL)

### Environment
- LLM model used (claude-sonnet-4-5, etc.)
- Evaluation configuration (multipass count, deterministic checks enabled)
- Prompt source (CLAUDE.md version)

### Results Storage
- Individual task scores and evaluations
- Aggregate metrics across all tasks
- Raw outputs for manual review

## Comparison Methodology

### Metrics to Compare

**Overall Score Change**
- Average score across all tasks
- Direction and magnitude of change
- Statistical significance

**Per-Tactic Scores**
- Which tactics improved?
- Which tactics regressed?
- Are critical tactics scoring higher?

**Consistency**
- Standard deviation of scores
- More consistent = more reliable pattern
- Fewer outlier low scores

**Pass Rate**
- Percentage of tasks meeting success criteria
- Constraint violation frequency
- Deterministic check pass rate

**Efficiency**
- Generation time per task
- Token usage
- Cost per task

### Comparison Output Format

For each task:
- Score delta (before → after)
- Visual indicator (✅ improved, ⚠️ regressed, ➡️ unchanged)
- Breakdown by tactic category (critical, important, optional)

Summary across all tasks:
- Average score change
- Tasks improved vs regressed count
- Recommendation (adopt new version or keep current)

## Workflow

### 1. Establish Baseline

Run benchmarks with current patterns/calibrations to establish baseline scores. This is your reference point for all future comparisons.

### 2. Make Changes

Modify patterns, calibrations, or prompts based on hypothesis about improvement.

### 3. Run Benchmark

Execute same tasks with new versions. Use identical tasks and evaluation config for fair comparison.

### 4. Compare Results

Analyze score changes to determine if changes improved quality.

### 5. Decide

- **Improvement**: Promote new version to production
- **Regression**: Investigate why, revert or iterate
- **Mixed**: Analyze per-task to understand trade-offs

### 6. Iterate

Use findings to inform next round of improvements.

## Implementation Phases

### Phase 1: Manual Benchmarks

**Best for**: Getting started, validating concept

**Process**:
1. Select a task from benchmarks/tasks/
2. Manually prompt Claude Code with task + pattern
3. Save generated code
4. Run evaluation framework on output
5. Record score and observations
6. Repeat with modified pattern/prompt
7. Compare scores manually

**Pros**: No automation needed, full control, easy to start
**Cons**: Time-intensive, manual comparison, human error risk

### Phase 2: Semi-Automated

**Best for**: Regular use, pattern evolution

**Process**:
1. Script loads task definitions
2. Script prompts you to generate code
3. You use Claude Code manually
4. Script automatically evaluates output
5. Script saves results with metadata
6. Script compares runs and generates report

**Pros**: Automated evaluation and comparison, consistent scoring
**Cons**: Still requires manual generation step

### Phase 3: Fully Automated

**Best for**: CI/CD integration, large-scale testing

**Process**:
1. Script uses Claude Code API programmatically
2. All tasks generated automatically
3. All evaluations run automatically
4. Results stored in database
5. Comparison reports generated
6. Alerts on regression

**Pros**: Complete automation, scalable, CI integration
**Cons**: Requires API access, more complex infrastructure

## Best Practices

### Start Small
Begin with 3-5 representative tasks covering different pattern aspects. Expand as framework matures.

### Maintain Task Quality
Periodically review tasks to ensure they remain relevant and challenging as patterns evolve.

### Version Everything
Track exact versions of patterns, calibrations, and prompts for reproducibility.

### Regular Benchmarking
Run benchmarks before promoting pattern changes to production. Treat like unit tests for patterns.

### Document Decisions
When choosing between versions, document rationale. Future you will appreciate context.

### Track Trends
Look for patterns across multiple benchmark runs. One regression might be noise, consistent trends are signal.

### Calibrate Expectations
Not every change will improve scores. Sometimes clarity improves (better descriptions) without score change.

### Use for Learning
Benchmark failures teach you about pattern gaps and LLM limitations. Investigate surprising results.

## Success Metrics

A good benchmark suite should:

- Cover 80% of common development tasks
- Run in < 30 minutes (semi-automated)
- Detect 90%+ of pattern regressions
- Provide actionable feedback on what to fix
- Enable confident pattern evolution decisions

## Integration with Framework

Benchmarks integrate with other framework components:

**Patterns**: Define what to test against
**Calibrations**: Define how to score results
**Evaluation Framework**: Executes scoring
**Documentation**: Informs pattern refinement

Together, they create a feedback loop:
```
Pattern → Generate Code → Benchmark → Identify Gaps → Improve Pattern
```

This continuous improvement cycle ensures patterns evolve based on empirical evidence rather than intuition.
