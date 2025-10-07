# Claude Code Governance Framework

**Strategy-driven architecture patterns and evaluation framework for AI-assisted development**

## 🎯 Purpose

This repository provides:

1. **Architecture Patterns** - Codified best practices using a strategy-driven framework (goal → guiding policy → tactics → constraints)
2. **Evaluation Framework** - Assess AI-generated code quality using deterministic checks + LLM-as-judge
3. **Custom Agents** - Specialized Claude Code agents for pattern advice, code review, and refactoring
4. **Slash Commands** - Custom commands for pattern evaluation and analysis

## 🏗️ Repository Structure

```
claude-code-governance/
├── patterns/              # Architecture patterns (YAML definitions)
│   ├── core/             # Always-applied (error handling, security, logging)
│   ├── domain/           # DDD patterns (aggregates, entities, value objects)
│   ├── application/      # Application layer (CQRS, event sourcing)
│   └── infrastructure/   # Infrastructure patterns (repositories, adapters)
│
├── calibration/          # Scoring rubrics for evaluation (separate from patterns)
│   ├── ddd-aggregates/   # v1-scoring.yaml with tactic scoring rubrics
│   └── cqrs/             # v1-scoring.yaml with tactic scoring rubrics
│
├── evaluation/           # Code evaluation framework
│   └── src/
│       ├── deterministic/ # AST analysis, linting checks
│       └── llm-judge/     # LLM-based pattern evaluation
│
├── benchmarks/           # Standard tasks for testing pattern effectiveness
├── agents/               # Custom Claude Code agents
├── commands/             # Custom slash commands
└── docs/                 # Framework documentation
```

## 📦 Installation

### As NPM Package (Recommended for multiple teams)

```bash
npm install @essensys/claude-patterns --save-dev
```

### As Git Submodule (For single project)

```bash
git submodule add https://github.com/essensys/claude-code-governance.git .claude-patterns
```

## 🚀 Quick Start

### 1. Using Patterns for Code Generation

Add to your project's `CLAUDE.md`:

```markdown
## Architecture Patterns

Follow patterns from @essensys/claude-patterns:
- [DDD Aggregates v1](https://github.com/essensys/claude-code-governance/blob/main/patterns/domain/ddd-aggregates/v1.yaml)
- [CQRS v1](https://github.com/essensys/claude-code-governance/blob/main/patterns/application/cqrs/v1.yaml)
```

Then prompt Claude Code:

```
Implement a new "UpdateOccupier" feature following:
- DDD Aggregates (v1)
- CQRS (v1)

Requirements: ...
```

### 2. Evaluating Generated Code

```typescript
import { evaluateCode } from '@essensys/claude-patterns/evaluation'
import { dddAggregatesV1, cqrsV1 } from '@essensys/claude-patterns/patterns'

const result = await evaluateCode({
  code: generatedCode,
  patterns: [dddAggregatesV1, cqrsV1],
  checkDeterministic: true,
  checkLLMJudge: true
})

console.log(`Overall Score: ${result.overall_score}/5`)
console.log(`Tactics Score: ${result.llm_judge.tactics_score}/5`)
console.log(`Constraints Passed: ${result.llm_judge.constraints_passed}`)
```

## 📚 Pattern Framework

Patterns and scoring are separated for clarity:

### Pattern Structure
```yaml
pattern_name: "Pattern Name"
version: "v1"

goal: |
  Strategic challenge this pattern addresses

guiding_policy: |
  Overall approach to achieving the goal

tactics:
  - id: "stable-tactic-identifier"  # Stable ID for linking to scoring
    name: "Specific implementation action"
    priority: critical|important|optional
    description: "What to do"

constraints:
  - rule: "MUST/MUST NOT statement"
    exceptions: ["Valid exception cases"]
    evaluation: "deterministic|llm_judge"
```

### Calibration Structure
```yaml
# calibration/{pattern-name}/v1-scoring.yaml
pattern_ref:
  name: "Pattern Name"
  version: "v1"

tactic_scoring:
  - tactic_id: "stable-tactic-identifier"  # Links to tactic by ID
    scoring_rubric:
      5: "Excellent implementation"
      3: "Acceptable implementation"
      1: "Poor implementation"
```

**Why separate?** Patterns focus on "what to do" for both generation and evaluation, while calibrations define "how to score" only for evaluation. This keeps patterns clean and allows scoring to evolve independently.

## 📊 Available Patterns

| Pattern | Version | Domain | Status |
|---------|---------|--------|--------|
| DDD Aggregates | v1 | Domain | ✅ Production |
| CQRS | v1 | Application | ✅ Production |
| Application Architecture | v1 | Application | ✅ Production |
| Infrastructure & API | v1 | Infrastructure | ✅ Production |
| Testing | v1 | Testing | ✅ Production |
| Error Handling | v1 | Core | 🚧 Coming Soon |
| Security | v1 | Core | 🚧 Coming Soon |
| Logging | v1 | Core | 🚧 Coming Soon |

