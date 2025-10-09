/**
 * LLM-as-judge evaluator
 * Uses pluggable LLM adapter to evaluate code against patterns
 */

import { Pattern, LLMJudgeResult, TacticScore, ConstraintCheck, Calibration } from '../types'
import { PromptBuilder } from './prompt-builder'
import { ILLMAdapter } from './ILLMAdapter'
import { ClaudeCodeCLIAdapter } from './adapters/ClaudeCodeCLIAdapter'

interface JudgeOptions {
  model?: string
  apiKey?: string
  multiPassCount?: number
  adapter?: ILLMAdapter
  implementationPlan?: string
}

export class LLMJudge {
  private promptBuilder: PromptBuilder
  private defaultAdapter: ILLMAdapter

  constructor(defaultAdapter?: ILLMAdapter) {
    this.promptBuilder = new PromptBuilder()
    this.defaultAdapter = defaultAdapter || new ClaudeCodeCLIAdapter()
  }

  async evaluatePattern(
    code: string,
    pattern: Pattern,
    calibration: Calibration,
    options: JudgeOptions = {}
  ): Promise<LLMJudgeResult> {
    const multiPassCount = options.multiPassCount || 3
    const adapter = options.adapter || this.defaultAdapter

    console.log(`    Using LLM adapter: ${adapter.getName()}`)

    // Run multiple passes for consistency
    const passes: LLMJudgeResult[] = []

    for (let i = 0; i < multiPassCount; i++) {
      console.log(`    Pass ${i + 1}/${multiPassCount}...`)
      const result = await this.singleEvaluation(code, pattern, calibration, adapter, options)
      passes.push(result)
    }

    // Aggregate results using median
    return this.aggregateResults(passes, pattern)
  }

  private async singleEvaluation(
    code: string,
    pattern: Pattern,
    calibration: Calibration,
    adapter: ILLMAdapter,
    options: JudgeOptions
  ): Promise<LLMJudgeResult> {
    const prompt = this.promptBuilder.buildEvaluationPrompt(code, pattern, calibration, options.implementationPlan)

    try {
      // Use adapter to complete the prompt
      const response = await adapter.complete({
        prompt,
        model: options.model,
        temperature: 0, // Deterministic for evaluation
        maxTokens: 4096
      })

      // Parse JSON response
      const evaluation = this.parseEvaluationResponse(response.content)
      return this.mapToLLMJudgeResult(evaluation, pattern)

    } catch (error) {
      console.error(`    Error during evaluation: ${error}`)
      throw error
    }
  }

  private parseEvaluationResponse(content: string): any {
    // Try to extract JSON from markdown code block
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
    const jsonText = jsonMatch ? jsonMatch[1] : content

    try {
      return JSON.parse(jsonText)
    } catch (error) {
      // If parsing fails, try to find JSON object in the text
      const objectMatch = content.match(/\{[\s\S]*\}/)
      if (objectMatch) {
        return JSON.parse(objectMatch[0])
      }
      throw new Error(`Failed to parse evaluation response: ${error}`)
    }
  }

  private mapToLLMJudgeResult(evaluation: any, pattern: Pattern): LLMJudgeResult {
    // Map the evaluation response to our result type
    const tacticScores: TacticScore[] = evaluation.tactic_scores.map((ts: any) => ({
      tactic_name: ts.tactic_name,
      priority: pattern.tactics.find(t => t.name === ts.tactic_name)?.priority || 'optional',
      score: ts.score,
      reasoning: ts.reasoning
    }))

    const constraintChecks: ConstraintCheck[] = evaluation.constraint_checks.map((cc: any) => ({
      constraint_rule: cc.constraint_rule,
      status: cc.status,
      reasoning: cc.reasoning,
      exception_used: cc.exception_used
    }))

    const tacticsScore = this.calculateTacticsScore(tacticScores)
    const constraintsPassed = constraintChecks.every(
      c => c.status === 'PASS' || c.status === 'EXCEPTION_ALLOWED'
    )
    const overallScore = (tacticsScore * 0.7) + (constraintsPassed ? 5 : 0) * 0.3

    return {
      pattern_name: pattern.pattern_name,
      pattern_version: pattern.version,
      tactic_scores: tacticScores,
      constraint_checks: constraintChecks,
      tactics_score: Math.round(tacticsScore * 10) / 10,
      constraints_passed: constraintsPassed,
      overall_pattern_score: Math.round(overallScore * 10) / 10,
      reasoning: evaluation.overall_reasoning || 'No reasoning provided'
    }
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
      // Skip non-applicable tactics (score -1)
      if (tactic.score === -1) {
        continue
      }

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

    counts.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count
        modeValue = value
      }
    })

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
