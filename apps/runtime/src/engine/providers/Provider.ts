export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
}

export interface GenerationResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: any;
}

/**
 * Base interface for all LLM providers.
 * Allows the M2A Engine to be agnostic of the specific model being used.
 */
export interface LLMProvider {
  /**
   * Generates a single textual response.
   */
  generate(messages: LLMMessage[], options?: GenerationOptions): Promise<GenerationResult>;

  /**
   * Returns the unique identifier for this provider (e.g., 'anthropic', 'openai').
   */
  getProviderId(): string;
}
