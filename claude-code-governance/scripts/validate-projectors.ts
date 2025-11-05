#!/usr/bin/env node
/**
 * Validates projectors against Projectors pattern
 */

import { evaluateCode, loadPattern, loadCalibration } from '../evaluation/src/index'
import { ClaudeCodeCLIAdapter } from '../evaluation/src/llm-judge/adapters/ClaudeCodeCLIAdapter'
import * as fs from 'fs'
import * as path from 'path'
import { globSync } from 'glob'

const TENANT_MGMT_PATH = process.env.TENANT_MGMT_PATH || path.join(__dirname, '../../workspace/contexts/tenant-management')
const PROJECTORS_PATH = path.join(TENANT_MGMT_PATH, 'application/projectors')

async function validateProjectors() {
  console.log('🔍 Validating Projectors against Projectors Pattern\n')

  const projectorsPattern = loadPattern('application', 'projectors', 'v1')
  const projectorsCalibration = loadCalibration('projectors', 'v1')
  console.log(`📋 Pattern: ${projectorsPattern.pattern_name} (${projectorsPattern.version})`)

  const projectorFiles = globSync('**/*Projector.ts', {
    cwd: PROJECTORS_PATH,
    absolute: true,
    ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*EventBridge*']
  })

  if (projectorFiles.length === 0) {
    console.error('❌ No projectors found in:', PROJECTORS_PATH)
    process.exit(1)
  }

  console.log(`\nFound ${projectorFiles.length} projector(s)\n`)

  const cliAdapter = new ClaudeCodeCLIAdapter()
  let totalScore = 0
  let failedProjectors = 0

  for (let i = 0; i < projectorFiles.length; i++) {
    const file = projectorFiles[i]
    const fileName = path.basename(file)

    console.log(`${'='.repeat(70)}`)
    console.log(`${i + 1}/${projectorFiles.length}: ${fileName}`)
    console.log(`${'='.repeat(70)}\n`)

    const code = fs.readFileSync(file, 'utf8')

    const result = await evaluateCode({
      code,
      codePath: file,
      patterns: [projectorsPattern],
      calibrations: [projectorsCalibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1
    })

    const judgeResult = result.llm_judge[0]
    totalScore += judgeResult.overall_pattern_score

    console.log(`  Overall Score: ${judgeResult.overall_pattern_score.toFixed(2)}/5`)

    // Check for business logic in projector
    const noBusinessLogic = judgeResult.constraint_checks.find(c =>
      c.constraint_rule.includes('MUST NOT contain business logic')
    )

    if (noBusinessLogic?.status === 'FAIL') {
      console.log(`  🚨 Business logic detected in projector!`)
      console.log(`     ${noBusinessLogic.reasoning}`)
    }

    // Check handle method pattern
    const handleMethod = judgeResult.tactic_scores.find(t => t.tactic_name === 'Implement handle(eventType, eventData) method')
    if (handleMethod && handleMethod.score < 4) {
      console.log(`  ⚠️  Handle method: ${handleMethod.score}/5`)
      console.log(`      ${handleMethod.reasoning}`)
    }

    if (judgeResult.overall_pattern_score < 4.0) {
      failedProjectors++
    }

    console.log('')
  }

  const avgScore = totalScore / projectorFiles.length

  console.log(`${'='.repeat(70)}`)
  console.log(`📊 Summary: ${avgScore.toFixed(2)}/5 average`)
  console.log(`✅ Passing: ${projectorFiles.length - failedProjectors}`)
  console.log(`❌ Needs Work: ${failedProjectors}`)
  console.log(`${'='.repeat(70)}`)

  process.exit(avgScore >= 4.0 ? 0 : 1)
}

validateProjectors().catch(error => {
  console.error('Validation failed:', error)
  process.exit(1)
})