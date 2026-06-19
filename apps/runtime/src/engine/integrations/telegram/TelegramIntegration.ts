import https from 'node:https';
import { IntegrationDefinition, IntegrationEvent, IntegrationConfig } from '../IntegrationDefinition.js';

export function createTelegramIntegration(config: IntegrationConfig): IntegrationDefinition {
  const botToken = config.botToken;
  const chatId = config.channelId;

  return {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Send notifications and receive commands via Telegram',
    channel: 'telegram',
    config,
    async send(event: IntegrationEvent) {
      if (!botToken || !chatId) return false;

      const text = event.data?.text || event.data?.content || event.message || event.title;
      const body = JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      });

      return new Promise<boolean>((resolve) => {
        const url = new URL(`https://api.telegram.org/bot${botToken}/sendMessage`);
        const req = https.request(
          {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
            },
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed.ok === true);
              } catch {
                resolve(false);
              }
            });
          },
        );
        req.on('error', () => resolve(false));
        req.write(body);
        req.end();
      });
    },
    async validate() {
      const errors: string[] = [];
      if (!botToken) errors.push('botToken required');
      if (!chatId) errors.push('channelId required');
      return { valid: errors.length === 0, error: errors.join('; ') || undefined };
    },
  };
}
