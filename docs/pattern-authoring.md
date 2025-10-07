# Pattern Authoring Guide

## Purpose

This guide teaches you how to create new architecture patterns and calibration files for the governance framework. Well-authored patterns improve code generation quality and enable consistent evaluation.

## When to Create a Pattern

Create a new pattern when:

**Repeated Architectural Decisions**: Your team makes the same design choices across multiple features

**Quality Issues**: You notice consistent problems that a pattern could prevent

**Knowledge Preservation**: Senior developers have implicit knowledge that should be codified

**Team Scaling**: New developers need guidance on established practices

**Framework Integration**: You're adopting a library or framework that requires specific usage patterns

**Regulatory Requirements**: Compliance needs mandate certain implementation approaches

## Pattern Structure

Patterns follow the strategy-driven framework: Goal → Guiding Policy → Tactics → Constraints

### Required Fields

**pattern_name**: Descriptive name (e.g., "DDD Aggregates and Entities")

**version**: Version identifier (e.g., "v1", "v2")

**domain**: Category (e.g., "Domain-Driven Design", "Application Architecture")

**goal**: Strategic challenge this pattern addresses

**guiding_policy**: Overall approach to achieving the goal

**tactics**: Specific implementation actions (array)

**constraints**: Hard rules with exceptions (array)

### Optional Fields

**related_patterns**: Other patterns commonly used together

**anti_patterns**: Common mistakes to avoid

**examples_from_codebase**: Reference implementations

**references**: Books, articles, documentation

## Writing the Goal

The goal articulates the strategic challenge the pattern solves.

### Characteristics of Good Goals

**Problem-Focused**: Describes what goes wrong without the pattern

**Outcome-Oriented**: States desired end result

**Context-Setting**: Explains why this matters

**Specific**: Concrete enough to guide implementation

### Goal Template

"[Maintain/Ensure/Enable/Achieve] [desired outcome] within [scope]. [What happens without this pattern]. [Key challenge to overcome]."

### Examples

**Good Goal**:
"Maintain consistency boundaries and enforce business invariants within a cluster of related domain objects. Ensure that state changes are atomic, trackable, and valid according to business rules. Prevent external code from bypassing invariants by directly manipulating internal entities."

**Poor Goal**:
"Make code better organized." (Too vague, no specific challenge)

## Writing the Guiding Policy

The guiding policy explains the conceptual approach to achieving the goal.

### Characteristics of Good Policies

**Principled**: Based on established software design principles

**Coherent**: All tactics follow logically from this policy

**Actionable**: Clear enough to guide specific tactics

**Conceptual**: Describes "how we think about it" not implementation details

### Policy Template

"[Core principle]. [Main mechanism]. [Key insight that makes this work]."

### Examples

**Good Policy**:
"Define clear aggregate boundaries where one object (Aggregate Root) acts as the consistency guardian. All modifications to objects inside the aggregate must go through the root, which validates invariants before applying changes. Use event sourcing to track state changes explicitly."

**Poor Policy**:
"Use good coding practices." (Not specific enough to guide tactics)

## Writing Tactics

Tactics are specific, actionable implementation steps. Each tactic has a stable ID for linking to calibration.

### Tactic Structure

