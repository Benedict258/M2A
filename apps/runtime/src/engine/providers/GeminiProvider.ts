import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMMessage, GenerationOptions, GenerationResult } from './Provider.js';

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  getProviderId(): string {
    return 'gemini';
  }

  async generate(messages: LLMMessage[], options?: GenerationOptions): Promise<GenerationResult> {
    const model = this.genAI.getGenerativeModel({ 
      model: options?.model || 'gemini-1.5-pro' 
    });

    const systemInstruction = messages.find(m => m.role === 'system')?.content;
    const history = messages.filter(m => m.role !== 'system').slice(0, -1);
    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history: history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens,
      },
      // Note: System instruction is handled via the model config in some versions
      // but for simplicity we can also prepend it to the first user message if needed.
    });

    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return {
      text,
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
      },
      raw: result,
    };
  }
}
