# Distribution Strategy: Claude Code Plugin

## Overview

Claude Code's plugin system (announced October 2025) provides the perfect distribution mechanism for the governance framework. Instead of npm packages or git submodules, teams can install the entire framework with a single command:

```bash
/plugin marketplace add essensys/claude-patterns
/plugin install governance-framework
```

This document outlines how to transform the governance framework into a first-class Claude Code plugin.

---

## The Problem Solved

### Before: Multiple Distribution Challenges

**NPM Package Approach:**
- Requires npm install + configuration
- Separate tooling for agents vs. patterns
- No integration with Claude Code workflow
- Manual updates

**Git Submodule Approach:**
- Complex setup for non-git experts
- Version management issues
- No native Claude Code integration
- Hard to discover

**Custom CLI Approach:**
- Requires learning new commands
- Not integrated with Claude Code
- Maintenance overhead
- Adoption friction

### After: Single Plugin Install

**Plugin Approach:**
- One command installation: `/plugin install governance-framework`
- Native Claude Code integration
- Auto-updates via plugin system
- Discoverable via marketplace
- Hooks enable autonomous workflows

---

## Plugin Architecture

### Directory Structure

```
claude-code-governance/
├── .claude-plugin/
│   ├── plugin.json                    # Plugin manifest
│   └── marketplace.json                # Marketplace configuration
│
├── agents/                             # Specialized sub-agents
│   ├── autonomous-implementer/
│   │   ├── agent.yaml
│   │   └── prompts/
│   │       ├── generation.md
│   │       ├── evaluation.md
│   │       └── correction.md
│   ├── pattern-advisor/
│   │   ├── agent.yaml
│   │   └── prompts/
│   ├── code-reviewer/
│   │   ├── agent.yaml
│   │   └── prompts/
│   └── refactoring-agent/
│       ├── agent.yaml
│       └── prompts/
│
├── commands/                           # Slash commands
│   ├── implement-with-patterns.md
│   ├── evaluate-code.md
│   ├── orchestrate.md
│   ├── pattern-gaps.md
│   └── validate-all.md
│
├── hooks/                              # Workflow hooks
│   ├── inject-patterns-hook.js        # Before code generation
│   ├── evaluate-hook.js                # After code generation
│   └── auto-correct-hook.js            # Autonomous correction
│
├── mcp-server/                         # Optional MCP integration
│   ├── index.js
│   └── tools/
│       ├── pattern-search.js
│       ├── calibration-examples.js
│       └── evaluation-runner.js
│
├── patterns/                           # Pattern definitions (existing)
├── calibration/                        # Scoring rubrics (existing)
└── evaluation/                         # Evaluation framework (existing)
```

### Plugin Manifest

