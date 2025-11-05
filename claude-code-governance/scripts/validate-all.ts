#!/usr/bin/env node
/**
 * Validates all application patterns
 */

import { spawn } from 'child_process'
import * as path from 'path'

const scripts = [
  { name: 'Command Handlers', script: 'validate-command-handlers.ts' },
  { name: 'Query Handlers', script: 'validate-query-handlers.ts' },
  { name: 'Aggregates', script: 'validate-aggregates.ts' },
  { name: 'Value Objects', script: 'validate-value-objects.ts' },
  { name: 'Projectors', script: 'validate-projectors.ts' }
]

async function runScript(scriptPath: string): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve) => {
    const process = spawn('ts-node', [scriptPath], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    })

    let output = ''

    process.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      console.log(text)
    })

    process.stderr.on('data', (data) => {
      const text = data.toString()
      output += text
      console.error(text)
    })

    process.on('close', (code) => {
      resolve({ exitCode: code || 0, output })
    })
  })
}

async function validateAll() {
  console.log('🚀 Running All Pattern Validations\n')
  console.log(`${'='.repeat(70)}\n`)

  const results: Array<{ name: string; passed: boolean; exitCode: number }> = []

  for (const { name, script } of scripts) {
    console.log(`\n${'▶'.repeat(35)}`)
    console.log(`▶ ${name}`)
    console.log(`${'▶'.repeat(35)}\n`)

    const scriptPath = path.join(__dirname, script)
    const { exitCode } = await runScript(scriptPath)

    results.push({
      name,
      passed: exitCode === 0,
      exitCode
    })

    console.log('')
  }

  // Final summary
  console.log(`\n${'='.repeat(70)}`)
  console.log('📊 FINAL SUMMARY')
  console.log(`${'='.repeat(70)}\n`)

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  results.forEach(({ name, passed }) => {
    const emoji = passed ? '✅' : '❌'
    console.log(`${emoji} ${name}`)
  })

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)
  console.log(`${'─'.repeat(70)}`)

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} validation(s) failed`)
    console.log(`\n💡 Review individual validation output above for details`)
    process.exit(1)
  } else {
    console.log(`\n🎉 All validations passed!`)
    process.exit(0)
  }
}

validateAll().catch(error => {
  console.error('Validation suite failed:', error)
  process.exit(1)
})