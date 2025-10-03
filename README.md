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
├── evaluation/           # Code evaluation framework
│   └── src/
│       ├── deterministic/ # AST analysis, linting checks
│       └── llm-judge/     # LLM-based pattern evaluation
│
├── calibration/          # Pre-scored code examples for judge calibration
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

Each pattern follows this structure:

```yaml
pattern_name: "Pattern Name"
version: "v1"

goal: |
  Strategic challenge this pattern addresses

guiding_policy: |
  Overall approach to achieving the goal

tactics:
  - name: "Specific implementation action"
    priority: critical|important|optional
    scoring_rubric:
      5: "Excellent implementation"
      3: "Acceptable implementation"
      1: "Poor implementation"

constraints:
  - rule: "MUST/MUST NOT statement"
    exceptions: ["Valid exception cases"]
    evaluation: "deterministic|llm_judge"
```

## 📊 Available Patterns

| Pattern | Version | Domain | Status |
|---------|---------|--------|--------|
| DDD Aggregates | v1 | Domain | ✅ Production |
| CQRS | v1 | Application | ✅ Production |
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
- **Tactics**: 0-5 score per tactic (weighted by priority)
- **Constraints**: PASS/FAIL/EXCEPTION_ALLOWED
- **Consistency**: Multiple passes with median aggregation
- **Calibration**: Pre-scored examples for anchor points

### Score Aggregation

```
tactics_score = Σ(tactic_score × weight) / Σ(weight)
  where weight = {critical: 3.0, important: 2.0, optional: 1.0}

pattern_score = (tactics_score × 0.7) + (constraints_passed × 0.3)

overall_score = (deterministic × 0.3) + (Σ(pattern_scores) × 0.7)
```

## 🔄 Pattern Evolution

Patterns are versioned for evolutionary tracking:

```bash
# Update pattern
cp patterns/domain/ddd-aggregates/v1.yaml patterns/domain/ddd-aggregates/v2.yaml
# Edit v2.yaml with improvements

# Test impact
npm run evaluate -- --pattern=ddd-aggregates-v1 --benchmark=all
npm run evaluate -- --pattern=ddd-aggregates-v2 --benchmark=all

# Compare results
npm run pattern-diff v1 v2
```

**Best Practice**: Change one pattern at a time to measure impact clearly.

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
- [Integration Instructions](docs/integration.md)
- [Custom Agents Guide](docs/agents.md)

## 🧑‍💻 Contributing

### Adding New Patterns

1. Create pattern file: `patterns/{category}/{pattern-name}/v1.yaml`
2. Define all fields: goal, guiding_policy, tactics, constraints
3. Add scoring rubrics (0-5 scale with explicit criteria)
4. Specify constraint evaluation method
5. Test on existing codebase examples
6. Submit PR with pattern + test results

### Pattern Review Checklist

- [ ] Goal clearly states strategic challenge
- [ ] Guiding policy provides conceptual framework
- [ ] All tactics have priorities and scoring rubrics
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