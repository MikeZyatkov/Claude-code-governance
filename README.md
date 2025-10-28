# Claude Code Governance Framework

**Pattern-based governance framework for AI code generation**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/MikeZyatkov/claude-code-governance)

## What is it?

A Claude Code plugin that brings **Governance-Driven Development (GDD)** to AI-assisted coding. It encodes your architectural standards as versioned patterns (YAML), guides AI to generate compliant code, and automatically enforces quality through LLM-as-judge evaluation and fix loops.

**Your architecture patterns become executable governance** 
- Claude generates code following your tactics, scores it against calibrated rubrics, and iteratively fixes issues until it passes quality gates.

## Why use it?

### The Problem

AI coding agents excel at generating code but struggle with:
- ❌ Following complex architectural patterns consistently
- ❌ Maintaining architectural boundaries and layering
- ❌ Enforcing team-specific coding standards and conventions
- ❌ Quality assurance beyond syntax - architectural correctness matters
- ❌ Learning from past code reviews and architectural decisions

This leads to "vibe-coded" architectures that drift from your standards over time.

### The Solution

This framework provides:
- ✅ **Versioned architectural patterns** - 11+ battle-tested patterns as YAML definitions
- ✅ **Pattern-guided planning** - Generate implementation plans that reference specific tactics
- ✅ **Automated quality evaluation** - LLM-as-judge with calibrated scoring rubrics (0-5 scale)
- ✅ **Quality gates with fix loops** - Automatic fix cycles until code passes thresholds
- ✅ **Audit trails** - Track all implementations, reviews, and fixes with timestamps
- ✅ **Git commits with metrics** - Quality scores embedded in commit messages

## How it works

### High-Level Flow

```
0. Prerequisites → Create requirements document
                   (docs/{feature}/requirements.md)
                   Example: docs/tenant-onboarding/requirements.md

1. Plan → Pattern-guided implementation plan with tactics
         (docs/{feature}/plan.md)

2. Implement → Generate code following pattern tactics
               (Skills: implementation-engine)

3. Review → LLM-as-judge evaluation with scoring rubrics
            (Skills: review-engine)

4. Quality Gate → Score >= 4.5? Critical/Important tactics >= 4?
                  (Skills: quality-gate)

5a. Pass → Commit with quality metrics
           (Skills: git-ops)

5b. Fail → Fix loop (max 3 iterations) → Re-review → Gate
           (Skills: fix-coordinator)
```

### Pattern-Based Evaluation

Each pattern defines:
- **Goal** - Strategic challenge it solves
- **Guiding Policy** - Overall approach to achieving the goal
- **Tactics** - Specific actions with priorities (critical/important/optional)
- **Constraints** - MUST/MUST NOT rules
- **Calibrated rubrics** - 0-5 scoring criteria for each tactic

Example tactics from included DDD pattern:
- `encapsulate-state` (critical) - All state private with _ prefix
- `apply-via-events` (critical) - Mutations via applyChange() only
- `validate-before-events` (important) - Check invariants before events

Code is scored against these rubrics, weighted by priority (critical=3.0, important=2.0, optional=1.0).

**You can create patterns for any architectural style** 
- the framework is pattern-agnostic. The included patterns focus on hexagonal architecture with DDD/CQRS/Event Sourcing, but you can add patterns for Clean Architecture, microservices, or your own team conventions.

## Two Approaches to Use It

### Approach 1: Automated (Agentic)

**Best for:** Teams wanting full automation, consistent quality enforcement

```bash
# 0. Prerequisites: Create requirements file
# docs/tenant-onboarding/requirements.md

# 1. Create plan
/plan:hex-arc tenant-onboarding

# Note: Review the generated plan and iterate until you're satisfied.
# The plan focuses on public interfaces and execution flows (pseudo-code)
# without deep implementation details - designed to be reviewable and
# clear enough to guide implementation without overwhelming detail.

# 2. Orchestrate everything automatically
/orchestrate:hex-arc tenant-onboarding

# What happens:
# - Implements domain layer → Reviews → Fixes issues → Commits
# - Implements application layer → Reviews → Fixes issues → Commits
# - Implements infrastructure layer → Reviews → Fixes issues → Commits
# - Creates audit trail: docs/tenant-onboarding/implementation-audit.md
```

