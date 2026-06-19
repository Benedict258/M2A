import { LLMProvider } from './Provider.js';
import { AnthropicProvider } from './AnthropicProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { DeepSeekProvider } from './DeepSeekProvider.js';
import { GroqProvider } from './GroqProvider.js';
import { OpenRouterProvider } from './OpenRouterProvider.js';
import { GitHubProvider } from './GitHubProvider.js';

/**
 * Manages the available LLM providers in the system.
 * Allows for dynamic switching between different models based on configuration.
 */
export class ProviderRegistry {
  private providers: Map<string, LLMProvider> = new Map();

  constructor() {
    // Initialize with environment variables if available
    if (process.env.ANTHROPIC_API_KEY) {
      this.registerProvider(new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
      console.log('🤖 Registered Anthropic Provider');
    }
    if (process.env.OPENAI_API_KEY) {
      this.registerProvider(new OpenAIProvider(process.env.OPENAI_API_KEY));
      console.log('🤖 Registered OpenAI Provider');
    }
    if (process.env.GEMINI_API_KEY) {
      this.registerProvider(new GeminiProvider(process.env.GEMINI_API_KEY));
      console.log('🤖 Registered Gemini Provider');
    }
    if (process.env.DEEPSEEK_API_KEY) {
      this.registerProvider(new DeepSeekProvider(process.env.DEEPSEEK_API_KEY));
      console.log('🤖 Registered DeepSeek Provider');
    }
    if (process.env.GROQ_API_KEY) {
      this.registerProvider(new GroqProvider(process.env.GROQ_API_KEY));
      console.log('🤖 Registered Groq Provider');
    }
    if (process.env.OPENROUTER_API_KEY) {
      this.registerProvider(new OpenRouterProvider(process.env.OPENROUTER_API_KEY));
      console.log('🤖 Registered OpenRouter Provider');
    }
    if (process.env.GITHUB_TOKEN) {
      this.registerProvider(new GitHubProvider(process.env.GITHUB_TOKEN));
      console.log('🤖 Registered GitHub Provider');
    }
  }

  registerProvider(provider: LLMProvider) {
    this.providers.set(provider.getProviderId(), provider);
  }

  getProvider(id: string): LLMProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`LLM Provider '${id}' not found or API key not configured.`);
    }
    return provider;
  }

  /**
   * Resolves a provider based on a model name (e.g., 'gpt-4' -> 'openai').
   */
  resolveProviderForModel(modelName: string): LLMProvider {
    const name = modelName.toLowerCase();
    if (name.includes('claude')) return this.getProvider('anthropic');
    if (name.includes('gpt')) {
      // Prefer GitHub for GPT if token is present (since it might be free)
      try { return this.getProvider('github'); } catch { return this.getProvider('openai'); }
    }
    if (name.includes('gemini')) return this.getProvider('gemini');
    if (name.includes('deepseek')) return this.getProvider('deepseek');
    if (name.includes('groq') || name.includes('llama')) {
      if (this.providers.has('groq')) return this.getProvider('groq');
      if (this.providers.has('openrouter')) return this.getProvider('openrouter');
      throw new Error(`Model '${modelName}' requires either Groq or OpenRouter to be configured.`);
    }
    if (name.includes('github')) return this.getProvider('github');
    if (name.includes('openrouter')) return this.getProvider('openrouter');
    
    // Default to the first available provider
    const defaultProvider = this.providers.values().next().value;
    if (!defaultProvider) {
      throw new Error('No LLM Providers are configured. Please add at least one API key (ANTHROPIC, OPENAI, GEMINI, etc.) to your .env file.');
    }
    return defaultProvider;
  }
}

// Export a singleton instance
export const providers = new ProviderRegistry();
