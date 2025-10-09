/**
 * Prompt builder for LLM-as-judge evaluation
 */

import { Pattern, Tactic, Calibration, ScoringRubric } from '../types'

export class PromptBuilder {
  buildEvaluationPrompt(code: string, pattern: Pattern, calibration: Calibration, implementationPlan?: string): string {
    const implementationPlanSection = implementationPlan ? `
## Implementation Plan (What Was Supposed to Be Implemented)

${implementationPlan}

**IMPORTANT**: Use this implementation plan to understand what was supposed to be implemented. When evaluating the code:
- Check if all planned features are actually implemented
- Verify that planned event registrations are present
- Confirm that planned methods and fields exist
- Look for any regressions or missing implementations

If the implementation plan specifies certain events should be registered, methods should exist, or specific functionality should be present, and you don't see them in the code, this is a critical issue that should result in low scores for relevant tactics.

` : ''

    return `# Code Evaluation Task

You are an expert code reviewer evaluating code against established architecture patterns.

## Pattern to Evaluate Against

**Pattern Name**: ${pattern.pattern_name} (${pattern.version})
**Domain**: ${pattern.domain}

### Goal
${pattern.goal}

### Guiding Policy
${pattern.guiding_policy}
${implementationPlanSection}
## Code to Evaluate

\`\`\`typescript
${code}
\`\`\`

## Evaluation Instructions

### Part 1: Evaluate Tactics

Score each tactic on a scale of 0-5 using the provided rubric:

${this.formatTactics(pattern.tactics, calibration)}

For each tactic, provide:
1. Score (0-5, or -1 if not applicable)
2. Brief reasoning (2-3 sentences)

**IMPORTANT**: If a tactic is not applicable to the code being evaluated (e.g., entity-related tactics when there are no child entities), use a score of **-1** and explain why it's not applicable in the reasoning. Non-applicable tactics will be excluded from scoring calculations.

Examples of non-applicable tactics:
- "Define entities within aggregate using Entity base class" when the aggregate has no child entities
- "Keep entity collections private" when there are no entity collections
- "Route child entity events" when there are no child entities

### Part 2: Evaluate Constraints

Check each constraint and determine: PASS, FAIL, or EXCEPTION_ALLOWED

${this.formatConstraints(pattern.constraints)}

For each constraint, provide:
1. Status (PASS/FAIL/EXCEPTION_ALLOWED)
2. Brief reasoning
3. If EXCEPTION_ALLOWED, specify which exception applies

## Output Format

Provide your evaluation as a JSON object with this structure:

\`\`\`json
{
  "tactic_scores": [
    {
      "tactic_name": "...",
      "score": 4,
      "reasoning": "..."
    }
  ],
  "constraint_checks": [
    {
      "constraint_rule": "...",
      "status": "PASS",
      "reasoning": "...",
      "exception_used": "..." // only if EXCEPTION_ALLOWED
    }
  ],
  "overall_reasoning": "Summary of the evaluation (2-3 sentences)"
}
\`\`\`

Be objective and precise. Focus on observable patterns in the code, not potential improvements.
`
  }

  private formatTactics(tactics: Tactic[], calibration: Calibration): string {
    return tactics.map((tactic, index) => {
      // Find scoring rubric for this tactic in calibration
      const tacticScoring = calibration.tactic_scoring.find(ts => ts.tactic_id === tactic.id)

      if (!tacticScoring) {
        throw new Error(`No scoring rubric found for tactic: ${tactic.id}`)
      }

      const rubric = tacticScoring.scoring_rubric

      return `
#### Tactic ${index + 1}: ${tactic.name}
**Priority**: ${tactic.priority}
**Description**: ${tactic.description}

**Scoring Rubric**:
- **5**: ${rubric[5]}
- **4**: ${rubric[4]}
- **3**: ${rubric[3]}
- **2**: ${rubric[2]}
- **1**: ${rubric[1]}
- **0**: ${rubric[0]}
`
    }).join('\n')
  }

  private formatConstraints(constraints: any[]): string {
    return constraints.map((constraint, index) => `
#### Constraint ${index + 1}: ${constraint.rule}
**Description**: ${constraint.description}
**Evaluation Type**: ${constraint.evaluation}
${constraint.exceptions.length > 0 ? `**Allowed Exceptions**:
${constraint.exceptions.map((e: string) => `  - ${e}`).join('\n')}` : ''}
`).join('\n')
  }

  buildCalibrationPrompt(code: string, pattern: Pattern, calibration: Calibration, calibrationExamples: any[], implementationPlan?: string): string {
    // TODO: Build prompt with calibration examples for consistency
    return this.buildEvaluationPrompt(code, pattern, calibration, implementationPlan)
  }
}
