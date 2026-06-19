import { IntegrationDefinition, IntegrationEvent } from './IntegrationDefinition.js';

export class IntegrationRegistry {
  private integrations: Map<string, IntegrationDefinition> = new Map();

  register(integration: IntegrationDefinition) {
    this.integrations.set(integration.id, integration);
  }

  get(id: string): IntegrationDefinition | undefined {
    return this.integrations.get(id);
  }

  getAll(): IntegrationDefinition[] {
    return Array.from(this.integrations.values());
  }

  getByChannel(channel: string): IntegrationDefinition[] {
    return this.getAll().filter(i => i.channel === channel);
  }

  async send(id: string, event: IntegrationEvent): Promise<boolean> {
    const integration = this.get(id);
    if (!integration) throw new Error(`Integration '${id}' not found`);
    return integration.send(event);
  }

  async broadcast(event: IntegrationEvent): Promise<{ id: string; sent: boolean }[]> {
    const results = await Promise.all(
      this.getAll().map(async (i) => ({
        id: i.id,
        sent: await i.send(event),
      }))
    );
    return results;
  }

  getIntegrationDefinitions() {
    return this.getAll().map(i => ({
      id: i.id,
      name: i.name,
      description: i.description,
      channel: i.channel,
      config: {
        ...i.config,
        botToken: i.config.botToken ? '***' : undefined,
        apiKey: i.config.apiKey ? '***' : undefined,
      },
    }));
  }
}

export const integrationRegistry = new IntegrationRegistry();
