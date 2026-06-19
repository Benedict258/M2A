import { ServiceDefinition } from '../ServiceDefinition.js';
import { providers } from '../../providers/ProviderRegistry.js';

export function createLLMService(config?: { provider?: string; model?: string }): ServiceDefinition {
  const defaultProvider = config?.provider;
  const defaultModel = config?.model;

  return {
    id: 'llm',
    name: 'LLM Service',
    description: 'Generate text using configured LLM providers',
    category: 'ai',
    requiresAuth: false,
    requiresFunds: false,
    methods: ['generate', 'chat', 'embed'],
    async execute(method, params) {
      const model = params.model || defaultModel || 'gemini-1.5-flash';
      const provider = defaultProvider
        ? providers.getProvider(defaultProvider)
        : providers.resolveProviderForModel(model);

      switch (method) {
        case 'generate': {
          const result = await provider.generate(
            [{ role: 'user', content: params.prompt }],
            { model }
          );
          return { content: result.text, provider: provider.getProviderId(), model };
        }
        case 'chat': {
          const result = await provider.generate(params.messages || []);
          return { content: result.text, provider: provider.getProviderId(), model };
        }
        default:
          throw new Error(`Method '${method}' not found on llm service`);
      }
    },
  };
}
