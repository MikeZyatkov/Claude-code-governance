# Framework Overview

## Purpose

The Claude Code Governance Framework provides a structured approach to:

1. **Define architecture patterns** using a strategy-driven format (goal → policy → tactics → constraints)
2. **Evaluate code quality** using both deterministic checks and LLM-as-judge
3. **Track pattern evolution** through versioning and A/B testing
4. **Measure improvement** by comparing scores across pattern versions

## Core Concepts

### Strategy-Driven Pattern Structure

Based on Richard Rumelt's strategy kernel (Good Strategy/Bad Strategy):

```
Goal (Diagnosis)
  ↓
Guiding Policy (Approach)
  ↓
Tactics (Coherent Actions)
  ↓
Constraints (Boundaries)
```

This creates a hierarchy that both humans and LLMs can understand:
- **Goal**: Why does this pattern exist? What problem does it solve?
- **Guiding Policy**: What's the conceptual approach?
- **Tactics**: What specific actions should be taken? (with priorities and scoring rubrics)
- **Constraints**: What are the hard rules? (with allowed exceptions)

### Bidirectional Usage

The same pattern definition is used for:

1. **Code Generation**: Claude Code reads patterns to guide implementation
2. **Code Evaluation**: LLM-as-judge uses patterns to score generated code

This ensures structural alignment - what we tell Claude to do is exactly what we evaluate.

### Evaluation Pipeline

```
Code → Deterministic Checks → LLM-as-Judge → Aggregated Score → Recommendations
         (tests, linting,        (tactics,       (weighted        (actionable
          type check)             constraints)     combination)     feedback)
```

## Pattern Priorities

Tactics have three priority levels that affect scoring weight:

- **Critical** (weight: 3.0): Core to the pattern, must be implemented well
- **Important** (weight: 2.0): Significant but some flexibility allowed
- **Optional** (weight: 1.0): Nice to have, context-dependent

## Evaluation Methodology

### Deterministic Checks (30% weight)
- Unit tests passing
- Linting compliance
- Type checking
- Security scans
- AST-based constraint validation

### LLM-as-Judge (70% weight)

For each pattern:

1. **Tactics Evaluation**:
   - Score each tactic 0-5 using explicit rubric
   - Weight by priority
   - Calculate weighted average

2. **Constraints Evaluation**:
   - Check each constraint: PASS/FAIL/EXCEPTION_ALLOWED
   - Verify exceptions are valid if used

3. **Multi-Pass Consistency**:
   - Run evaluation 3-5 times
   - Use median for tactic scores
   - Use majority vote for constraint checks

4. **Pattern Score**:
   ```
   pattern_score = (tactics_score × 0.7) + (constraints_passed × 0.3)
   ```

5. **Overall Score**:
   ```
   overall = (deterministic × 0.3) + (avg(pattern_scores) × 0.7)
   ```

## Pattern Evolution

1. **Create new version**: Copy `v1.yaml` → `v2.yaml`
2. **Modify pattern**: Update tactics, constraints, rubrics
3. **Run benchmark**: Test both versions on same tasks
4. **Compare scores**: Did v2 improve code quality?
5. **Decide**: Keep v2 or rollback to v1

**Best Practice**: Change one pattern at a time for clean attribution.

## Integration Patterns

### Option 1: NPM Package
```bash
npm install @essensys/claude-patterns --save-dev
```

Use in your project:
```typescript
import { evaluateCode, loadPattern } from '@essensys/claude-patterns'
```

### Option 2: Git Submodule
```bash
git submodule add https://github.com/essensys/claude-code-governance.git .claude-patterns
```

Reference in `CLAUDE.md`:
```markdown
Follow patterns from `.claude-patterns/patterns/`
```

### Option 3: Reference by URL
Add to `CLAUDE.md`:
```markdown
## Architecture Patterns

- [DDD Aggregates v1](https://github.com/essensys/claude-code-governance/blob/main/patterns/domain/ddd-aggregates/v1.yaml)
```

## Usage Flow

### During Development

1. **Planning Phase**: Claude Code selects applicable patterns
2. **Implementation**: Claude generates code following patterns
3. **Evaluation**: Run evaluation framework on generated code
4. **Review**: Check scores and recommendations
5. **Iterate**: Fix issues and re-evaluate

### Pattern Selection

**Core patterns** (always applied):
- Error handling
- Security
- Logging

**Context-specific patterns** (agent-selected):
- Agent analyzes task requirements
- Selects applicable patterns with reasoning
- Human reviews selection
- Implementation proceeds

### Continuous Improvement

```
Code Generation → Evaluation → Low Score → Investigate → Update Pattern → Re-evaluate
                                                          ↓
                                                    Track Improvement
```

## Benefits

### For Developers
- Clear mental model (strategy-driven)
- Explicit scoring criteria
- Actionable feedback

### For Teams
- Consistent architecture standards
- Measurable code quality
- Evolutionary improvement tracking

### For Organizations
- Scalable governance
- Knowledge preservation
- AI-assisted transformation

## Next Steps

- [Pattern Authoring Guide](pattern-authoring.md) - How to write patterns
- [Evaluation Guide](evaluation-guide.md) - How to run evaluations
- [Integration Guide](integration.md) - How to integrate with your project