```json
// .claude-plugin/plugin.json
{
  "name": "governance-framework",
  "version": "1.0.0",
  "description": "Autonomous implementation with organizational pattern enforcement",
  "author": "essensys",
  "homepage": "https://github.com/essensys/claude-code-governance",
  "repository": "https://github.com/essensys/claude-code-governance",

  "agents": [
    {
      "name": "autonomous-implementer",
      "path": "agents/autonomous-implementer",
      "description": "Self-improving implementation loop with pattern enforcement"
    },
    {
      "name": "pattern-advisor",
      "path": "agents/pattern-advisor",
      "description": "Recommends applicable patterns for features"
    },
    {
      "name": "code-reviewer",
      "path": "agents/code-reviewer",
      "description": "Reviews code against organizational patterns"
    },
    {
      "name": "refactoring-agent",
      "path": "agents/refactoring-agent",
      "description": "Refactors code to match patterns"
    }
  ],

  "commands": [
    {
      "name": "implement-with-patterns",
      "path": "commands/implement-with-patterns.md",
      "description": "Implement feature with autonomous pattern enforcement"
    },
    {
      "name": "evaluate-code",
      "path": "commands/evaluate-code.md",
      "description": "Evaluate code against organizational patterns"
    },
    {
      "name": "orchestrate",
      "path": "commands/orchestrate.md",
      "description": "Plan multi-pattern implementation with phases"
    },
    {
      "name": "pattern-gaps",
      "path": "commands/pattern-gaps.md",
      "description": "Detect missing or incomplete pattern usage"
    },
    {
      "name": "validate-all",
      "path": "commands/validate-all.md",
      "description": "Run all pattern validations"
    }
  ],

  "hooks": [
    {
      "name": "inject-patterns",
      "type": "user-prompt-submit",
      "path": "hooks/inject-patterns-hook.js",
      "enabled": true,
      "description": "Inject pattern context before code generation"
    },
    {
      "name": "evaluate-generated-code",
      "type": "tool-result",
      "path": "hooks/evaluate-hook.js",
      "enabled": true,
      "description": "Evaluate generated code against patterns"
    },
    {
      "name": "auto-correct",
      "type": "tool-result",
      "path": "hooks/auto-correct-hook.js",
      "enabled": false,
      "description": "Automatically fix pattern violations (autonomous mode)"
    }
  ],

  "mcp_servers": [
    {
      "name": "pattern-database",
      "command": "node",
      "args": ["mcp-server/index.js"],
      "description": "Access patterns, calibrations, and evaluation tools",
      "optional": true
    }
  ],

  "configuration": {
    "patterns": {
      "type": "multiselect",
      "description": "Which patterns to enforce",
      "default": ["ddd-aggregates-v1", "cqrs-v1", "domain-events-v1"],
      "options": [
        "ddd-aggregates-v1",
        "value-objects-v1",
        "domain-events-v1",
        "event-sourcing-v1",
        "repository-v1",
        "cqrs-v1",
        "projectors-v1",
        "domain-services-v1",
        "application-architecture-v1",
        "infrastructure-api-v1",
        "error-handling-v1",
        "testing-v1"
      ]
    },
    "auto_correct": {
      "type": "boolean",
      "description": "Enable autonomous pattern correction",
      "default": false
    },
    "min_score": {
      "type": "number",
      "description": "Minimum acceptable pattern score (0-5)",
      "default": 4.0,
      "min": 0,
      "max": 5
    },
    "max_attempts": {
      "type": "number",
      "description": "Maximum auto-correction attempts",
      "default": 3,
      "min": 1,
      "max": 5
    },
    "evaluation_mode": {
      "type": "select",
      "description": "When to evaluate code",
      "default": "on-write",
      "options": ["on-write", "on-demand", "disabled"]
    }
  }
}
```

### Marketplace Configuration

```json
// .claude-plugin/marketplace.json
{
  "name": "essensys Claude Patterns",
  "description": "Official marketplace for essensys architecture patterns and governance tools",
  "author": "essensys AI Transformation Team",
  "url": "https://github.com/essensys/claude-patterns",

  "plugins": [
    {
      "name": "governance-framework",
      "description": "Complete governance framework with autonomous implementation",
      "version": "1.0.0",
      "path": ".",
      "tags": ["patterns", "ddd", "cqrs", "governance", "autonomous"],
      "category": "Development Workflow"
    }
  ],

  "categories": [
    "Development Workflow",
    "Code Quality",
    "Architecture Patterns"
  ]
}
```

---

## Plugin Components

### 1. Agents

Specialized sub-agents that perform specific tasks.

**Autonomous Implementer** (`agents/autonomous-implementer/agent.yaml`):
```yaml
name: Autonomous Implementer
description: |
  Self-improving implementation loop that generates code, evaluates against
  patterns, and auto-corrects violations until all requirements are met.

instructions: |
  You are an autonomous implementation agent that executes multi-task
  implementation plans while enforcing organizational patterns.

  For each task in the plan:
  1. Generate code following the specified patterns
  2. Self-evaluate against pattern framework
  3. If score < 4.0, analyze issues and generate correction plan
  4. Apply corrections and re-evaluate (max 3 attempts)
  5. Verify requirements are met
  6. Check cross-task integration

  At the end:
  - Provide complete implementation with all tasks
  - Pattern compliance report
  - Requirements checklist
  - Recommendation for human review

tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep

model: claude-sonnet-4
```

