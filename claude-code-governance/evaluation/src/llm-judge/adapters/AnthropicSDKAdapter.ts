/**
 * Adapter for Anthropic SDK
 * Uses @anthropic-ai/sdk for direct API calls
 */

import { ILLMAdapter, LLMRequest, LLMResponse } from '../ILLMAdapter'
import Anthropic from '@anthropic-ai/sdk'

export class AnthropicSDKAdapter implements ILLMAdapter {
  private apiKey: string
  private client: Anthropic

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ''
    if (!this.apiKey) {
      throw new Error(
        'AnthropicSDKAdapter requires an API key. ' +
        'Pass it to the constructor or set ANTHROPIC_API_KEY environment variable.'
      )
    }
    this.client = new Anthropic({ apiKey: this.apiKey })
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const message = await this.client.messages.create({
      model: request.model || 'claude-sonnet-4',
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0,
      messages: [
        {
          role: 'user',
          content: request.prompt
        }
      ]
    })

    return {
      content: message.content[0].type === 'text' ? message.content[0].text : '',
      model: message.model,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    }
  }

  getName(): string {
    return 'AnthropicSDK'
  }
}
