import OpenAI from 'openai';
import { LLMProvider, LLMMessage, GenerationOptions, GenerationResult } from './Provider.js';

/**
 * OpenRouter provider giving access to a vast array of models via a single API.
 */
export class OpenRouterProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://m2a.xyz', // Required by OpenRouter
        'X-Title': 'M2A Runtime',
      }
    });
  }

  getProviderId(): string {
    return 'openrouter';
  }

  async generate(messages: LLMMessage[], options?: GenerationOptions): Promise<GenerationResult> {
    const response = await this.client.chat.completions.create({
      model: options?.model || 'meta-llama/llama-3-8b-instruct:free',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options?.maxTokens,
      temperature: options?.temperature ?? 0.7,
    });

    const choice = response.choices[0];
    const text = choice.message.content || '';

    return {
      text,
      usage: {
        promptTokens: (response as any).usage?.prompt_tokens || 0,
        completionTokens: (response as any).usage?.completion_tokens || 0,
        totalTokens: (response as any).usage?.total_tokens || 0,
      },
      raw: response,
    };
  }
}
