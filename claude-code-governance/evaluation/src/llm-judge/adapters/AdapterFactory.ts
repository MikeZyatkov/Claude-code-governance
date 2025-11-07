/**
 * Factory for creating LLM adapters based on configuration
 */

import { ILLMAdapter } from '../ILLMAdapter'
import { AnthropicSDKAdapter } from './AnthropicSDKAdapter'
import { ClaudeCodeCLIAdapter } from './ClaudeCodeCLIAdapter'

export type AdapterType = 'anthropic-sdk' | 'claude-cli'

export class AdapterFactory {
  /**
   * Creates an adapter based on environment variable or explicit type
   *
   * Environment Variables:
   * - LLM_ADAPTER: 'anthropic-sdk' | 'claude-cli' (default: 'anthropic-sdk')
   * - ANTHROPIC_API_KEY: Required for anthropic-sdk adapter
   * - CLAUDE_CLI_PATH: Optional path to claude CLI (default: 'claude')
   *
   * @param adapterType - Explicit adapter type (overrides environment variable)
   * @param apiKey - API key for Anthropic SDK (overrides ANTHROPIC_API_KEY env var)
   * @returns Configured LLM adapter
   */
  static createAdapter(adapterType?: AdapterType, apiKey?: string): ILLMAdapter {
    // Determine which adapter to use
    const type = adapterType || (process.env.LLM_ADAPTER as AdapterType) || 'anthropic-sdk'

    switch (type) {
      case 'anthropic-sdk':
        return new AnthropicSDKAdapter(apiKey)

      case 'claude-cli':
        return new ClaudeCodeCLIAdapter()

      default:
        throw new Error(
          `Unknown adapter type: ${type}. ` +
          `Valid options are: 'anthropic-sdk', 'claude-cli'`
        )
    }
  }

  /**
   * Gets the default adapter (AnthropicSDKAdapter unless configured otherwise)
   */
  static getDefaultAdapter(): ILLMAdapter {
    return this.createAdapter()
  }
}
