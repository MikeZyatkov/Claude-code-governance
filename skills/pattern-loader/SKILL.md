---
name: pattern-loader
description: Discovers and loads governance patterns with their calibrations from the patterns directory. Provides centralized pattern discovery and loading logic for all commands (plan, implement, review, orchestrate).
---

# Pattern Loader Skill

Discovers and loads governance patterns with their calibrations from the patterns directory.

## Purpose

Provides centralized pattern discovery and loading logic for all commands (plan, implement, review, orchestrate).

## Input

```json
{
  "action": "discover" | "load",
  "filter": {
    "domain": "domain" | "application" | "infrastructure" | "core",
    "pattern_names": ["ddd-aggregates", "cqrs", ...]
  }
}
```

## Output

### For "discover" action:
```json
{
  "patterns": [
    {
      "name": "DDD Aggregates and Entities",
      "version": "v1",
      "domain": "domain",
      "file_path": "patterns/domain/ddd-aggregates/v1.yaml",
      "calibration_path": "calibration/ddd-aggregates/v1-scoring.yaml"
    }
  ]
}
```

### For "load" action:
```json
{
  "patterns": [
    {
      "pattern_name": "DDD Aggregates and Entities",
      "version": "v1",
      "domain": "domain",
      "goal": "...",
      "guiding_policy": "...",
      "tactics": [
        {
          "id": "encapsulate-state",
          "name": "Encapsulate aggregate state",
          "priority": "critical",
          "description": "..."
        }
      ],
      "constraints": [
        {
          "rule": "MUST...",
          "description": "...",
          "exceptions": [],
          "evaluation": "llm_judge"
        }
      ],
      "calibration": {
        "tactic_scoring": {
          "encapsulate-state": {
            "5": "All state private with _ prefix...",
            "4": "Most state private...",
            "3": "Some state private...",
            "2": "Little encapsulation...",
            "1": "No encapsulation...",
            "0": "Not applicable or missing"
          }
        }
      }
    }
  ]
}
```

## Instructions for Claude

### Action: Discover Patterns

**Purpose:** Find available patterns, optionally filtered by domain or names.

**Steps:**

1. **List pattern files:**
```bash
find patterns/ -name "*.yaml" -type f
```

2. **Read metadata from each pattern file** (just the header):
   - pattern_name
   - version
   - domain

3. **Find corresponding calibration files:**
   - For pattern at `patterns/{domain}/{name}/v1.yaml`
   - Look for `calibration/{name}/v1-scoring.yaml`

4. **Filter if requested:**
   - If `filter.domain` specified: only include patterns from that domain
   - If `filter.pattern_names` specified: only include patterns with matching names

5. **Return JSON output** with list of discovered patterns.

### Action: Load Patterns

**Purpose:** Fully load pattern YAML and calibration files.

**Steps:**

1. **For each pattern in filter:**

2. **Load pattern YAML file:**
   - Read full file content
   - Parse YAML structure
   - Extract:
     - pattern_name
     - version
     - domain
     - goal
     - guiding_policy
     - tactics (array)
     - constraints (array)
     - anti_patterns (array)
     - related_patterns (array)

3. **Load calibration file** (if exists):
   - Read `calibration/{pattern_name}/v1-scoring.yaml`
   - Parse YAML
   - Extract `tactic_scoring` map (tactic_id → rubric)

4. **Combine pattern + calibration:**
   - Merge calibration rubrics into pattern structure
   - Each tactic gets its scoring rubric attached

5. **Return JSON output** with fully loaded patterns.

### Error Handling

**Pattern file not found:**
```json
{
  "error": "Pattern file not found",
  "path": "patterns/domain/ddd-aggregates/v1.yaml"
}
```

**Calibration file not found:**
- Not an error (calibration is optional)
- Set `calibration: null` in output

**Invalid YAML:**
```json
{
  "error": "Invalid YAML syntax",
  "file": "...",
  "details": "..."
}
```

## Usage Examples

### Example 1: Discover all domain patterns

**Input:**
```json
{
  "action": "discover",
  "filter": {
    "domain": "domain"
  }
}
```

**Command invokes this skill**, then receives:
```json
{
  "patterns": [
    {"name": "DDD Aggregates and Entities", "domain": "domain", ...},
    {"name": "Value Objects", "domain": "domain", ...},
    {"name": "Domain Events", "domain": "domain", ...}
  ]
}
```

### Example 2: Load specific patterns

**Input:**
```json
{
  "action": "load",
  "filter": {
    "pattern_names": ["ddd-aggregates", "event-sourcing"]
  }
}
```

**Command invokes this skill**, then receives fully loaded pattern objects with tactics, constraints, and calibration rubrics.

### Example 3: Discover all patterns (no filter)

**Input:**
```json
{
  "action": "discover"
}
```

**Returns all patterns from all domains.**

## Notes for Claude

**YAML Parsing:**
- Use bash tools to read files
- Parse YAML structure (look for keys and values)
- Extract nested structures (tactics array, constraints array)

**File Path Construction:**
- Patterns: `patterns/{domain}/{kebab-case-name}/{version}.yaml`
- Calibrations: `calibration/{kebab-case-name}/{version}-scoring.yaml`
- Example: `patterns/domain/ddd-aggregates/v1.yaml` → `calibration/ddd-aggregates/v1-scoring.yaml`

**Calibration Rubrics:**
- Map from tactic ID to score descriptions
- Scores: 5, 4, 3, 2, 1, 0
- Each score has description of what that level means

**Return Format:**
- Always return valid JSON
- Structure output exactly as specified
- Include all relevant fields
