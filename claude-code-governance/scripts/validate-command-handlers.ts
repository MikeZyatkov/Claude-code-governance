#!/usr/bin/env node
/**
 * Validates command handlers against CQRS pattern
 */

import { evaluateCode, loadPattern, loadCalibration } from '../evaluation/src/index'
import { ClaudeCodeCLIAdapter } from '../evaluation/src/llm-judge/adapters/ClaudeCodeCLIAdapter'
import * as fs from 'fs'
import * as path from 'path'
import { globSync } from 'glob'

const TENANT_MGMT_PATH = process.env.TENANT_MGMT_PATH || path.join(__dirname, '../../workspace/contexts/tenant-management')
const COMMANDS_PATH = path.join(TENANT_MGMT_PATH, 'application/commands')

async function validateCommandHandlers() {
  console.log('🔍 Validating Command Handlers against CQRS Pattern\n')

  // Load CQRS pattern and calibration
  const cqrsPattern = loadPattern('application', 'cqrs', 'v1')
  const cqrsCalibration = loadCalibration('cqrs', 'v1')
  console.log(`📋 Pattern: ${cqrsPattern.pattern_name} (${cqrsPattern.version})`)

  // Find all command handler files
  const handlerFiles = globSync('**/*CommandHandler.ts', {
    cwd: COMMANDS_PATH,
    absolute: true,
    ignore: ['**/*.test.ts', '**/*.spec.ts']
  })

  if (handlerFiles.length === 0) {
    console.error('❌ No command handlers found in:', COMMANDS_PATH)
    process.exit(1)
  }

  console.log(`\nFound ${handlerFiles.length} command handler(s)\n`)

  const cliAdapter = new ClaudeCodeCLIAdapter()
  let totalScore = 0
  let failedHandlers = 0
  const allRecommendations: string[] = []

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

    // Show low-scoring tactics
    const lowScoringTactics = judgeResult.tactic_scores.filter(t => t.score < 4 && t.score > 0)
    if (lowScoringTactics.length > 0) {
      console.log(`\n  ⚠️  Tactics needing improvement:`)
      lowScoringTactics.forEach(tactic => {
        const emoji = tactic.score >= 3 ? '🟡' : '🔴'
        console.log(`    ${emoji} ${tactic.tactic_name} (${tactic.priority}): ${tactic.score}/5`)
        console.log(`       ${tactic.reasoning}`)
      })
    }

    // Show constraint failures
    const failedConstraints = judgeResult.constraint_checks.filter(c => c.status === 'FAIL')
    if (failedConstraints.length > 0) {
      console.log(`\n  ❌ Constraint Violations:`)
      failedConstraints.forEach(constraint => {
        console.log(`    • ${constraint.constraint_rule}`)
        console.log(`      ${constraint.reasoning}`)
      })
    }

    if (judgeResult.overall_pattern_score < 4.0) {
      failedHandlers++
    }

    allRecommendations.push(...result.recommendations.map(r => `${fileName}: ${r}`))
    console.log('')
  }

  // Summary
  console.log(`${'='.repeat(70)}`)
  console.log('📊 Summary')
  console.log(`${'='.repeat(70)}\n`)

  const avgScore = totalScore / handlerFiles.length
  console.log(`Average Score: ${avgScore.toFixed(2)}/5`)
  console.log(`Handlers Evaluated: ${handlerFiles.length}`)
  console.log(`Handlers < 4.0: ${failedHandlers}`)
  console.log(`Handlers ≥ 4.0: ${handlerFiles.length - failedHandlers}`)

  if (allRecommendations.length > 0) {
    console.log(`\n📋 All Recommendations:\n`)
    allRecommendations.forEach(r => console.log(`  • ${r}`))
  }

  console.log(`\n💡 Next Steps:`)
  console.log(`   1. Review patterns/application/cqrs/v1.yaml for guidance`)
  console.log(`   2. Check calibration/cqrs/v1-scoring.yaml for scoring criteria`)
  console.log(`   3. Address low-scoring critical tactics first`)

  if (avgScore < 4.0) {
    console.log(`\n⚠️  Average score below 4.0 - improvements needed`)
    process.exit(1)
  } else {
    console.log(`\n✅ Command handlers meet quality standards!`)
    process.exit(0)
  }
}

validateCommandHandlers().catch(error => {
  console.error('Validation failed:', error)
  process.exit(1)
})