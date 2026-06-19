import OpenAI from 'openai';
import { LLMProvider, LLMMessage, GenerationOptions, GenerationResult } from './Provider.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  getProviderId(): string {
    return 'openai';
  }

  async generate(messages: LLMMessage[], options?: GenerationOptions): Promise<GenerationResult> {
    const response = await this.client.chat.completions.create({
      model: options?.model || 'gpt-4-turbo',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options?.maxTokens,
      temperature: options?.temperature ?? 0.7,
      stop: options?.stop,
    });

    const choice = response.choices[0];
    const text = choice.message.content || '';

    return {
      text,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      raw: response,
    };
  }
}