**Pattern Advisor** (`agents/pattern-advisor/agent.yaml`):
```yaml
name: Pattern Advisor
description: |
  Analyzes feature requirements and recommends applicable organizational
  patterns with implementation guidance.

instructions: |
  Analyze the user's feature request and recommend applicable patterns.

  Process:
  1. Understand the feature requirements
  2. Identify relevant patterns from the framework
  3. Consider pattern dependencies and conflicts
  4. Generate implementation phases
  5. Provide specific guidance for each pattern

  Available patterns: DDD Aggregates, Value Objects, Domain Events,
  Event Sourcing, Repository, CQRS, Projectors, Domain Services,
  Application Architecture, Infrastructure & API, Error Handling, Testing

tools:
  - Read
  - Glob

model: claude-sonnet-4
```

### 2. Slash Commands

**`/implement-with-patterns`** (`commands/implement-with-patterns.md`):
```markdown
# Implement with Patterns

Execute implementation plan with autonomous pattern enforcement.

## Usage

/implement-with-patterns --plan=<plan-file> [--auto-correct]

## Arguments

- `--plan=<file>`: Path to implementation plan YAML
- `--auto-correct`: Enable autonomous correction loop (optional)
- `--patterns=<list>`: Override patterns to enforce (optional)

## Example

/implement-with-patterns --plan=user-registration.yaml --auto-correct

## What it does

1. Loads implementation plan
2. For each task:
   - Generates code following patterns
   - Evaluates against pattern framework
   - Auto-corrects if enabled and score < 4.0
3. Verifies cross-task integration
4. Provides final compliance report

## Output

- All implemented files
- Pattern scores per file
- Requirements checklist
- Recommendation for human review
```

**`/orchestrate`** (`commands/orchestrate.md`):
```markdown
# Orchestrate Multi-Pattern Implementation

Generate phased implementation plan with pattern recommendations.

## Usage

/orchestrate <feature-description> [--patterns=<list>] [--constraints=<list>]

## Arguments

- `feature-description`: Natural language description of feature
- `--patterns=<list>`: Specific patterns to use (optional)
- `--constraints=<list>`: Requirements like "eventual", "audit", "concurrent" (optional)

## Example

/orchestrate "order management with inventory updates" --constraints=eventual,audit

## What it does

1. Analyzes feature requirements
2. Recommends applicable patterns
3. Resolves pattern dependencies
4. Generates implementation phases
5. Creates task breakdown with acceptance criteria

## Output

- Recommended pattern combination
- Phased implementation plan
- Task list with dependencies
- Warnings about complexity or conflicts
```

### 3. Hooks

**Pattern Injection Hook** (`hooks/inject-patterns-hook.js`):
```javascript
/**
 * Runs before Claude processes user prompts
 * Injects organizational pattern context
 */
module.exports = async function injectPatternsHook({ prompt, context }) {
  const fs = require('fs').promises
  const path = require('path')

  // Check if this is an implementation task
  const isImplementation = /implement|create|add|build/i.test(prompt)
  if (!isImplementation) {
    return { prompt }
  }

  // Load active patterns from config
  const config = await loadPluginConfig()
  const patterns = await loadPatterns(config.patterns)

  // Inject pattern context
  const enhancedPrompt = `
${prompt}

ORGANIZATIONAL PATTERNS - Follow these architecture patterns:

