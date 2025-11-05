---
name: pattern-loader
description: Discovers and loads governance patterns for a given domain/layer. Reads patterns from patterns/ directory and merges with calibration rubrics from calibration/ directory.
allowed-tools: Read, Glob, Bash
---

# Pattern Loader Skill

Discovers and loads governance patterns with their calibrations from the patterns directory.

## Purpose

Provides centralized pattern discovery and loading logic for all commands (plan, implement, review, orchestrate).

## File Structure

**Pattern files:** `patterns/{domain}/{pattern-name}/v1.yaml`
**Calibration files:** `calibration/{pattern-name}/v1-scoring.yaml`

**Domains:**
- `domain` - Domain modeling patterns (DDD, aggregates, entities, value objects)
- `application` - Application layer patterns (CQRS, services, use cases)
- `infrastructure` - Infrastructure patterns (repositories, adapters)
- `core` - Cross-cutting patterns (logging, error handling)

## When to Use

This skill is invoked when you need to:
- Discover available patterns for a domain (during planning)
- Load full pattern details for implementation
- Get calibrated scoring rubrics for review

## How It Works

### Context from Caller

When invoked, this skill reads context from:
1. **Domain/Layer:** From command argument or recent workflow context
2. **Pattern names (optional):** Specific patterns to load
3. **Action:** Discover (find available) vs Load (full details)

### Workflow

#### Discovering Patterns

**When:** Planning phase, or when you need to see what patterns are available

**Steps:**
1. Identify domain from context (e.g., "domain", "application", "infrastructure")
2. List pattern files in that domain:
   ```bash
   find patterns/{domain}/ -name "*.yaml" -type f
   ```
3. For each pattern file, read metadata (name, version, domain)
4. Check for calibration file:
   ```bash
   [ -f calibration/{pattern-name}/v1-scoring.yaml ] && echo "Has calibration"
   ```
5. Present list of available patterns with metadata

**Output:**
- List of pattern names
- Their domains
- File paths
- Calibration availability

---

#### Loading Pattern Details

**When:** Implementation or review phase, when you need full pattern content

**Steps:**
1. Identify which patterns to load from context
2. For each pattern:

   **a. Load pattern YAML:**
   ```bash
   cat patterns/{domain}/{pattern-name}/v1.yaml
   ```

   **b. Parse structure:**
   - pattern_name
   - version
   - domain
   - goal (what this pattern achieves)
   - guiding_policy (design principles)
   - tactics (array of tactical practices)
   - constraints (must/should rules)
   - anti_patterns (what to avoid)
   - related_patterns (related patterns)

   **c. Load calibration file (if exists):**
   ```bash
   cat calibration/{pattern-name}/v1-scoring.yaml
   ```

   **d. Parse calibration:**
   - tactic_scoring: Map of tactic_id → rubric
   - Each rubric has scores 5,4,3,2,1,0 with descriptions

   **e. Merge:**
   - Attach scoring rubric to each tactic
   - Each tactic now has its calibrated rubric for scoring

3. Present fully loaded patterns with calibrations

---

## Instructions for Claude

### Reading Context

**Domain/Layer:**
- Look for domain in recent messages: "domain layer", "application layer", "infrastructure layer"
- Map layer names to domains:
  - domain layer → "domain"
  - application layer → "application"
  - infrastructure layer → "infrastructure"
  - core utilities → "core"
- Check command arguments: `/implement:hex-arc tenant-onboarding domain`

**Pattern Names:**
- If specific patterns mentioned, load only those
- Otherwise, discover all patterns for the domain
- Common patterns:
  - domain: ddd-aggregates, value-objects, domain-events
  - application: cqrs, application-services, use-cases
  - infrastructure: repository-pattern, adapter-pattern

**Action:**
- Discover: When planning or exploring available patterns
- Load: When implementing or reviewing (need full details)
- Context will indicate which action is needed

### Discovering Patterns

**Goal:** Find what patterns are available for a domain

**Workflow:**
1. Get domain from context
2. List files: `find patterns/{domain}/ -name "*.yaml" -type f`
3. For each file:
   - Read first 20 lines to get metadata
   - Extract: pattern_name, version, domain
   - Check if calibration exists
4. Present in clear format:
   ```
   Available patterns for {domain} domain:
   1. DDD Aggregates and Entities (v1) - Has calibration
   2. Value Objects (v1) - Has calibration
   3. Domain Events (v1) - No calibration
   ```

### Loading Patterns

**Goal:** Get full pattern details with calibrations

