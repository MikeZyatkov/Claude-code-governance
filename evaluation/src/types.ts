/**
 * Core types for the evaluation framework
 */

export type Priority = 'critical' | 'important' | 'optional'
export type EvaluationType = 'deterministic' | 'llm_judge'

export interface ScoringRubric {
  5: string
  4: string
  3: string
  2: string
  1: string
  0: string
}

export interface Tactic {
  name: string
  priority: Priority
  description: string
  scoring_rubric: ScoringRubric
}

export interface Constraint {
  rule: string
  description: string
  exceptions: string[]
  evaluation: EvaluationType
}

export interface Pattern {
  pattern_name: string
  version: string
  domain: string
  goal: string
  guiding_policy: string
  tactics: Tactic[]
  constraints: Constraint[]
  related_patterns?: string[]
  anti_patterns?: Array<{
    name: string
    description: string
  }>
  examples_from_codebase?: {
    good?: string[]
    needs_improvement?: string[]
  }
  references?: string[]
}

export interface TacticScore {
  tactic_name: string
  priority: Priority
  score: number
  reasoning: string
}

export interface ConstraintCheck {
  constraint_rule: string
  status: 'PASS' | 'FAIL' | 'EXCEPTION_ALLOWED'
  reasoning: string
  exception_used?: string
}

export interface LLMJudgeResult {
  pattern_name: string
  pattern_version: string
  tactic_scores: TacticScore[]
  constraint_checks: ConstraintCheck[]
  tactics_score: number // Weighted average
  constraints_passed: boolean
  overall_pattern_score: number
  reasoning: string
}

export interface DeterministicResult {
  tests_passing: boolean
  linter_score: number
  type_check_passing: boolean
  security_issues: string[]
  constraint_violations: Array<{
    constraint: string
    violation: string
  }>
}

export interface EvaluationResult {
  task_id: string
  timestamp: string
  code_path: string
  patterns_used: Record<string, string> // pattern_name -> version
  deterministic: DeterministicResult
  llm_judge: LLMJudgeResult[]
  overall_score: number
  recommendations: string[]
}

export interface EvaluationConfig {
  code: string
  codePath?: string
  patterns: Pattern[]
  checkDeterministic: boolean
  checkLLMJudge: boolean
  llmModel?: string
  llmApiKey?: string
  multiPassCount?: number // For consistency (default: 3)
}

export interface CalibrationExample {
  pattern_name: string
  code: string
  expected_score: number
  tactic_scores: Record<string, number>
  description: string
}