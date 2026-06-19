import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMMessage, GenerationOptions, GenerationResult } from './Provider.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  getProviderId(): string {
    return 'anthropic';
  }

  async generate(messages: LLMMessage[], options?: GenerationOptions): Promise<GenerationResult> {
    const system = messages.find(m => m.role === 'system')?.content;
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model: options?.model || 'claude-3-sonnet-20240229',
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature ?? 0.7,
      system,
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    });

    const textBlock = response.content.find(c => c.type === 'text');
    const text = textBlock && 'text' in textBlock ? textBlock.text : '';

    return {
      text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      raw: response,
    };
  }
}
