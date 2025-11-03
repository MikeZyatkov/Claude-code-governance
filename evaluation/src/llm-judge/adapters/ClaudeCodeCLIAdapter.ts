/**
 * Adapter for Claude Code CLI
 * Uses the claude-code command line tool as the LLM backend
 */

import { spawn } from 'child_process'
import { ILLMAdapter, LLMRequest, LLMResponse } from '../ILLMAdapter'

export class ClaudeCodeCLIAdapter implements ILLMAdapter {
  private cliCommand: string

  constructor(cliCommand: string = process.env.CLAUDE_CLI_PATH || 'claude') {
    this.cliCommand = cliCommand
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    return new Promise((resolve, reject) => {
      const args = ['--print']

      // Add model if specified
      if (request.model) {
        args.push('--model', request.model)
      }

      const claude = spawn(this.cliCommand, args)

      let output = ''
      let errorOutput = ''

      claude.stdout.on('data', (data) => {
        output += data.toString()
      })

      claude.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      claude.on('error', (error) => {
        reject(new Error(`Failed to spawn claude-code: ${error.message}`))
      })

      claude.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `Claude Code CLI exited with code ${code}${errorOutput ? `: ${errorOutput}` : ''}`
            )
          )
          return
        }

        try {
          resolve({
            content: output.trim(),
            model: request.model || 'claude-code-cli',
            usage: {
              inputTokens: this.estimateTokens(request.prompt),
              outputTokens: this.estimateTokens(output)
            }
          })
        } catch (err) {
          reject(err)
        }
      })

      // Send prompt to stdin
      claude.stdin.write(request.prompt)
      claude.stdin.end()
    })
  }

  getName(): string {
    return 'ClaudeCodeCLI'
  }

  /**
   * Rough token estimation (4 chars ≈ 1 token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
}
