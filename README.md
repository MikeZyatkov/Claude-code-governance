# Claude Code Governance Framework

**Enterprise governance framework for hexagonal architecture with DDD, CQRS, and Event Sourcing patterns**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/MikeZyatkov/claude-code-governance)

## 🎯 Overview

A comprehensive Claude Code plugin that provides:

- **Pattern-Based Planning** - Generate implementation plans following proven architectural patterns
- **Quality Governance** - Enforce DDD/CQRS/Event Sourcing standards across your team
- **Strategy-Driven Framework** - Goal → Guiding Policy → Tactics → Constraints structure
- **11+ Battle-Tested Patterns** - Domain, Application, Infrastructure, and Core patterns

## 🚀 Quick Start

### Installation

#### Option 1: Via Marketplace (Recommended)

```bash
# Add the marketplace
/plugin marketplace add https://github.com/MikeZyatkov/claude-code-governance

# Install the plugin
/plugin install claude-code-governance
```

#### Option 2: Direct Installation

```bash
/plugin install https://github.com/MikeZyatkov/claude-code-governance
```

### First Feature Plan

```bash
# 1. Create requirements
mkdir -p docs/my-feature
# Edit docs/my-feature/requirements.md with your feature description

# 2. Generate implementation plan
/plan:hex-arc my-feature

# 3. Review generated plan
# Open docs/my-feature/plan.md
```

## 📚 What You Get

### Available Commands

#### `/plan:hex-arc <feature-name>`

Creates comprehensive implementation plans for hexagonal architecture features.

**What it generates:**
- ✅ Pattern compliance strategy
- ✅ Domain layer design (aggregates, events, value objects)
- ✅ Application layer (commands, queries, handlers, ports)
- ✅ Infrastructure layer (API, Lambda, adapters)
- ✅ Data strategy (Event Store + Read Models)
- ✅ Test strategy (Given-When-Then scenarios)
- ✅ Risk analysis and architectural decisions

#### `/implement:hex-arc <feature-name> <layer>`

Implements a specific layer based on the implementation plan.

**What it does:**
- 🔨 Implements components following the plan's design
- 🧪 Writes tests for all components
- ✅ Verifies against governance patterns
- 📝 Updates plan with implementation notes

#### `/review:hex-arc <feature-name>`

Reviews implemented code against governance patterns with automated scoring.

**What it does:**
- 🔍 Detects uncommitted changes (git diff)
- 📊 Evaluates code with LLM-as-judge scoring
- ⚖️ Checks pattern compliance (tactics + constraints)
- 📋 Generates detailed review report with improvement suggestions

#### `/orchestrate:hex-arc <feature-name> [--layers <list>] [--threshold <score>]`

**NEW!** Orchestrates the complete implementation lifecycle with automated quality gates.

**What it does:**
- 🤖 Manages implementation → review → fix cycles automatically
- 🎯 Enforces quality gates (default threshold: 4.5/5.0)
- 🔄 Runs up to 3 fix iterations per layer
- 💾 Commits each layer after passing quality gate
- 📝 Creates detailed audit trail with issue descriptions
- 👤 Pauses for user intervention only when needed

**Example usage:**
```bash
# Orchestrate all layers with default threshold (4.5)
/orchestrate:hex-arc tenant-onboarding

# Orchestrate specific layers
/orchestrate:hex-arc tenant-onboarding --layers "domain;application"

# Custom quality threshold
/orchestrate:hex-arc tenant-onboarding --threshold 4.0
```

**Quality gate criteria:**
- Overall score ≥ threshold (default: 4.5/5.0)
- No critical tactics with score < 4
- No important tactics with score < 4
- No constraint violations

### Included Patterns (11 Total)

#### Domain Patterns
- **DDD Aggregates and Entities** (v1) - Consistency boundaries and invariant enforcement
- **Value Objects** (v1) - Immutable domain types
- **Domain Events** (v1) - Business fact capture
- **Event Sourcing** (v1) - Event-based state persistence
- **Repository Pattern** (v1) - Aggregate persistence abstraction

