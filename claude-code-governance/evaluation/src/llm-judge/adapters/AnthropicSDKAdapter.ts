/**
 * Adapter for Anthropic SDK
 * Uses @anthropic-ai/sdk for direct API calls
 */

import { ILLMAdapter, LLMRequest, LLMResponse } from '../ILLMAdapter'

// Import will be added when SDK is installed
// import Anthropic from '@anthropic-ai/sdk'

export class AnthropicSDKAdapter implements ILLMAdapter {
  private apiKey: string
  // private client: Anthropic

  constructor(apiKey: string) {
    this.apiKey = apiKey
    // this.client = new Anthropic({ apiKey })
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    // TODO: Implement when @anthropic-ai/sdk is installed
    throw new Error(
      'AnthropicSDKAdapter not yet implemented. Install @anthropic-ai/sdk first.\n' +
      'Usage:\n' +
      '  npm install @anthropic-ai/sdk\n' +
      '  Then uncomment the implementation in this file.'
    )

    /*
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
    */
  }

  getName(): string {
    return 'AnthropicSDK'
  }
}
