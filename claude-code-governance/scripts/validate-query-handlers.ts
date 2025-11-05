#!/usr/bin/env node
/**
 * Validates query handlers against CQRS pattern
 */

import { evaluateCode, loadPattern, loadCalibration } from '../evaluation/src/index'
import { ClaudeCodeCLIAdapter } from '../evaluation/src/llm-judge/adapters/ClaudeCodeCLIAdapter'
import * as fs from 'fs'
import * as path from 'path'
import { globSync } from 'glob'

const TENANT_MGMT_PATH = process.env.TENANT_MGMT_PATH || path.join(__dirname, '../../workspace/contexts/tenant-management')
const QUERIES_PATH = path.join(TENANT_MGMT_PATH, 'application/queries')

async function validateQueryHandlers() {
  console.log('🔍 Validating Query Handlers against CQRS Pattern\n')

  const cqrsPattern = loadPattern('application', 'cqrs', 'v1')
  const cqrsCalibration = loadCalibration('cqrs', 'v1')
  console.log(`📋 Pattern: ${cqrsPattern.pattern_name} (${cqrsPattern.version})`)

  const handlerFiles = globSync('**/*QueryHandler.ts', {
    cwd: QUERIES_PATH,
    absolute: true,
    ignore: ['**/*.test.ts', '**/*.spec.ts']
  })

  if (handlerFiles.length === 0) {
    console.error('❌ No query handlers found in:', QUERIES_PATH)
    process.exit(1)
  }

  console.log(`\nFound ${handlerFiles.length} query handler(s)\n`)

  const cliAdapter = new ClaudeCodeCLIAdapter()
  let totalScore = 0
  let failedHandlers = 0

  for (let i = 0; i < handlerFiles.length; i++) {
    const file = handlerFiles[i]
    const fileName = path.basename(file)

    console.log(`${'='.repeat(70)}`)
    console.log(`${i + 1}/${handlerFiles.length}: ${fileName}`)
    console.log(`${'='.repeat(70)}\n`)

    const code = fs.readFileSync(file, 'utf8')

    const result = await evaluateCode({
      code,
      codePath: file,
      patterns: [cqrsPattern],
      calibrations: [cqrsCalibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1
    })

    const judgeResult = result.llm_judge[0]
    totalScore += judgeResult.overall_pattern_score

    console.log(`  Overall Score: ${judgeResult.overall_pattern_score.toFixed(2)}/5`)
    console.log(`  Tactics Score: ${judgeResult.tactics_score.toFixed(2)}/5`)
    console.log(`  Constraints: ${judgeResult.constraints_passed ? '✅ Passed' : '❌ Failed'}`)

    // Check for critical query violations
    const stateModificationCheck = judgeResult.constraint_checks.find(c =>
      c.constraint_rule.includes('Query handlers MUST NOT call aggregate.save()')
    )

    if (stateModificationCheck?.status === 'FAIL') {
      console.log(`\n  🚨 CRITICAL: Query handler modifies state!`)
      console.log(`      ${stateModificationCheck.reasoning}`)
    }

    const lowScoringTactics = judgeResult.tactic_scores.filter(t => t.score < 4 && t.score > 0)
    if (lowScoringTactics.length > 0) {
      console.log(`\n  ⚠️  Tactics needing improvement:`)
      lowScoringTactics.forEach(tactic => {
        console.log(`    • ${tactic.tactic_name}: ${tactic.score}/5`)
        console.log(`      ${tactic.reasoning}`)
      })
    }

    if (judgeResult.overall_pattern_score < 4.0) {
      failedHandlers++
    }

    console.log('')
  }

  const avgScore = totalScore / handlerFiles.length

  console.log(`${'='.repeat(70)}`)
  console.log(`📊 Summary: ${avgScore.toFixed(2)}/5 average`)
  console.log(`✅ Passing: ${handlerFiles.length - failedHandlers}`)
  console.log(`❌ Needs Work: ${failedHandlers}`)
  console.log(`${'='.repeat(70)}`)

  process.exit(avgScore >= 4.0 ? 0 : 1)
}

validateQueryHandlers().catch(error => {
  console.error('Validation failed:', error)
  process.exit(1)
})