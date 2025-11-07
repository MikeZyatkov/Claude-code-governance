/**
 * LLM-as-judge evaluator
 * Uses pluggable LLM adapter to evaluate code against patterns
 */

import { Pattern, LLMJudgeResult, TacticScore, ConstraintCheck, Calibration } from '../types'
import { PromptBuilder } from './prompt-builder'
import { ILLMAdapter } from './ILLMAdapter'
import { AdapterFactory } from './adapters/AdapterFactory'

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
    this.defaultAdapter = defaultAdapter || AdapterFactory.getDefaultAdapter()
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
    // Try multiple patterns for JSON code blocks (handles various LLM response formats)
    const patterns = [
      /```json\s*\n([\s\S]*?)\n```/,      // Standard: ```json\n...\n```
      /```json\s*([\s\S]*?)```/,           // No newlines: ```json...```
      /```\s*\n([\s\S]*?)\n```/,           // Plain code block: ```\n...\n```
      /```\s*([\s\S]*?)```/                // Plain no newlines: ```...```
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        try {
          return JSON.parse(match[1].trim())
        } catch (error) {
          // Try next pattern
          continue
        }
      }
    }

    // Try parsing the whole content as JSON
    try {
      return JSON.parse(content.trim())
    } catch (error) {
      // Continue to last resort
    }

    // Last resort: extract JSON object from anywhere in the text
    const objectMatch = content.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0])
      } catch (error) {
        // Fall through to error
      }
    }

    // Complete failure - show more context
    throw new Error(
      `Failed to parse evaluation response. Response starts with: "${content.substring(0, 300)}..."`
    )
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

    // Apply critical tactic penalty: if any critical tactic scores < 3, cap the overall score
    const failingCriticalTactics = tacticScores.filter(t => t.priority === 'critical' && t.score >= 0 && t.score < 3)
    let overallScore = (tacticsScore * 0.7) + (constraintsPassed ? 5 : 0) * 0.3

    if (failingCriticalTactics.length > 0) {
      // Cap score based on lowest critical tactic: score can't exceed 3.0 + (lowest_critical_score * 0.5)
      const lowestCriticalScore = Math.min(...failingCriticalTactics.map(t => t.score))
      const scoreCap = 3.0 + (lowestCriticalScore * 0.5)
      overallScore = Math.min(overallScore, scoreCap)
    }

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

    // Apply critical tactic penalty: if any critical tactic scores < 3, cap the overall score
    const failingCriticalTactics = tacticScores.filter(t => t.priority === 'critical' && t.score >= 0 && t.score < 3)
    let overallScore = (tacticsScore * 0.7) + (constraintsPassed ? 5 : 0) * 0.3

    if (failingCriticalTactics.length > 0) {
      // Cap score based on lowest critical tactic: score can't exceed 3.0 + (lowest_critical_score * 0.5)
      const lowestCriticalScore = Math.min(...failingCriticalTactics.map(t => t.score))
      const scoreCap = 3.0 + (lowestCriticalScore * 0.5)
      overallScore = Math.min(overallScore, scoreCap)
    }

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
