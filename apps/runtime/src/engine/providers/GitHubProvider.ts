import OpenAI from 'openai';
import { LLMProvider, LLMMessage, GenerationOptions, GenerationResult } from './Provider.js';

/**
 * GitHub Models provider leveraging their inference endpoint.
 */
export class GitHubProvider implements LLMProvider {
  private client: OpenAI;

  constructor(token: string) {
    this.client = new OpenAI({
      apiKey: token,
      baseURL: 'https://models.inference.ai.azure.com',
    });
  }

  getProviderId(): string {
    return 'github';
  }

  async generate(messages: LLMMessage[], options?: GenerationOptions): Promise<GenerationResult> {
    const response = await this.client.chat.completions.create({
      model: options?.model || 'gpt-4o', // Default to GPT-4o on GitHub
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
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      raw: response,
    };
  }
}