#### Application Patterns
- **CQRS** (v1) - Command/Query separation
- **Domain Services** (v1) - Cross-aggregate coordination
- **Projectors and Read Models** (v1) - Read model maintenance
- **Ports and Adapters** (v1) - Hexagonal architecture boundaries

#### Infrastructure Patterns
- **Infrastructure API** (v1) - REST API design with AWS Lambda

#### Core Patterns
- **Error Handling** (v1) - Typed errors across layers
- **Testing** (v1) - Test strategy and best practices

## 💡 How It Works

### Workflow Option 1: Manual Control (Step-by-Step)

#### 1. Create Requirements

```markdown
# docs/tenant-onboarding/requirements.md

## Feature Description
Create a tenant registration system where companies can sign up.

## User Stories
- As a company, I want to register my organization
- As an admin, I want to validate tenant data

## Technical Requirements
- Event sourcing for audit trail
- CQRS with CreateTenant command and GetTenant query
- Projector for read model in RDS
- Integration with AWS SES for emails
```

#### 2. Generate Plan

```bash
/plan:hex-arc tenant-onboarding
```

#### 3. Review Generated Plan

The command creates `docs/tenant-onboarding/plan.md` with:

**Pattern Compliance:**
```markdown
### DDD Aggregates and Entities v1

**Why This Pattern Matters**: Tenant is the core aggregate...

**Key Tactics to Follow**:
- extend-aggregate-root: Tenant extends AggregateRoot
- encapsulate-state: All state private with public getters
- static-factory-creation: Tenant.create() validates and emits event
- apply-via-events: All mutations via applyChange()

**Constraints to Respect**:
- MUST: Aggregate root MUST be only entry point for modifications
- MUST: All state changes MUST produce domain events

**Potential Risks**:
- Risk: Direct field assignment bypasses event sourcing
  - Mitigation: Code review, all mutations call applyChange()
```

**Domain Layer Design:**
```typescript
// Domain Events (pseudo-code)
TenantCreated:
  - tenantId: string
  - companyName: string
  - adminEmail: string
  - createdAt: DateTime

// Aggregate Methods
Tenant.create(name, email) → Tenant
  // Validates, emits TenantCreated event

Tenant.activate() → void
  // Emits TenantActivated event

Tenant.isActive → boolean
```

**Plus:** Application layer, Infrastructure layer, Data strategy, Test strategy, Risk analysis

#### 4. Implement Layer-by-Layer

```bash
# Implement each layer
/implement:hex-arc tenant-onboarding domain
/implement:hex-arc tenant-onboarding application
/implement:hex-arc tenant-onboarding infrastructure
```

#### 5. Review Each Layer

```bash
# Review code quality after implementation
/review:hex-arc tenant-onboarding
```

Review provides detailed scoring and actionable feedback for improvements.

### Workflow Option 2: Automated Orchestration (Recommended)

**One command to rule them all:**

```bash
# After creating plan, orchestrate full implementation
/orchestrate:hex-arc tenant-onboarding
```

**What happens automatically:**

1. **Domain Layer:** Implement → Review → Fix issues → Commit (✅ Score: 4.6/5.0)
2. **Application Layer:** Implement → Review → Fix issues → Commit (✅ Score: 4.7/5.0)
3. **Infrastructure Layer:** Implement → Review → Fix issues → Commit (✅ Score: 4.5/5.0)

**Audit trail created:** `docs/tenant-onboarding/implementation-audit.md`

**Benefits:**
- ⚡ Fully automated quality gates
- 🔄 Automatic fix cycles (up to 3 per layer)
- 📊 Detailed audit trail with issue descriptions
- 💾 Clean git commits with quality metrics
- 🎯 Consistent quality across all layers

### Pattern Reference During Development

Reference pattern files for detailed guidance:

```bash
# Detailed guidance in YAML files
patterns/domain/ddd-aggregates/v1.yaml
patterns/application/cqrs/v1.yaml
patterns/domain/event-sourcing/v1.yaml
```

