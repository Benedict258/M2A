import https from 'node:https';
import { IntegrationDefinition, IntegrationEvent, IntegrationConfig } from '../IntegrationDefinition.js';

export function createDiscordIntegration(config: IntegrationConfig): IntegrationDefinition {
  return {
    id: 'discord',
    name: 'Discord Webhook',
    description: 'Send notifications via Discord webhooks',
    channel: 'discord',
    config,
    async send(event: IntegrationEvent) {
      const webhookUrl = config.webhookUrl;
      if (!webhookUrl) return false;

      const content = event.data?.content || event.message || event.title;
      const username = event.data?.username || 'M2A Bot';

      return new Promise<boolean>((resolve) => {
        const data = JSON.stringify({ content, username });
        const url = new URL(webhookUrl);
        const req = https.request(
          {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
            },
          },
          (res) => {
            resolve(res.statusCode === 204 || res.statusCode === 200);
          },
        );
        req.on('error', () => resolve(false));
        req.write(data);
        req.end();
      });
    },
    async validate() {
      return { valid: true, error: config.webhookUrl ? undefined : 'webhookUrl required' };
    },
  };
}