## 🧪 Evaluation Methodology

### Deterministic Checks
- ✅ Unit tests passing
- ✅ Linting compliance
- ✅ Type checking
- ✅ AST-based constraint validation
- ✅ Security scans

### LLM-as-Judge Scoring
- **Tactics**: 0-5 score per tactic using calibration rubrics (weighted by priority)
- **Constraints**: PASS/FAIL/EXCEPTION_ALLOWED
- **Consistency**: Multiple passes with median aggregation
- **Linkage**: Tactic IDs ensure scoring rubrics match pattern tactics

### Score Aggregation

```
tactics_score = Σ(tactic_score × weight) / Σ(weight)
  where weight = {critical: 3.0, important: 2.0, optional: 1.0}

pattern_score = (tactics_score × 0.7) + (constraints_passed × 0.3)

overall_score = (deterministic × 0.3) + (Σ(pattern_scores) × 0.7)
```

## 🔄 Pattern Evolution

Patterns and calibrations are versioned for evolutionary tracking:

```bash
# Update pattern
cp patterns/domain/ddd-aggregates/v1.yaml patterns/domain/ddd-aggregates/v2.yaml
cp calibration/ddd-aggregates/v1-scoring.yaml calibration/ddd-aggregates/v2-scoring.yaml
# Edit v2.yaml and v2-scoring.yaml with improvements

# Test impact
npm run evaluate -- --pattern=ddd-aggregates-v1 --benchmark=all
npm run evaluate -- --pattern=ddd-aggregates-v2 --benchmark=all

# Compare results
npm run pattern-diff v1 v2
```

**Best Practice**: Change one pattern at a time to measure impact clearly. You can also refine just the scoring rubrics in calibration files without changing the pattern itself.

## 🤖 Custom Agents

### Pattern Advisor
```bash
claude-code /pattern-advisor "Implement user authentication with JWT"
```
Suggests applicable patterns based on task description.

### Code Reviewer
```bash
claude-code /review-against-patterns --files=src/
```
Reviews code against active patterns, provides score and suggestions.

### Refactoring Agent
```bash
claude-code /refactor-to-pattern --pattern=ddd-aggregates-v1 --file=User.ts
```
Refactors code to match specified pattern.

## 📖 Documentation

- [Framework Overview](docs/framework-overview.md)
- [Pattern Authoring Guide](docs/pattern-authoring.md)
- [Evaluation Guide](docs/evaluation-guide.md)
- [Benchmarking Guide](docs/benchmarking.md)

## 🧑‍💻 Contributing

### Adding New Patterns

1. Create pattern file: `patterns/{category}/{pattern-name}/v1.yaml`
2. Define all fields: goal, guiding_policy, tactics (with stable IDs), constraints
3. Create calibration file: `calibration/{pattern-name}/v1-scoring.yaml`
4. Add scoring rubrics (0-5 scale with explicit criteria) linked to tactic IDs
5. Specify constraint evaluation method
6. Test on existing codebase examples
7. Submit PR with pattern + calibration + test results

### Pattern Review Checklist

- [ ] Goal clearly states strategic challenge
- [ ] Guiding policy provides conceptual framework
- [ ] All tactics have stable IDs, priorities, and clear descriptions
- [ ] Calibration file exists with scoring rubrics for all tactic IDs
- [ ] Constraints have exceptions listed
- [ ] Evaluation method specified (deterministic vs LLM)
- [ ] Tested on ≥3 real codebase examples
- [ ] Related patterns and anti-patterns documented

## 🔬 Theoretical Foundation

This framework synthesizes:

1. **Richard Rumelt's Strategy Kernel** - Diagnosis → Guiding Policy → Coherent Actions
2. **Systems Thinking** - Constraints, feedback loops, leverage points
3. **Formal Methods** - Explicit constraints with exceptions, checkable invariants

## 📈 Roadmap

**Phase 1: Foundation** (Current)
- [x] Framework design
- [x] DDD Aggregates pattern
- [x] CQRS pattern
- [ ] Evaluation harness implementation
- [ ] Deterministic checkers

**Phase 2: Core Patterns**
- [ ] Error handling pattern
- [ ] Security pattern
- [ ] Logging pattern
- [ ] Repository pattern

**Phase 3: Advanced Evaluation**
- [ ] LLM-as-judge implementation
- [ ] Calibration examples
- [ ] Benchmark task suite
- [ ] A/B testing framework

**Phase 4: Tooling**
- [ ] Custom Claude Code agents
- [ ] Slash commands
- [ ] CI/CD integration
- [ ] Dashboard for tracking scores

## 📄 License

UNLICENSED - Internal use only at essensys

---

**Maintained by**: essensys AI Transformation Team
**Version**: 1.0.0
**Last Updated**: 2025-10-03