#!/usr/bin/env node
/**
 * Validates value objects against Value Objects pattern
 */

import { evaluateCode, loadPattern, loadCalibration } from '../evaluation/src/index'
import { ClaudeCodeCLIAdapter } from '../evaluation/src/llm-judge/adapters/ClaudeCodeCLIAdapter'
import * as fs from 'fs'
import * as path from 'path'
import { globSync } from 'glob'

const TENANT_MGMT_PATH = process.env.TENANT_MGMT_PATH || path.join(__dirname, '../../workspace/contexts/tenant-management')
const MODEL_PATH = path.join(TENANT_MGMT_PATH, 'domain/model')

async function validateValueObjects() {
  console.log('🔍 Validating Value Objects against Value Objects Pattern\n')

  const voPattern = loadPattern('domain', 'value-objects', 'v1')
  const voCalibration = loadCalibration('value-objects', 'v1')
  console.log(`📋 Pattern: ${voPattern.pattern_name} (${voPattern.version})`)

  const voFiles = globSync('**/*.vo.ts', {
    cwd: MODEL_PATH,
    absolute: true,
    ignore: ['**/*.test.ts', '**/*.spec.ts']
  })

  if (voFiles.length === 0) {
    console.error('❌ No value objects found in:', MODEL_PATH)
    process.exit(1)
  }

  console.log(`\nFound ${voFiles.length} value object(s)\n`)

  const cliAdapter = new ClaudeCodeCLIAdapter()
  let totalScore = 0
  const issues: string[] = []

  for (let i = 0; i < voFiles.length; i++) {
    const file = voFiles[i]
    const fileName = path.basename(file)

    console.log(`${'='.repeat(70)}`)
    console.log(`${i + 1}/${voFiles.length}: ${fileName}`)
    console.log(`${'='.repeat(70)}\n`)

    const code = fs.readFileSync(file, 'utf8')

    const result = await evaluateCode({
      code,
      codePath: file,
      patterns: [voPattern],
      calibrations: [voCalibration],
      checkDeterministic: false,
      checkLLMJudge: true,
      multiPassCount: 1
    })

    const judgeResult = result.llm_judge[0]
    totalScore += judgeResult.overall_pattern_score

    console.log(`  Overall Score: ${judgeResult.overall_pattern_score.toFixed(2)}/5`)

    // Check immutability
    const immutableFields = judgeResult.tactic_scores.find(t => t.tactic_name === 'All fields must be readonly')
    const noSetters = judgeResult.tactic_scores.find(t => t.tactic_name === 'No setter methods, only getters')

    if (immutableFields && immutableFields.score < 5) {
      console.log(`  ⚠️  Immutability: ${immutableFields.score}/5 - ${immutableFields.reasoning}`)
      issues.push(`${fileName}: Fields not fully immutable`)
    }

    if (noSetters && noSetters.score < 5) {
      console.log(`  ⚠️  Setters detected: ${noSetters.score}/5 - ${noSetters.reasoning}`)
      issues.push(`${fileName}: Public setters found`)
    }

    // Check constructor pattern
    const privateConstructor = judgeResult.tactic_scores.find(t => t.tactic_name === 'Use private constructor with static factory method')
    if (privateConstructor && privateConstructor.score < 5) {
      console.log(`  ⚠️  Constructor: ${privateConstructor.score}/5 - ${privateConstructor.reasoning}`)
      issues.push(`${fileName}: Constructor should be private with static factory`)
    }

    console.log('')
  }

  const avgScore = totalScore / voFiles.length

  console.log(`${'='.repeat(70)}`)
  console.log(`📊 Summary: ${avgScore.toFixed(2)}/5 average`)
  console.log(`${'='.repeat(70)}`)

  if (issues.length > 0) {
    console.log(`\n⚠️  ${issues.length} issue(s) found:\n`)
    issues.forEach(i => console.log(`  • ${i}`))
  }

  process.exit(avgScore >= 4.5 ? 0 : 1) // VOs should be near-perfect (4.5+)
}

validateValueObjects().catch(error => {
  console.error('Validation failed:', error)
  process.exit(1)
})