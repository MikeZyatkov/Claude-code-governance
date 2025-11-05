#!/usr/bin/env node
/**
 * Validates aggregates against DDD Aggregates and Event Sourcing patterns
 */

import { evaluateCode, loadPattern, loadCalibration } from '../evaluation/src/index'
import { ClaudeCodeCLIAdapter } from '../evaluation/src/llm-judge/adapters/ClaudeCodeCLIAdapter'
import * as fs from 'fs'
import * as path from 'path'
import { globSync } from 'glob'

const TENANT_MGMT_PATH = process.env.TENANT_MGMT_PATH || path.join(__dirname, '../../workspace/contexts/tenant-management')
const MODEL_PATH = path.join(TENANT_MGMT_PATH, 'domain/model')

async function validateAggregates() {
  console.log('🔍 Validating Aggregates against DDD & Event Sourcing Patterns\n')

  // Load patterns and calibrations
  const dddPattern = loadPattern('domain', 'ddd-aggregates', 'v1')
  const dddCalibration = loadCalibration('ddd-aggregates', 'v1')
  const eventSourcingPattern = loadPattern('domain', 'event-sourcing', 'v1')
  const eventSourcingCalibration = loadCalibration('event-sourcing', 'v1')

  console.log(`📋 Patterns: DDD Aggregates v1 + Event Sourcing v1`)

  const aggregateFiles = globSync('**/*.aggregate.ts', {
    cwd: MODEL_PATH,
    absolute: true,
    ignore: ['**/*.test.ts', '**/*.spec.ts']
  })

  if (aggregateFiles.length === 0) {
    console.error('❌ No aggregates found in:', MODEL_PATH)
    process.exit(1)
  }

  console.log(`\nFound ${aggregateFiles.length} aggregate(s)\n`)

  const cliAdapter = new ClaudeCodeCLIAdapter()
  let totalDDDScore = 0
  let totalESScore = 0
  let failedAggregates = 0

  for (let i = 0; i < aggregateFiles.length; i++) {
    const file = aggregateFiles[i]
    const fileName = path.basename(file)

    console.log(`${'='.repeat(70)}`)
    console.log(`${i + 1}/${aggregateFiles.length}: ${fileName}`)
    console.log(`${'='.repeat(70)}\n`)

    const code = fs.readFileSync(file, 'utf8')

    const result = await evaluateCode({
      code,
      codePath: file,
      patterns: [dddPattern, eventSourcingPattern],
      calibrations: [dddCalibration, eventSourcingCalibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1
    })

    const dddResult = result.llm_judge.find(r => r.pattern_name.includes('DDD'))
    const esResult = result.llm_judge.find(r => r.pattern_name.includes('Event Sourcing'))

    if (dddResult) {
      totalDDDScore += dddResult.overall_pattern_score
      console.log(`  DDD Pattern Score: ${dddResult.overall_pattern_score.toFixed(2)}/5`)

      // Highlight critical DDD issues
      const criticalIssues = dddResult.tactic_scores.filter(t =>
        t.priority === 'critical' && t.score < 3
      )
      if (criticalIssues.length > 0) {
        console.log(`  🔴 Critical DDD Issues:`)
        criticalIssues.forEach(t => {
          console.log(`     • ${t.tactic_name}: ${t.score}/5`)
          console.log(`       ${t.reasoning}`)
        })
      }
    }

    if (esResult) {
      totalESScore += esResult.overall_pattern_score
      console.log(`  Event Sourcing Score: ${esResult.overall_pattern_score.toFixed(2)}/5`)

      // Check for event sourcing violations
      const noDirectMutation = esResult.tactic_scores.find(t =>
        t.tactic_name === 'Apply events using applyChange() method'
      )
      if (noDirectMutation && noDirectMutation.score < 4) {
        console.log(`  ⚠️  Direct state mutation detected (score: ${noDirectMutation.score}/5)`)
        console.log(`      ${noDirectMutation.reasoning}`)
      }
    }

    const avgScore = ((dddResult?.overall_pattern_score || 0) + (esResult?.overall_pattern_score || 0)) / 2
    if (avgScore < 4.0) {
      failedAggregates++
    }

    console.log('')
  }

  const avgDDD = totalDDDScore / aggregateFiles.length
  const avgES = totalESScore / aggregateFiles.length
  const overallAvg = (avgDDD + avgES) / 2

  console.log(`${'='.repeat(70)}`)
  console.log('📊 Summary')
  console.log(`${'='.repeat(70)}`)
  console.log(`  DDD Aggregates: ${avgDDD.toFixed(2)}/5`)
  console.log(`  Event Sourcing: ${avgES.toFixed(2)}/5`)
  console.log(`  Overall Average: ${overallAvg.toFixed(2)}/5`)
  console.log(`  Aggregates Evaluated: ${aggregateFiles.length}`)
  console.log(`  Quality Issues: ${failedAggregates}`)
  console.log(`${'='.repeat(70)}`)

  process.exit(overallAvg >= 4.0 ? 0 : 1)
}

validateAggregates().catch(error => {
  console.error('Validation failed:', error)
  process.exit(1)
})