${patterns.map(pattern => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pattern: ${pattern.pattern_name} ${pattern.version}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Goal: ${pattern.goal}

Critical tactics (MUST implement):
${pattern.tactics
  .filter(t => t.priority === 'critical')
  .map(t => `✓ ${t.name}: ${t.description}`)
  .join('\n')}

Important tactics (SHOULD implement):
${pattern.tactics
  .filter(t => t.priority === 'important')
  .map(t => `• ${t.name}: ${t.description}`)
  .join('\n')}

Constraints (MUST NOT violate):
${pattern.constraints.map(c => `✗ ${c.rule}`).join('\n')}

`).join('\n')}

Reference examples from codebase:
${await loadCalibrationExamples(patterns)}

Generate code following these patterns exactly.
`

  return { prompt: enhancedPrompt }
}

async function loadPluginConfig() {
  // Load from .claude/config.json or use defaults
  return {
    patterns: ['ddd-aggregates-v1', 'cqrs-v1', 'domain-events-v1'],
    min_score: 4.0
  }
}

async function loadPatterns(patternIds) {
  // Load from patterns/ directory
  const patterns = []
  for (const id of patternIds) {
    const yaml = await fs.readFile(`patterns/${id}.yaml`, 'utf8')
    patterns.push(parseYAML(yaml))
  }
  return patterns
}
```

**Evaluation Hook** (`hooks/evaluate-hook.js`):
```javascript
/**
 * Runs after Claude generates code
 * Evaluates against organizational patterns
 */
module.exports = async function evaluateHook({ toolName, toolInput, toolResult }) {
  // Only evaluate code-writing tools
  if (!['Write', 'Edit'].includes(toolName)) {
    return { toolResult }
  }

  const { evaluateCode } = require('../evaluation/dist')
  const config = await loadPluginConfig()

  // Extract code from tool input
  const code = toolInput.content || getCodeFromEdit(toolInput)
  const filePath = toolInput.file_path

  // Load patterns and calibrations
  const patterns = await loadPatterns(config.patterns)
  const calibrations = await loadCalibrations(config.patterns)

  // Evaluate
  const evaluation = await evaluateCode({
    code,
    codePath: filePath,
    patterns,
    calibrations,
    checkDeterministic: false,  // Skip deterministic for now
    checkLLMJudge: true,
    multiPassCount: 1  // Single pass for speed
  })

  // Format results
  const scoreEmoji = evaluation.overall_score >= 4.5 ? '🟢' :
                     evaluation.overall_score >= 4.0 ? '🟡' : '🔴'

  const enhancedResult = `
${toolResult}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Pattern Evaluation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Score: ${evaluation.overall_score}/5.0 ${scoreEmoji}

${evaluation.llm_judge.map(p => `
${p.pattern_name}: ${p.overall_pattern_score}/5.0
  ${p.constraints_passed ? '✅' : '❌'} Constraints: ${p.constraint_checks.filter(c => c.status === 'PASS').length}/${p.constraint_checks.length} passed
  Tactics: ${p.tactic_scores.filter(t => t.score >= 4).length}/${p.tactic_scores.filter(t => t.score >= 0).length} excellent
`).join('\n')}

${evaluation.overall_score >= 4.0 ?
  '✅ Code meets organizational pattern requirements!' :
  `
⚠️ Issues Found:
${evaluation.recommendations.slice(0, 3).join('\n')}

💡 Enable auto-correction: /plugin configure governance-framework --auto-correct=true
`}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

  return { toolResult: enhancedResult }
}
```

**Auto-Correction Hook** (`hooks/auto-correct-hook.js`):
```javascript
/**
 * Runs after evaluation if enabled
 * Automatically fixes pattern violations
 */
module.exports = async function autoCorrectHook({
  toolName,
  toolInput,
  toolResult,
  evaluation
}) {
  const config = await loadPluginConfig()

  // Only run if auto-correction is enabled
  if (!config.auto_correct) {
    return { toolResult }
  }

  // Only correct if score is below threshold but fixable
  if (evaluation.overall_score >= config.min_score ||
      evaluation.overall_score < 2.0) {
    return { toolResult }
  }

  console.log('🔧 Auto-correcting pattern violations...')

  const filePath = toolInput.file_path
  let correctedCode = toolInput.content
  let attempt = 0

  while (attempt < config.max_attempts) {
    // Generate correction plan using LLM
    const corrections = await generateCorrectionPlan(evaluation, correctedCode)

    // Apply corrections
    correctedCode = await applyCorrections(correctedCode, corrections)

    // Re-evaluate
    const newEvaluation = await evaluateCode({
      code: correctedCode,
      patterns: await loadPatterns(config.patterns),
      calibrations: await loadCalibrations(config.patterns)
    })

    if (newEvaluation.overall_score >= config.min_score) {
      // Success! Update the file
      await fs.writeFile(filePath, correctedCode)

      console.log(`✅ Auto-correction successful (${attempt + 1} attempts)`)

      return {
        toolResult: `
${toolResult}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Auto-Correction Applied
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Original Score: ${evaluation.overall_score}/5.0
New Score: ${newEvaluation.overall_score}/5.0 ⬆️ +${(newEvaluation.overall_score - evaluation.overall_score).toFixed(1)}

Fixes Applied:
${corrections.map(c => `✓ ${c.description}`).join('\n')}

Attempts: ${attempt + 1}/${config.max_attempts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      }
    }

    attempt++
  }

  // Failed to fix
  console.log(`⚠️ Auto-correction failed after ${config.max_attempts} attempts`)
  return {
    toolResult: `
${toolResult}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Auto-Correction Failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Unable to meet pattern requirements after ${config.max_attempts} attempts.
Current Score: ${evaluation.overall_score}/5.0
Target Score: ${config.min_score}/5.0

Please review and fix manually.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
  }
}
```

---

## User Workflows

### Workflow 1: Basic Pattern Enforcement (Entry Level)

**Goal:** Get pattern feedback without autonomous correction

```bash
# Install plugin
/plugin marketplace add essensys/claude-patterns
/plugin install governance-framework

# Configure (hooks enabled by default, auto-correct disabled)
/plugin configure governance-framework
  [x] Pattern injection
  [x] Code evaluation
  [ ] Auto-correction

# Use Claude Code normally
User: "Create a User aggregate with invite method"

Claude: [Generates code with pattern context injected]

# Automatic evaluation shown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Pattern Evaluation
Overall Score: 4.2/5.0 🟡
DDD Aggregates: 4.2/5.0
  ✅ Constraints: 5/6 passed
  ⚠️ Issue: Missing event handler registration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Developer fixes manually
User: "Fix the missing event handler registration"
Claude: [Fixes and re-evaluates]

# New evaluation
Overall Score: 4.8/5.0 🟢
✅ Code meets all pattern requirements!
```

### Workflow 2: Autonomous Implementation (Advanced)

**Goal:** Full autonomous implementation with auto-correction

```bash
# Enable auto-correction
/plugin configure governance-framework --auto-correct=true

# Plan feature
User: "/orchestrate order-cancellation --patterns=ddd,cqrs,events"

Claude: "Here's a 5-task implementation plan:
  1. Add cancelOrder() to Order aggregate
  2. Create OrderCancelled event
  3. Create CancelOrderCommandHandler
  4. Create RefundService
  5. Update InventoryProjector

  Ready to implement autonomously?"

# Autonomous execution
User: "Yes, implement it"

Claude: [Executes all 5 tasks with auto-correction]

🔨 Task 1/5: Add cancelOrder() method
  ✓ Generated (Score: 4.2)
  ✅ Complete

🔨 Task 2/5: Create OrderCancelled event
  ✓ Generated (Score: 5.0)
  ✅ Complete

🔨 Task 3/5: Create command handler
  ✗ Generated (Score: 3.8) - Business logic in handler
  🔧 Auto-correcting...
  ✓ Fixed (Score: 4.5)
  ✅ Complete (2 attempts)

🔨 Task 4/5: Create RefundService
  ✓ Generated (Score: 4.3)
  ✅ Complete

🔨 Task 5/5: Update projector
  ✓ Generated (Score: 4.6)
  ✅ Complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Implementation Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tasks: 5/5 completed
Pattern Score: 4.4/5.0
Auto-corrections: 2 applied
Time: 65 minutes
Human involvement: 0 minutes

Ready for your review!
```

### Workflow 3: Pattern Discovery & Adoption

**Goal:** Learn which patterns to use

```bash
# Get pattern recommendations
User: "I need to build user authentication with JWT"

User: "/pattern-advisor user authentication with JWT and refresh tokens"

Claude: [Pattern Advisor agent analyzes]

"Recommended patterns:

1. DDD Aggregates v1 - User aggregate for auth state
   Why: Encapsulates authentication business logic and invariants

2. Value Objects v1 - Token value objects
   Why: JWT and refresh tokens should be immutable with validation

3. Domain Services v1 - AuthenticationService
   Why: Authentication coordinates multiple aggregates (User, Session)

4. Error Handling v1 - Authentication failures
   Why: Auth has many failure modes that need clear domain errors

5. CQRS v1 - LoginCommandHandler, RefreshTokenCommandHandler
   Why: Commands for auth actions, queries for session validation

Implementation sequence:
  Phase 1: Domain model (User aggregate, Token value objects)
  Phase 2: Auth service (AuthenticationService)
  Phase 3: Command handlers (Login, Refresh, Logout)

Would you like me to generate the implementation plan?"

# Generate detailed plan
User: "Yes"

Claude: [Creates detailed implementation plan with 8 tasks]

# Execute autonomously
User: "/implement-with-patterns --plan=auth-plan.yaml --auto-correct"
```

### Workflow 4: Pattern Gap Analysis

**Goal:** Identify missing patterns in existing code

```bash
User: "/pattern-gaps src/"

Claude: [Scans codebase]

"Analyzing codebase for pattern usage...

Found patterns:
  ✅ DDD Aggregates (15 files)
      src/domain/user/User.aggregate.ts (4.5/5.0)
      src/domain/order/Order.aggregate.ts (4.8/5.0)
      ...

  ✅ Domain Events (8 events)
  ✅ CQRS Commands (12 handlers)
  ⚠️  CQRS Queries (0 handlers) - Missing query side!
  ❌ Projectors (0 found) - You have events but no projectors
  ⚠️  Error Handling (inconsistent) - 45% compliance

Pattern Gaps Detected:

1. Missing Query Side (Critical)
   - You have command handlers but no query handlers
   - Recommendation: Add query handlers for read operations
   - Affected: User, Order, Occupier domains

2. Missing Projectors (Important)
   - These events have no projectors:
     • UserCreated
     • OrderCreated
     • InventoryReserved
   - Recommendation: Create read model projectors

3. Inconsistent Error Handling (Important)
   - Some files use DomainError, others use generic Error
   - Recommendation: Standardize on error-handling-v1 pattern

Would you like me to:
  a) Generate implementation plan to fill gaps
  b) Refactor existing code to patterns
  c) Show detailed pattern compliance report"
```

---

## Installation & Setup

### For Team Leads

**1. Set up marketplace:**
```bash
# Clone or fork repository
git clone https://github.com/essensys/claude-code-governance.git
cd claude-code-governance

# Create plugin structure
mkdir -p .claude-plugin
# Create plugin.json and marketplace.json (see above)

# Push to GitHub
git add .claude-plugin/
git commit -m "Add Claude Code plugin configuration"
git push
```

**2. Share with team:**
```bash
# Single command for team members
/plugin marketplace add essensys/claude-patterns
/plugin install governance-framework
```

**3. Configure for organization:**
```bash
# Set organization defaults
/plugin configure governance-framework
  Patterns: ddd-aggregates-v1, cqrs-v1, domain-events-v1
  Auto-correct: false (opt-in per developer)
  Min score: 4.0
  Evaluation: on-write
```

### For Developers

**1. Install plugin:**
```bash
/plugin marketplace add essensys/claude-patterns
/plugin install governance-framework

# Verify installation
/plugin list
# ✓ governance-framework (v1.0.0)
#   4 agents, 5 commands, 3 hooks
```

**2. Start with basic mode:**
```bash
# Auto-correct disabled, just get feedback
/plugin configure governance-framework --auto-correct=false

# Use Claude Code normally, get pattern feedback
# When comfortable, enable autonomous mode
/plugin configure governance-framework --auto-correct=true
```

**3. Use slash commands:**
```bash
/orchestrate "my feature"           # Plan implementation
/implement-with-patterns --plan=... # Execute autonomously
/evaluate-code src/domain/User.ts   # Check single file
/pattern-gaps src/                  # Find missing patterns
/validate-all                       # Run all validations
```

---

## Benefits

### ✅ Distribution & Discovery
- **One-command install** for entire team
- **Discoverable** via marketplace
- **Version management** built-in
- **Auto-updates** via plugin system

### ✅ Native Integration
- **Hooks enable autonomous workflow** (pattern injection, evaluation, correction)
- **Agents as first-class citizens** in Claude Code
- **Slash commands** for common operations
- **No custom tooling needed**

### ✅ Adoption & Scaling
- **Familiar plugin interface** (like VSCode extensions)
- **Toggle on/off** per project
- **Gradual rollout** (enable auto-correct when ready)
- **Team standardization** (everyone uses same patterns)

### ✅ Developer Experience
- **Transparent** (see all evaluations and corrections)
- **Configurable** (per-project settings)
- **Non-intrusive** (disable hooks if needed)
- **Educational** (learn patterns through feedback)

---

## Migration Path

### Phase 1: Create Plugin Structure (1 week)
- Create `.claude-plugin/plugin.json` manifest
- Create `.claude-plugin/marketplace.json`
- Package existing agents as plugin agents
- Create slash command files
- Test local installation

### Phase 2: Implement Hooks (2 weeks)
- Implement pattern injection hook
- Implement evaluation hook
- Implement auto-correction hook
- Test hook integration
- Document hook behavior

### Phase 3: MCP Server (Optional, 1 week)
- Create MCP server for pattern database
- Expose tools: pattern-search, calibration-examples, evaluation-runner
- Test MCP integration
- Document MCP capabilities

### Phase 4: Public Release (1 week)
- Push to GitHub
- Create marketplace
- Write documentation
- Create video tutorials
- Announce to team

**Total: 4-5 weeks**

---

## Competitive Advantage

### vs. NPM Packages
- **NPM:** Requires npm install, separate tooling, no Claude integration
- **Plugin:** One command, native integration, hooks enable automation

### vs. Git Submodules
- **Submodules:** Complex setup, version management issues, no integration
- **Plugin:** Simple install, auto-updates, native hooks

### vs. Custom Tools
- **Custom:** Separate CLI, learning curve, maintenance overhead
- **Plugin:** Built into Claude Code, familiar interface, maintained by Anthropic

### First-Mover Advantage
- **Early adopter** of Claude Code plugin system (announced Oct 2025)
- **Reference implementation** for enterprise governance
- **Community building** around pattern marketplace
- **Brand association** with Claude Code ecosystem

---

## Success Metrics

### Adoption Metrics
- **Installations:** Target 100+ in first 3 months
- **Active users:** 70%+ of installations actively using
- **Retention:** 90%+ retention after 30 days

### Usage Metrics
- **Auto-correct adoption:** 50%+ enable after 2 weeks
- **Command usage:** Avg 10+ slash commands per user per week
- **Pattern compliance:** 4.0+ average score across team

### Quality Metrics
- **Bug reduction:** 25%+ fewer pattern-related bugs
- **Review time:** 30%+ faster code reviews
- **Onboarding:** 50%+ faster new developer productivity

### Community Metrics
- **GitHub stars:** Target 500+ in first year
- **Contributions:** 10+ external contributors
- **Forks:** 50+ organizations adapt for their needs

---

## Next Steps

1. **Review this distribution strategy** with team
2. **Create plugin manifest files** (.claude-plugin/)
3. **Implement basic hooks** (inject, evaluate)
4. **Test locally** with pilot users
5. **Publish to marketplace** when ready
6. **Iterate based on feedback**

---

**Document Version:** 1.0
**Created:** 2025-10-10
**Author:** AI Transformation Team
**Status:** Draft - Pending Approval
**Next Review:** After Phase 0 completion