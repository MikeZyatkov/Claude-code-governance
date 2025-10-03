/**
 * LLM-as-judge evaluator
 * Uses Claude API to evaluate code against patterns
 */

import { Pattern, LLMJudgeResult, TacticScore, ConstraintCheck } from '../types'
import { PromptBuilder } from './prompt-builder'

interface JudgeOptions {
  model?: string
  apiKey?: string
  multiPassCount?: number
}

export class LLMJudge {
  private promptBuilder: PromptBuilder

  constructor() {
    this.promptBuilder = new PromptBuilder()
  }

  async evaluatePattern(
    code: string,
    pattern: Pattern,
    options: JudgeOptions = {}
  ): Promise<LLMJudgeResult> {
    const multiPassCount = options.multiPassCount || 3

    // Run multiple passes for consistency
    const passes: LLMJudgeResult[] = []

    for (let i = 0; i < multiPassCount; i++) {
      console.log(`    Pass ${i + 1}/${multiPassCount}...`)
      const result = await this.singleEvaluation(code, pattern, options)
      passes.push(result)
    }

    // Aggregate results using median
    return this.aggregateResults(passes, pattern)
  }

  private async singleEvaluation(
    code: string,
    pattern: Pattern,
    options: JudgeOptions
  ): Promise<LLMJudgeResult> {
    const prompt = this.promptBuilder.buildEvaluationPrompt(code, pattern)

    // TODO: Implement actual Claude API call
    // For now, return mock results
    console.log(`    [Mock] Evaluating with prompt length: ${prompt.length} chars`)

    return this.createMockResult(pattern)
  }

  private aggregateResults(
    passes: LLMJudgeResult[],
    pattern: Pattern
  ): LLMJudgeResult {
    // Aggregate tactic scores using median
    const tacticScores: TacticScore[] = pattern.tactics.map(tactic => {
      const scores = passes.map(p =>
        p.tactic_scores.find(t => t.tactic_name === tactic.name)?.score || 0
      )
      const medianScore = this.median(scores)

      return {
        tactic_name: tactic.name,
        priority: tactic.priority,
        score: medianScore,
        reasoning: passes[0].tactic_scores.find(t => t.tactic_name === tactic.name)?.reasoning || ''
      }
    })

    // Aggregate constraint checks using majority vote
    const constraintChecks: ConstraintCheck[] = pattern.constraints.map(constraint => {
      const statuses = passes.map(p =>
        p.constraint_checks.find(c => c.constraint_rule === constraint.rule)?.status || 'FAIL'
      )
      const majorityStatus = this.mode(statuses)

      return {
        constraint_rule: constraint.rule,
        status: majorityStatus,
        reasoning: passes[0].constraint_checks.find(c => c.constraint_rule === constraint.rule)?.reasoning || ''
      }
    })

    // Calculate aggregate scores
    const tacticsScore = this.calculateTacticsScore(tacticScores)
    const constraintsPassed = constraintChecks.every(c => c.status === 'PASS' || c.status === 'EXCEPTION_ALLOWED')
    const overallScore = (tacticsScore * 0.7) + (constraintsPassed ? 5 : 0) * 0.3

    return {
      pattern_name: pattern.pattern_name,
      pattern_version: pattern.version,
      tactic_scores: tacticScores,
      constraint_checks: constraintChecks,
      tactics_score: Math.round(tacticsScore * 10) / 10,
      constraints_passed: constraintsPassed,
      overall_pattern_score: Math.round(overallScore * 10) / 10,
      reasoning: `Aggregated from ${passes.length} evaluation passes`
    }
  }

  private calculateTacticsScore(tacticScores: TacticScore[]): number {
    const weights = {
      critical: 3.0,
      important: 2.0,
      optional: 1.0
    }

    let weightedSum = 0
    let totalWeight = 0

    for (const tactic of tacticScores) {
      const weight = weights[tactic.priority]
      weightedSum += tactic.score * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  private median(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]
  }

  private mode<T>(items: T[]): T {
    const counts = new Map<T, number>()
    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1)
    }

    let maxCount = 0
    let modeValue = items[0]

    for (const [value, count] of counts) {
      if (count > maxCount) {
        maxCount = count
        modeValue = value
      }
    }

    return modeValue
  }

  private createMockResult(pattern: Pattern): LLMJudgeResult {
    // Mock result for testing
    const tacticScores: TacticScore[] = pattern.tactics.map(tactic => ({
      tactic_name: tactic.name,
      priority: tactic.priority,
      score: 4, // Mock score
      reasoning: 'Mock evaluation - implementation pending'
    }))

    const constraintChecks: ConstraintCheck[] = pattern.constraints.map(constraint => ({
      constraint_rule: constraint.rule,
      status: 'PASS' as const,
      reasoning: 'Mock evaluation - implementation pending'
    }))

    return {
      pattern_name: pattern.pattern_name,
      pattern_version: pattern.version,
      tactic_scores: tacticScores,
      constraint_checks: constraintChecks,
      tactics_score: 4.0,
      constraints_passed: true,
      overall_pattern_score: 4.0,
      reasoning: 'Mock evaluation - Claude API integration pending'
    }
  }
}