Each pattern includes:
- **Goal** - Strategic challenge it solves
- **Guiding Policy** - Overall approach
- **Tactics** - Specific actions (Critical → Important → Optional)
- **Constraints** - MUST/MUST NOT rules
- **Anti-patterns** - Common mistakes to avoid

## 🏗️ Repository Structure

```
claude-code-governance/
├── .claude-plugin/
│   ├── plugin.json              # Plugin manifest
│   └── marketplace.json         # Marketplace configuration
│
├── commands/
│   └── plan-hex-arc.md          # Planning command
│
├── patterns/                     # Pattern definitions (YAML)
│   ├── domain/                  # DDD patterns
│   ├── application/             # CQRS, Services, Projectors
│   ├── infrastructure/          # API, Adapters
│   └── core/                    # Error Handling, Testing
│
├── calibration/                 # Scoring rubrics for evaluation
│   ├── ddd-aggregates/
│   ├── cqrs/
│   └── ...
│
├── evaluation/                  # Evaluation framework (TypeScript)
│   └── src/
│       ├── evaluator.ts
│       └── types.ts
│
└── docs/                        # Framework documentation
    ├── framework-overview.md
    ├── pattern-authoring.md
    └── benchmarking.md
```

## 📖 Pattern Framework

Patterns follow a **strategy-driven structure**:

```yaml
pattern_name: "Pattern Name"
version: "v1"
domain: "Layer/Concern"

goal: |
  What strategic challenge this pattern solves

guiding_policy: |
  Overall approach to achieving the goal

tactics:
  - id: "stable-identifier"       # Stable ID for linking
    name: "Actionable tactic name"
    priority: critical | important | optional
    description: "What to do"

constraints:
  - rule: "MUST/MUST NOT statement"
    description: "Explanation"
    exceptions: ["Valid exception cases"]
    evaluation: "deterministic | llm_judge"

anti_patterns:
  - name: "Anti-pattern name"
    description: "What to avoid and why"

related_patterns:
  - "Related Pattern"

references:
  - "Book/Article reference"
```

### Why This Structure?

Based on **Richard Rumelt's Good Strategy/Bad Strategy**:

1. **Goal** (Diagnosis) - What problem are we solving?
2. **Guiding Policy** (Policy) - What's our approach?
3. **Tactics** (Coherent Actions) - What specific actions?
4. **Constraints** - What rules must we follow?

This ensures:
- ✅ Architectural consistency
- ✅ Clear rationale for decisions
- ✅ Measurable quality standards
- ✅ Team scalability

## 🎓 Example: DDD Aggregates Pattern

```yaml
goal: |
  Maintain consistency boundaries and enforce business invariants within
  a cluster of related domain objects. Ensure state changes are atomic,
  trackable, and valid according to business rules.

guiding_policy: |
  Define clear aggregate boundaries where one object (Aggregate Root)
  acts as the consistency guardian. All modifications must go through
  the root, which validates invariants before applying changes via events.

tactics:
  - id: "extend-aggregate-root"
    priority: critical
    description: "Aggregate roots extend AggregateRoot from es-aggregates"

  - id: "encapsulate-state"
    priority: critical
    description: "All state private (prefix _), expose via getters only"

  - id: "apply-via-events"
    priority: critical
    description: "All mutations via applyChange(), never direct assignment"

constraints:
  - rule: "Aggregate root MUST be only entry point for modifications"
    exceptions: []
    evaluation: "llm_judge"

  - rule: "All state changes MUST produce domain events"
    exceptions:
      - "Event handlers can assign directly to private fields"
    evaluation: "llm_judge"
```

## 🔮 Future Commands (Roadmap)

```bash
# List available patterns
/list:patterns [category]

# Run benchmarks
/benchmark:patterns

# Evaluate specific file against pattern
/evaluate:hex-arc path/to/Aggregate.ts --pattern=ddd-aggregates
```

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[MARKETPLACE.md](./MARKETPLACE.md)** - Marketplace details and all plugins
- **[PLUGIN.md](./PLUGIN.md)** - Full plugin documentation
- **[Framework Overview](./docs/framework-overview.md)** - Philosophy and architecture
- **[Pattern Authoring](./docs/pattern-authoring.md)** - Create your own patterns
- **[Benchmarking Guide](./docs/benchmarking.md)** - Measure pattern effectiveness

