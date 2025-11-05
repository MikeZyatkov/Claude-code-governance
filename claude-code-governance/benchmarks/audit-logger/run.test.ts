/**
 * Audit Logger Skill E2E Tests
 *
 * These tests verify that the audit-logger skill works correctly with
 * context-based invocation (not JSON parameters).
 *
 * Purpose:
 * 1. E2E test the skill by invoking Claude with the skill prompt
 * 2. Verify the skill reads context naturally (feature, timestamp, etc.)
 * 3. Validate timestamp format matches "YYYY-MM-DD HH:MM:SS"
 */
import { ClaudeCodeCLIAdapter } from '../../evaluation/src/llm-judge/adapters/ClaudeCodeCLIAdapter'
import * as fs from 'fs'
import * as path from 'path'

describe('Audit Logger Skill E2E', () => {
  const skillPath = path.join(__dirname, '../../skills/audit-logger/SKILL.md')

  let skillPrompt: string
  let llm: ClaudeCodeCLIAdapter

  beforeAll(() => {
    // Load the skill prompt
    skillPrompt = fs.readFileSync(skillPath, 'utf8')

    // Create LLM adapter
    llm = new ClaudeCodeCLIAdapter()
  })

  describe('Skill Design Verification', () => {
    it('should use context-based invocation (not JSON parameters)', () => {
      // Verify the skill uses context, not JSON input/output
      expect(skillPrompt).not.toMatch(/"action":\s*"initialize"/i)
      expect(skillPrompt).not.toMatch(/Input.*```json/i)
      expect(skillPrompt).toMatch(/Context from Orchestrator/i)
      expect(skillPrompt).toMatch(/reads context from/i)
    })

    it('should have allowed-tools restrictions', () => {
      // Verify skill has tool restrictions for safety
      expect(skillPrompt).toMatch(/allowed-tools:\s*Read,\s*Write,\s*Bash/i)
    })

    it('should reference ENTRY-FORMATS.md for progressive disclosure', () => {
      // Verify skill uses progressive disclosure
      expect(skillPrompt).toMatch(/ENTRY-FORMATS\.md/i)
    })
  })

  describe('Initialize Action with Context', () => {
    it('should initialize audit trail from natural context', async () => {
      const testTimestamp = '2025-10-30 15:45:30'

      // Simulate orchestrator invoking the skill with context
      const prompt = `${skillPrompt}

---

**Context:** You are the audit-logger skill being invoked by the orchestrator.

**Orchestrator says:**
"Initialize the audit trail for the tenant-onboarding feature."

**Recent context:**
- Command executed: /orchestrate:hex-arc tenant-onboarding --threshold 4.5
- Bash command just ran: date '+%Y-%m-%d %H:%M:%S'
- Bash output: ${testTimestamp}
- Configuration: threshold 4.5, max_iterations 3, layers: domain, application, infrastructure

**Your task:**
Initialize the audit trail file. Extract the timestamp from the recent bash output above and use it in the audit file.

You do NOT need to actually write files. Just show what content would be written to docs/tenant-onboarding/implementation-audit.md.
`

      // Invoke Claude Code CLI
      const response = await llm.complete({ prompt })

      // CRITICAL: Check that response uses the timestamp from context
      expect(response.content).toContain(testTimestamp)

      // Should NOT contain placeholders
      expect(response.content).not.toContain('12:00am')
      expect(response.content).not.toContain('12:00pm')
      expect(response.content).not.toContain('{timestamp}')

      // Verify audit content structure
      expect(response.content).toMatch(/Implementation Audit Trail.*tenant-onboarding/i)
      expect(response.content).toContain('Threshold: 4.5')
      expect(response.content).toContain('Max iterations: 3')

      // Extract date from timestamp for session header
      const expectedDate = testTimestamp.split(' ')[0]
      expect(response.content).toContain(`Session: ${expectedDate}`)

      console.log(`\n✅ PASSED: Skill correctly used timestamp from context: ${testTimestamp}`)
    }, 60000)
  })

  describe('Append Action with Context', () => {
    it('should append entry reading context naturally', async () => {
      const testTimestamp = '2025-10-30 16:23:45'

      const prompt = `${skillPrompt}

---

**Context:** You are the audit-logger skill being invoked by the orchestrator.

**Orchestrator says:**
"Log implementation start for the domain layer."

**Recent context:**
- Feature: tenant-onboarding
- Layer: domain
- Goal: Create Tenant aggregate with value objects and domain events
- Bash command just ran: date '+%Y-%m-%d %H:%M:%S'
- Bash output: ${testTimestamp}
- Phase: implementation_start
- From: Orchestrator → Implementation Agent

**Your task:**
Append an implementation_start entry to the audit trail. Use the timestamp from the recent bash output.

You do NOT need to write files. Just show the entry that would be appended.
`

      // Invoke Claude Code CLI
      const response = await llm.complete({ prompt })

      // CRITICAL: Check that response uses the timestamp from context
      expect(response.content).toContain(testTimestamp)

      // Should NOT contain placeholders
      expect(response.content).not.toContain('12:00am')
      expect(response.content).not.toContain('12:00pm')
      expect(response.content).not.toContain('{timestamp}')

      // Verify the entry format with timestamp from context
      const entryRegex = new RegExp(`${testTimestamp}.*Orchestrator.*Implementation Agent`)
      expect(response.content).toMatch(entryRegex)

      // Verify entry content structure
      expect(response.content).toMatch(/Command.*Implement.*domain/i)
      expect(response.content).toContain('Tenant aggregate')

      console.log(`\n✅ PASSED: Skill correctly used timestamp from context: ${testTimestamp}`)
    }, 60000)
  })

  describe('Context Reading', () => {
    it('should read feature name from context', async () => {
      const testTimestamp = '2025-10-30 17:00:00'

      const prompt = `${skillPrompt}

---

**Context:** You are the audit-logger skill being invoked by the orchestrator.

**Orchestrator workflow:**
1. User ran: /orchestrate:hex-arc user-authentication
2. Bash: date '+%Y-%m-%d %H:%M:%S' → ${testTimestamp}
3. Now: "Initialize audit trail"

**Your task:**
Initialize the audit trail. The feature name is in the context above (from the command the user ran).

Just show what would be written.
`

      const response = await llm.complete({ prompt })

      // Should identify "user-authentication" from context
      expect(response.content).toMatch(/user-authentication/i)
      expect(response.content).toContain(testTimestamp)

      console.log('\n✅ PASSED: Skill correctly extracted feature name from context')
    }, 60000)
  })

  describe('Entry Format Templates', () => {
    it('should load entry format templates from ENTRY-FORMATS.md', () => {
      const entryFormatsPath = path.join(__dirname, '../../skills/audit-logger/ENTRY-FORMATS.md')

      // Verify ENTRY-FORMATS.md exists
      expect(fs.existsSync(entryFormatsPath)).toBe(true)

      const entryFormats = fs.readFileSync(entryFormatsPath, 'utf8')

      // Verify it has all entry types
      expect(entryFormats).toMatch(/implementation_start/i)
      expect(entryFormats).toMatch(/implementation_complete/i)
      expect(entryFormats).toMatch(/review_start/i)
      expect(entryFormats).toMatch(/review_complete/i)
      expect(entryFormats).toMatch(/commit/i)
      expect(entryFormats).toMatch(/intervention/i)

      console.log('\n✅ PASSED: ENTRY-FORMATS.md contains all entry type templates')
    })
  })
})
