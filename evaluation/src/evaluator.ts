/**
 * Main evaluator orchestrator
 * Coordinates deterministic checks and LLM-as-judge evaluation
 */

import { EvaluationConfig, EvaluationResult, DeterministicResult, LLMJudgeResult } from './types'
import { DeterministicChecker } from './deterministic/checker'
import { LLMJudge } from './llm-judge/judge'

export class CodeEvaluator {
  private deterministicChecker: DeterministicChecker
  private llmJudge: LLMJudge

  constructor() {
    this.deterministicChecker = new DeterministicChecker()
    this.llmJudge = new LLMJudge()
  }

  async evaluate(config: EvaluationConfig): Promise<EvaluationResult> {
    const taskId = this.generateTaskId()
    const timestamp = new Date().toISOString()

    // Phase 1: Deterministic checks
    let deterministicResult: DeterministicResult | null = null
    if (config.checkDeterministic) {
      console.log('Running deterministic checks...')
      deterministicResult = await this.deterministicChecker.check(
        config.code,
        config.codePath,
        config.patterns
      )
    }

    // Phase 2: LLM-as-judge evaluation
    let llmJudgeResults: LLMJudgeResult[] = []
    if (config.checkLLMJudge) {
      console.log('Running LLM-as-judge evaluation...')

      for (const pattern of config.patterns) {
        console.log(`  Evaluating against pattern: ${pattern.pattern_name} ${pattern.version}`)

        const result = await this.llmJudge.evaluatePattern(
          config.code,
          pattern,
          {
            model: config.llmModel,
            apiKey: config.llmApiKey,
            multiPassCount: config.multiPassCount || 3
          }
        )

        llmJudgeResults.push(result)
      }
    }

    // Phase 3: Aggregate scores
    const overallScore = this.calculateOverallScore(
      deterministicResult,
      llmJudgeResults
    )

    // Phase 4: Generate recommendations
    const recommendations = this.generateRecommendations(
      deterministicResult,
      llmJudgeResults
    )

    return {
      task_id: taskId,
      timestamp,
      code_path: config.codePath || 'inline',
      patterns_used: config.patterns.reduce((acc, p) => {
        acc[p.pattern_name] = p.version
        return acc
      }, {} as Record<string, string>),
      deterministic: deterministicResult || this.getDefaultDeterministicResult(),
      llm_judge: llmJudgeResults,
      overall_score: overallScore,
      recommendations
    }
  }

  private calculateOverallScore(
    deterministic: DeterministicResult | null,
    llmJudgeResults: LLMJudgeResult[]
  ): number {
    // Deterministic score (0-5 scale)
    let deterministicScore = 5
    if (deterministic) {
      deterministicScore =
        (deterministic.tests_passing ? 1.5 : 0) +
        (deterministic.linter_score / 100) * 2 +
        (deterministic.type_check_passing ? 1.5 : 0) -
        (deterministic.security_issues.length * 0.5) -
        (deterministic.constraint_violations.length * 0.3)

      deterministicScore = Math.max(0, Math.min(5, deterministicScore))
    }

    // LLM judge average score
    const llmScore = llmJudgeResults.length > 0
      ? llmJudgeResults.reduce((sum, r) => sum + r.overall_pattern_score, 0) / llmJudgeResults.length
      : 5

    // Weighted combination: deterministic 30%, LLM 70%
    const overall = (deterministicScore * 0.3) + (llmScore * 0.7)

    return Math.round(overall * 10) / 10 // Round to 1 decimal
  }

  private generateRecommendations(
    deterministic: DeterministicResult | null,
    llmJudgeResults: LLMJudgeResult[]
  ): string[] {
    const recommendations: string[] = []

    // Deterministic recommendations
    if (deterministic) {
      if (!deterministic.tests_passing) {
        recommendations.push('⚠️ Tests are failing - fix failing tests before proceeding')
      }
      if (deterministic.linter_score < 80) {
        recommendations.push(`⚠️ Linter score is low (${deterministic.linter_score}/100) - address linting issues`)
      }
      if (!deterministic.type_check_passing) {
        recommendations.push('⚠️ Type checking failed - fix TypeScript type errors')
      }
      if (deterministic.security_issues.length > 0) {
        recommendations.push(`🔒 Security issues found: ${deterministic.security_issues.join(', ')}`)
      }
      deterministic.constraint_violations.forEach(v => {
        recommendations.push(`❌ Constraint violation: ${v.constraint}`)
      })
    }

    // LLM judge recommendations
    llmJudgeResults.forEach(result => {
      // Low-scoring critical tactics
      result.tactic_scores
        .filter(t => t.priority === 'critical' && t.score < 3)
        .forEach(t => {
          recommendations.push(
            `🔴 Critical tactic needs improvement (${result.pattern_name}): ${t.tactic_name} (score: ${t.score}/5)`
          )
        })

      // Failed constraints
      result.constraint_checks
        .filter(c => c.status === 'FAIL')
        .forEach(c => {
          recommendations.push(
            `❌ Constraint violated (${result.pattern_name}): ${c.constraint_rule}`
          )
        })

      // Low overall pattern score
      if (result.overall_pattern_score < 3) {
        recommendations.push(
          `⚠️ Pattern ${result.pattern_name} overall score is low (${result.overall_pattern_score}/5) - review pattern guidelines`
        )
      }
    })

    return recommendations.length > 0
      ? recommendations
      : ['✅ Code meets all pattern requirements - excellent work!']
  }

  private getDefaultDeterministicResult(): DeterministicResult {
    return {
      tests_passing: true,
      linter_score: 100,
      type_check_passing: true,
      security_issues: [],
      constraint_violations: []
    }
  }

  private generateTaskId(): string {
    return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Convenience function for evaluating code
 */
export async function evaluateCode(config: EvaluationConfig): Promise<EvaluationResult> {
  const evaluator = new CodeEvaluator()
  return evaluator.evaluate(config)
}