**id**: Stable identifier (kebab-case, won't change even if name/description evolves)

**name**: Clear, action-oriented description

**priority**: critical / important / optional

**description**: Detailed explanation of what to do

### Priority Guidelines

**Critical** (weight: 3.0):
- Core to the pattern
- Pattern doesn't work without it
- Violations cause significant problems
- Should score 4+ in most implementations

**Important** (weight: 2.0):
- Significant to quality
- Pattern works but suboptimally without it
- Best practices, not absolute requirements
- Should score 3+ in most implementations

**Optional** (weight: 1.0):
- Context-dependent optimization
- Nice to have but not essential
- May not apply in all cases
- Scoring varies based on use case

### Tactic ID Conventions

IDs should be:
- Descriptive of what the tactic does
- Stable (won't change when description improves)
- Unique within pattern
- Kebab-case format

**Good IDs**:
- `encapsulate-state`
- `validate-before-events`
- `use-dependency-injection`

**Poor IDs**:
- `tactic-1` (not descriptive)
- `encapsulate_state_with_private_fields` (too long, snake_case)
- `encapsulation` (too vague)

### Writing Effective Tactic Descriptions

**Be Specific**: Say exactly what to do, not just general principles

**Be Measurable**: Description should make it clear what success looks like

**Be Actionable**: Developer should know what code to write

**Provide Context**: Explain why this tactic matters

### Examples

**Good Tactic**:
```yaml
- id: "encapsulate-state"
  name: "Encapsulate state with private fields and public getters"
  priority: critical
  description: "All internal state as private fields (prefix with _), expose via public getters only"
```

**Poor Tactic**:
```yaml
- id: "encapsulation"
  name: "Use encapsulation"
  priority: important
  description: "Encapsulate things properly"
```
(Too vague, not actionable)

## Writing Constraints

Constraints are hard rules that must be satisfied. They include valid exceptions.

### Constraint Structure

**rule**: MUST/MUST NOT statement

**description**: Explanation of the constraint

**exceptions**: Array of valid exception cases

**evaluation**: "deterministic" or "llm_judge"

### Constraint Language

Use RFC 2119 keywords:
- **MUST**: Absolute requirement
- **MUST NOT**: Absolute prohibition
- **SHOULD**: Strong recommendation (but exceptions exist)

### Evaluation Method

**deterministic**: Can be checked via code analysis
- AST parsing
- Pattern matching
- Static analysis
- Examples: "No public setters", "Must use @injectable decorator"

**llm_judge**: Requires contextual understanding
- Semantic rules
- Intent-based checks
- Examples: "Aggregate root is only entry point", "Queries don't modify state"

### Documenting Exceptions

Exceptions acknowledge reality - sometimes rules have legitimate exceptions.

**Be Explicit**: List specific, valid exception cases

**Provide Rationale**: Explain why exception is acceptable

**Keep Narrow**: Don't make exceptions so broad they undermine the rule

### Examples

**Good Constraint**:
```yaml
- rule: "All state changes MUST produce domain events"
  description: "Every mutation must create and apply a domain event"
  exceptions:
    - "Event handlers registered in constructor can directly assign to private fields"
    - "Static factory() method for deserialization"
  evaluation: "llm_judge"
```

**Poor Constraint**:
```yaml
- rule: "Code should be good"
  description: "Make code good quality"
  exceptions: ["When you can't"]
  evaluation: "llm_judge"
```
(Not specific, unmeasurable exception)

## Creating Calibration Files

Calibration files define how to score each tactic. They live separately from patterns.

### File Structure

Location: `calibration/{pattern-name}/v{version}-scoring.yaml`

Example: `calibration/ddd-aggregates/v1-scoring.yaml`

### Calibration Content

**pattern_ref**: Links to pattern
- name: Pattern name (must match)
- version: Pattern version (must match)

**tactic_scoring**: Array of rubrics
- tactic_id: Links to tactic by ID
- scoring_rubric: 0-5 criteria

### Writing Scoring Rubrics

Each tactic needs a rubric defining what each score means.

**Required Scores**: 5, 4, 3, 2, 1, 0

**Score 5 (Excellent)**: Perfect implementation
- All aspects present
- Best practices followed
- No issues

**Score 4 (Good)**: Minor deviations
- Core implementation correct
- 1-2 small issues
- Still high quality

**Score 3 (Acceptable)**: Meets minimum bar
- Pattern followed but gaps exist
- Multiple minor issues or one moderate issue
- Functional but not exemplary

**Score 2 (Needs Work)**: Significant problems
- Pattern partially followed
- Major gaps
- May cause issues

**Score 1 (Poor)**: Pattern mostly ignored
- Minimal adherence
- Fundamental issues
- Likely to cause problems

**Score 0 (Not Applicable)**: Tactic doesn't apply to this code

### Rubric Writing Guidelines

**Observable**: Criteria based on what's visible in code, not intent

**Specific**: Exact conditions for each score, not vague descriptions

**Distinct**: Clear differences between adjacent scores

**Comprehensive**: Covers full range from perfect to absent

### Examples

**Good Rubric**:
```yaml
- tactic_id: "encapsulate-state"
  scoring_rubric:
    5: "All fields private with underscore prefix, all have public getters, no public setters"
    4: "Mostly encapsulated, 1-2 fields missing getters or incorrectly public"
    3: "Some encapsulation but multiple fields directly public or missing getters"
    2: "Mix of public/private with no clear pattern"
    1: "All fields public, no encapsulation"
    0: "Not applicable"
```

**Poor Rubric**:
```yaml
- tactic_id: "encapsulation"
  scoring_rubric:
    5: "Great encapsulation"
    3: "OK encapsulation"
    1: "Bad encapsulation"
    0: "None"
```
(Vague, subjective, missing scores)

## Testing Patterns

Before publishing a pattern, test it on real code.

### Testing Checklist

**1. Find Test Cases** (3-5 examples)
- Excellent implementation (expect score 4.5-5.0)
- Good implementation (expect score 4.0-4.4)
- Acceptable implementation (expect score 3.0-3.9)
- Poor implementation (expect score < 3.0)

**2. Manual Review**
- Read pattern as if you're Claude Code generating code
- Is it clear what to do?
- Are tactics actionable?
- Are priorities appropriate?

**3. Run Evaluation**
- Evaluate test cases with pattern + calibration
- Check if scores align with your expectations
- Verify reasoning makes sense

**4. Iterate**
- Adjust tactic descriptions if unclear
- Refine rubrics if scores don't match quality
- Add exceptions if constraints too strict

**5. Peer Review**
- Have teammate read pattern
- Can they understand and apply it?
- Do they agree with priorities and rubrics?

### Common Issues in Testing

**Scores Too High**: Rubrics too lenient, tighten criteria

**Scores Too Low**: Rubrics too strict, or pattern applies to wrong code type

**Inconsistent Scores**: Rubrics not specific enough, add observable criteria

**Tactics Confusing**: Descriptions too abstract, add concrete examples

**Missing Coverage**: Real code has aspects not covered by tactics, add tactics

## Pattern Versioning

Patterns evolve as you learn. Use versioning to track changes.

### When to Create a New Version

**Major Changes**:
- Add/remove tactics
- Change priorities
- Significant constraint changes
- Incompatible with previous version

**Minor Changes**:
- Clarify descriptions
- Improve rubrics
- Add exceptions
- Fix errors

### Versioning Strategy

**v1 → v2**: Major revision
- Copy pattern: `v1.yaml` → `v2.yaml`
- Copy calibration: `v1-scoring.yaml` → `v2-scoring.yaml`
- Make changes to both
- Run benchmarks to compare

**v2.1, v2.2**: Minor revisions (optional)
- Use if you want fine-grained tracking
- Most teams can skip sub-versions

**Deprecation**: When retiring old versions
- Mark as deprecated in pattern file
- Keep file for historical reference
- Update documentation to recommend new version

### Backward Compatibility

**Tactic IDs are Stable**: Don't change IDs between versions
- Add new IDs for new tactics
- Keep old IDs even if name/description changes

**Version References**: Always specify version
- In CLAUDE.md: "Follow DDD Aggregates v2"
- In evaluation: Load specific version

### Testing Pattern Evolution

Use benchmarks to validate improvements:
1. Run benchmarks with v1
2. Create v2 with changes
3. Run same benchmarks with v2
4. Compare scores to verify improvement
5. Adopt v2 if scores improve

## Pattern Organization

### Categories

Organize patterns by architectural layer:

**core**: Always-applied patterns
- Error handling
- Security
- Logging
- Testing

**domain**: Domain layer patterns
- DDD aggregates
- Domain events
- Value objects
- Domain services

**application**: Application layer patterns
- CQRS
- Use cases
- DTOs
- Mappers

**infrastructure**: Infrastructure patterns
- Repositories
- Adapters
- External integrations

### Naming Conventions

**Pattern Files**: `patterns/{category}/{pattern-name}/v{version}.yaml`

Example: `patterns/domain/ddd-aggregates/v1.yaml`

**Calibration Files**: `calibration/{pattern-name}/v{version}-scoring.yaml`

Example: `calibration/ddd-aggregates/v1-scoring.yaml`

**Pattern Names**: Clear, descriptive, conventional
- Use established terminology when possible
- Avoid acronyms unless universally known
- Be specific about scope

## Best Practices

### Start Small

Begin with 1-2 core patterns for frequently-built components. Expand as team adopts framework.

### Base on Reality

Write patterns based on actual code in your codebase, not theoretical ideals.

### Involve the Team

Patterns work best when team collaborates on them. Get input from:
- Senior developers (architectural knowledge)
- Junior developers (what's confusing?)
- Reviewers (what do they check in PRs?)

### Focus on Impact

Prioritize patterns that:
- Address frequent problems
- Improve code quality most
- Are reusable across features

### Iterate Based on Data

Use evaluation results and benchmarks to refine patterns. Let data guide evolution.

### Document Rationale

In pattern references field, note why choices were made. Future maintainers will thank you.

### Keep Patterns Focused

One pattern, one concern. Don't create mega-patterns trying to cover everything.

### Make Tactics Actionable

Every tactic should answer: "What code do I write?"

### Balance Coverage and Simplicity

Too few tactics = gaps in guidance
Too many tactics = overwhelming

Aim for 8-15 tactics per pattern.

## Common Pitfalls

**Overly Abstract Tactics**: Tactics that say "do it right" without specifics

**Arbitrary Priorities**: Marking everything critical because it seems important

**Rubric Gaps**: Big differences between score criteria, unclear where code fits

**Exception Loopholes**: Exceptions so broad they make constraints meaningless

**Untested Patterns**: Publishing without validating on real code

**Frozen Patterns**: Never updating based on learnings

**Kitchen Sink Patterns**: Trying to cover too many concerns in one pattern

## Review Checklist

Before publishing a pattern:

**Pattern Quality**:
- [ ] Goal clearly states problem and desired outcome
- [ ] Guiding policy provides coherent approach
- [ ] All tactics have stable IDs
- [ ] Tactics are specific and actionable
- [ ] Priorities reflect importance (not all critical)
- [ ] Constraints use MUST/MUST NOT language
- [ ] Exceptions are narrow and justified
- [ ] Evaluation method matches constraint type

**Calibration Quality**:
- [ ] Calibration file references correct pattern name and version
- [ ] All tactic IDs in pattern have corresponding rubrics
- [ ] All rubrics include scores 0-5
- [ ] Rubric criteria are observable and specific
- [ ] Clear distinction between adjacent scores
- [ ] No orphaned rubrics (tactic IDs not in pattern)

**Testing**:
- [ ] Tested on 3+ real code examples
- [ ] Scores align with expected quality
- [ ] Reasoning makes sense
- [ ] Peer reviewed by teammate
- [ ] Benchmarks run if comparing to previous version

**Documentation**:
- [ ] Related patterns identified
- [ ] Anti-patterns documented
- [ ] References provided
- [ ] Examples from codebase listed

## Next Steps

After creating a pattern:

1. **Test Thoroughly**: Validate on real code before broad adoption
2. **Document Usage**: Add to team documentation, CLAUDE.md references
3. **Gather Feedback**: Ask team to try pattern, collect experiences
4. **Monitor Results**: Track evaluation scores over time
5. **Iterate**: Refine based on data and feedback

## Additional Resources

- [Framework Overview](framework-overview.md) - Understand pattern philosophy
- [Evaluation Guide](evaluation-guide.md) - Test patterns on code
- [Benchmarking Guide](benchmarking.md) - Measure pattern effectiveness
