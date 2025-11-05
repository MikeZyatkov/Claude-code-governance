/**
 * Interface for LLM adapters
 * Allows swapping between Claude Code CLI, Anthropic SDK, or other LLM providers
 */

export interface LLMRequest {
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface LLMResponse {
  content: string
  model: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export interface ILLMAdapter {
  /**
   * Complete a prompt and return the response
   */
  complete(request: LLMRequest): Promise<LLMResponse>

  /**
   * Get the name of this adapter
   */
  getName(): string
}
