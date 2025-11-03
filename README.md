# Claude Code Governance Framework

**Pattern-based governance framework for AI code generation**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/MikeZyatkov/claude-code-governance)

## What is it?

A Claude Code plugin that brings **Governance-Driven Development (GDD)** to AI-assisted coding. GDD means your architecture patterns guide code generation, while automated evaluation enforces standards through quality gates.

It encodes your architectural standards as versioned patterns (YAML), guides AI to generate compliant code, and automatically enforces quality through LLM-as-judge evaluation and fix loops.

**Your architecture patterns become executable governance** - Claude generates code following your tactics, scores it against calibrated rubrics, and iteratively fixes issues until it passes quality gates.

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
- ✅ **Versioned architectural patterns** - 12 patterns as YAML definitions
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

**Note:** Steps 2-5 use specialised Claude Code Skills (automation workflows) that run automatically - you don't need to understand them to use the framework.

### Pattern-Based Evaluation

Each pattern defines:
- **Goal** - Strategic challenge it solves
- **Guiding Policy** - Overall approach to achieving the goal
- **Tactics** - Specific actions with priorities (critical/important/optional)
- **Constraints** - MUST/MUST NOT rules
- **Calibrated rubrics** - 0-5 scoring criteria for each tactic

Example tactics (from included DDD Aggregates pattern - you can define any tactics for your architecture):
- `encapsulate-state` (critical) - All state private with _ prefix
- `apply-via-events` (critical) - Mutations via applyChange() only
- `validate-before-events` (important) - Check invariants before events

Code is scored against these rubrics, weighted by priority (critical=3.0, important=2.0, optional=1.0).

**Framework is pattern-agnostic** - The included 12 patterns focus on hexagonal architecture with DDD/CQRS/Event Sourcing, but you can add patterns for Clean Architecture, microservices, or your own team conventions.

### What Outputs Look Like

**Generated Plan** (`docs/{feature}/plan.md`):
- **Pattern Compliance** - Which patterns apply and why they matter
- **Key Tactics** - Critical/important actions to follow during implementation
- **Layer Designs** - Public interfaces (inputs/outputs) in pseudo-code for domain, application, and infrastructure layers
- **Test Strategy** - Given-When-Then scenarios for each component

The plan focuses on **contracts, not implementation details** - detailed enough for AI to generate compliant code, manageable in size for thorough developer review, and clear enough to spot misalignment before coding starts.

**Review Report** (from `/review:hex-arc`):
```
Overall Score: 4.2/5.0

DDD Aggregates v1 - Score: 4.0/5.0
├─ encapsulate-state (critical): 3/5
│  Problem: Fields 'companyName' and 'adminEmail' lack _ prefix
│  Required: All state private with _ prefix, public getters only
│
├─ apply-via-events (critical): 5/5
│  ✓ All mutations go through applyChange()
│
└─ validate-before-events (important): 3/5
   Problem: activate() doesn't check if tenant already active
   Required: Validate business rules before emitting events

Event Sourcing v1 - Score: 4.4/5.0
└─ register-event-handlers (critical): 4/5
   Problem: Missing handler registration for TenantSuspended event
```

**What Happens on Quality Gate Failure:**
- Automatic fix loop initiates (max 3 iterations)
- Detailed fix prompts generated from review issues
- Code re-reviewed after each fix attempt
- User intervention requested if score doesn't improve or max iterations reached

## Requirements

- **Claude Code CLI** installed and authenticated
- **Git repository** initialised
- **docs/ directory** for artifacts (requirements, plans, audit logs - created automatically)
- **Any language/framework** - included patterns use TypeScript/Node.js examples, but framework is language-agnostic

## Two Approaches to Use It

**Automated:** `/orchestrate` runs full implementation lifecycle with automatic quality gates

**Manual:** `/implement` + `/review` for each layer, giving you full control over each step

<details>
<summary><b>See detailed workflows</b></summary>

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

</details>

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

### ⚠️ Post-Installation Configuration Required

**After installation, you MUST configure IAM permissions** to enable autonomous skill orchestration.

Without this configuration, you'll be prompted for approval 20-30+ times during orchestration, defeating the purpose of automation.

**📖 [Complete Post-Installation Guide](./post-install-configuration.md)**

**Quick Setup (1 minute):**

Edit `~/.claude/settings.json` and add:

```json
{
  "iam": {
    "allow": [
      "Skill(claude-code-governance:*)"
    ]
  }
}
```

Then restart Claude Code.

**Why this is needed:** The `/orchestrate:hex-arc` command coordinates multiple skills (implementation → review → quality gate → fix → commit). Each skill invocation requires approval by default. This configuration whitelists all plugin skills for seamless autonomous execution.

See the [full configuration guide](./post-install-configuration.md) for detailed instructions, security considerations, and troubleshooting.

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

**12 patterns for hexagonal architecture:**

- **Domain:** DDD Aggregates, Value Objects, Domain Events, Event Sourcing, Repository
- **Application:** CQRS, Domain Services, Projectors, Ports and Adapters
- **Infrastructure:** Infrastructure API
- **Core:** Error Handling, Testing

Each pattern is versioned (v1, v2, ...) and includes calibrated scoring rubrics.

**Extensible:** Add your own patterns for different architectures (Clean, Onion, microservices) or team-specific conventions. See [Contributing](#contributing) for pattern authoring guide.

## When NOT to Use This

This framework adds structure and governance, which may not fit every context:

- **Rapid prototyping** - When architecture needs to evolve freely without constraints
- **Simple CRUD applications** - Overhead may outweigh benefits for straightforward data operations
- **No established standards** - Framework enforces patterns you define; teams without architectural conventions should establish them first
- **Exploratory projects** - Early-stage projects where you're still discovering the right architecture

Best suited for: Production systems, team environments, and projects with clear architectural requirements.

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