**Quality gate:** Each layer must score ≥ 4.5/5.0, all critical/important tactics ≥ 4, no constraint violations.

**Fix loops:** Up to 3 automatic fix iterations per layer before requesting user intervention.

### Approach 2: Manual Control (Human-in-the-Loop)

**Best for:** Teams wanting review control, learning the patterns, custom workflows

```bash
# 0. Prerequisites: Create requirements file
# docs/tenant-onboarding/requirements.md

# 1. Create plan
/plan:hex-arc tenant-onboarding

# Note: Review the generated plan and iterate until you're satisfied.
# The plan focuses on public interfaces and execution flows (pseudo-code)
# without deep implementation details - designed to be reviewable and
# clear enough to guide implementation without overwhelming detail.

# 2. Implement each layer manually
/implement:hex-arc tenant-onboarding domain

# Recommended: Review after each layer
/review:hex-arc tenant-onboarding

/implement:hex-arc tenant-onboarding application

# Review again
/review:hex-arc tenant-onboarding

/implement:hex-arc tenant-onboarding infrastructure

# 3. Final review
/review:hex-arc tenant-onboarding

# Returns detailed scoring:
# Overall: 4.2/5.0
# - DDD Aggregates v1: 4.0/5.0
#   • encapsulate-state (critical): 3/5 - Some fields lack _ prefix
#   • apply-via-events (critical): 5/5 - All mutations via events
# - Event Sourcing v1: 4.4/5.0
#   • register-event-handlers (critical): 4/5 - Missing one handler

# 4. You decide: fix manually or run fixes
```

You control when to commit, what to fix, and how to iterate.

## Installation

### Option 1: Via Marketplace (Recommended)

```bash
# Add the marketplace
/plugin marketplace add https://github.com/MikeZyatkov/claude-code-governance

# Install the plugin
/plugin install claude-code-governance
```

### Option 2: Direct Installation

```bash
/plugin install https://github.com/MikeZyatkov/claude-code-governance
```

### Verify Installation

```bash
# Available commands should include:
# - /plan:hex-arc
# - /implement:hex-arc
# - /review:hex-arc
# - /orchestrate:hex-arc
```

## Quick Start

```bash
# 1. Create requirements
mkdir -p docs/my-feature
# Edit docs/my-feature/requirements.md

# 2. Generate plan
/plan:hex-arc my-feature

# 3. Choose your approach:

# Automated:
/orchestrate:hex-arc my-feature

# OR Manual:
/implement:hex-arc my-feature domain
/review:hex-arc my-feature
```

## Included Patterns

**11+ battle-tested patterns for hexagonal architecture:**

- **Domain:** DDD Aggregates, Value Objects, Domain Events, Event Sourcing, Repository
- **Application:** CQRS, Domain Services, Projectors, Ports and Adapters
- **Infrastructure:** Infrastructure API
- **Core:** Error Handling, Testing

Each pattern is versioned (v1, v2, ...) and includes calibrated scoring rubrics.

**Extensible:** Add your own patterns for different architectures (Clean, Onion, microservices) or team-specific conventions. See [Contributing](#contributing) for pattern authoring guide.

## License

MIT License - See [LICENSE](./LICENSE)

Free to use, modify, and distribute. Attribution appreciated!

## Contributing

Contributions welcome! Add new patterns, improve commands, or enhance documentation.

### Adding Patterns

1. Create pattern: `patterns/{category}/{name}/v1.yaml`
2. Create calibration: `calibration/{name}/v1-scoring.yaml`
3. Test on real code
4. Submit PR

## Support

- **Issues**: [GitHub Issues](https://github.com/MikeZyatkov/claude-code-governance/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MikeZyatkov/claude-code-governance/discussions)

---

**Maintained by**: Mikhail
**Repository**: https://github.com/MikeZyatkov/claude-code-governance
**Version**: 1.0.0