## 🤝 Contributing

Contributions welcome! Here's how:

### Adding New Patterns

1. Create pattern: `patterns/{category}/{name}/v1.yaml`
2. Create calibration: `calibration/{name}/v1-scoring.yaml`
3. Pattern automatically discovered by commands (dynamic discovery)
4. Test on real code
5. Submit PR

### Improving Commands

1. Fork the repository
2. Create feature branch
3. Update command in `commands/`
4. Test locally with `/plugin install /path/to/fork`
5. Submit PR

### Pattern Review Checklist

- [ ] Goal clearly states strategic challenge
- [ ] Guiding policy provides coherent approach
- [ ] All tactics have stable IDs and clear priorities
- [ ] Calibration rubrics exist for all tactics
- [ ] Constraints list exceptions explicitly
- [ ] Tested on ≥3 real code examples

## 🌟 Why Use This Framework?

### For Teams
- **Consistency** - Everyone follows same patterns
- **Quality** - Patterns encode proven best practices
- **Speed** - Generated plans reduce decision paralysis
- **Onboarding** - New developers learn patterns faster
- **Governance** - Enforce architecture standards

### For Individuals
- **Learning** - Understand DDD/CQRS/Event Sourcing deeply
- **Planning** - Comprehensive plans before coding
- **Reference** - Patterns as implementation guide
- **Quality** - Self-evaluate code against standards

## 🔬 Theoretical Foundation

Synthesizes:

1. **Richard Rumelt** - *Good Strategy/Bad Strategy* (strategy kernel)
2. **Eric Evans** - *Domain-Driven Design* (tactical patterns)
3. **Vaughn Vernon** - *Implementing Domain-Driven Design* (practical DDD)
4. **Martin Fowler** - *Patterns of Enterprise Application Architecture*
5. **Greg Young** - *CQRS and Event Sourcing*

## 📄 License

MIT License - See [LICENSE](./LICENSE)

Free to use, modify, and distribute. Attribution appreciated!

## 🙏 Credits

**Patterns based on:**
- Eric Evans - Domain-Driven Design
- Vaughn Vernon - Implementing Domain-Driven Design
- Martin Fowler - Enterprise Architecture Patterns
- Greg Young - CQRS and Event Sourcing

**Framework inspired by:**
- Richard Rumelt - Good Strategy/Bad Strategy

## 📬 Support

- **Issues**: [GitHub Issues](https://github.com/MikeZyatkov/claude-code-governance/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MikeZyatkov/claude-code-governance/discussions)
- **Documentation**: See `docs/` directory

## 🗺️ Roadmap

### v1.0.0
- [x] Pattern-based planning command
- [x] 11 architectural patterns
- [x] Dynamic pattern discovery
- [x] Comprehensive documentation

### v1.1.0 (Current)
- [x] `/implement:hex-arc` - Layer implementation command
- [x] `/review:hex-arc` - Code review with LLM-as-judge
- [x] `/orchestrate:hex-arc` - Automated implementation lifecycle
- [x] Audit trail with detailed issue tracking
- [x] Quality gates with fix cycles

### v1.2.0 (Next)
- [ ] `/list:patterns` - Pattern discovery command
- [ ] Pattern search and filtering
- [ ] Skills for common scaffolding tasks

### v2.0.0 (Future)
- [ ] Multiple architecture variants (Clean, Onion)
- [ ] Microservices patterns
- [ ] Benchmark suite
- [ ] CI/CD integration

---

**Maintained by**: Mikhail
**Version**: 1.0.0
**Repository**: https://github.com/MikeZyatkov/claude-code-governance
**Marketplace**: https://github.com/MikeZyatkov/claude-code-governance

**Get started**: `/plugin marketplace add https://github.com/MikeZyatkov/claude-code-governance`