**Workflow:**
1. Get pattern names from context
2. For each pattern:
   ```bash
   # Load pattern
   cat patterns/{domain}/{pattern-name}/v1.yaml

   # Load calibration (if exists)
   if [ -f calibration/{pattern-name}/v1-scoring.yaml ]; then
     cat calibration/{pattern-name}/v1-scoring.yaml
   fi
   ```
3. Parse YAML (use Read tool to read files)
4. Merge calibration rubrics into tactics
5. Present structure:
   - Goal: What this pattern achieves
   - Tactics: List of tactical practices (with rubrics if calibration exists)
   - Constraints: Must/Should rules
   - Examples: Code examples if available

### Error Handling

**Pattern file not found:**
- List available patterns in that domain
- Suggest correct pattern name
- Example: "Pattern 'ddd-aggregate' not found. Did you mean 'ddd-aggregates'?"

**Calibration missing:**
- Not an error (calibration is optional)
- Note: "Calibration not found, using default scoring"
- Pattern still usable without calibration

**Invalid YAML:**
- Show file path and error details
- Suggest checking YAML syntax
- Continue with other patterns if loading multiple

### Performance

**Progressive Loading:**
- For discovery: Only read file metadata (first 20 lines)
- For loading: Read full files only when needed
- Don't load all patterns at once unless requested

**Caching:**
- Once a pattern is loaded in a session, remember its content
- Don't re-read the same file multiple times
- Note when using cached data

---

## Example Workflows

### Example 1: Discover Domain Patterns

**Context:**
- Command: `/plan:hex-arc tenant-onboarding`
- Orchestrator needs to know what domain patterns are available

**Actions:**
1. Identify domain from context: "domain"
2. List files:
   ```bash
   find patterns/domain/ -name "*.yaml" -type f
   ```
   Output:
   ```
   patterns/domain/ddd-aggregates/v1.yaml
   patterns/domain/value-objects/v1.yaml
   patterns/domain/domain-events/v1.yaml
   ```
3. Read metadata from each file
4. Check calibrations
5. Present:
   ```
   Available domain patterns:
   1. DDD Aggregates and Entities (v1)
      - Goal: Model business entities as aggregates with encapsulation
      - Calibration: ✅ Available

   2. Value Objects (v1)
      - Goal: Immutable domain values with no identity
      - Calibration: ✅ Available

   3. Domain Events (v1)
      - Goal: Capture domain state changes as events
      - Calibration: ❌ Not available
   ```

---

### Example 2: Load Specific Pattern for Implementation

**Context:**
- Orchestrator implementing domain layer
- Needs full details for "ddd-aggregates" pattern

**Actions:**
1. Read pattern name from context: "ddd-aggregates"
2. Load pattern file:
   ```bash
   cat patterns/domain/ddd-aggregates/v1.yaml
   ```
3. Load calibration:
   ```bash
   cat calibration/ddd-aggregates/v1-scoring.yaml
   ```
4. Parse and merge
5. Present:
   ```
   Pattern: DDD Aggregates and Entities (v1)

   Goal: Model business entities as consistency boundaries with encapsulated state

   Tactics:
   1. encapsulate-state (CRITICAL)
      - Description: All state private with accessor methods
      - Rubric:
        5: All state private with _ prefix
        4: Most state private
        3: Some state private
        2: Little encapsulation
        1: No encapsulation

   2. apply-via-events (CRITICAL)
      - Description: State changes recorded as domain events
      - Rubric: [...]

   [...other tactics...]

   Constraints:
   - MUST: Aggregate root must be the only entry point
   - SHOULD: Use value objects for attributes
   - MUST_NOT: Reference other aggregates by object
   ```

---

### Example 3: Load Multiple Patterns for Review

**Context:**
- Orchestrator reviewing domain layer implementation
- Needs patterns for "ddd-aggregates" and "value-objects"

**Actions:**
1. Identify patterns from context
2. Load both patterns with calibrations
3. Present each pattern's full structure
4. Highlight that calibrations are available for scoring

---

## Notes

**Domain Mapping:**
- Layer names map to domains
- "domain layer" → patterns/domain/
- "application layer" → patterns/application/
- "infrastructure layer" → patterns/infrastructure/

**Calibration is Optional:**
- Patterns work without calibration
- Calibration provides detailed scoring rubrics for LLM-as-judge
- Missing calibration means using generic scoring (0-5 scale)

**YAML Parsing:**
- Use Read tool to read files
- Parse YAML structure manually or with script
- Extract key fields: goal, tactics, constraints

**Tool Restrictions:**
- This skill is read-only
- Can use: Read, Glob, Bash (for listing/reading files)
- Cannot: Write, Edit, or modify pattern files
