import nodemailer from 'nodemailer';
import { IntegrationDefinition, IntegrationConfig } from '../IntegrationDefinition.js';

export function createEmailIntegration(config: IntegrationConfig): IntegrationDefinition {
  const from = config.from || '';
  const transporter = nodemailer.createTransport({
    host: config.host || 'smtp.gmail.com',
    port: config.port || 587,
    secure: config.secure ?? false,
    auth: { user: config.user || '', pass: config.pass || '' },
  });

  return {
    id: 'email',
    name: 'Email',
    description: 'Send emails via SMTP',
    channel: 'email',
    config,
    async send(event) {
      try {
        const info = await transporter.sendMail({
          from,
          to: event.data?.to || '',
          subject: event.data?.subject || 'M2A Agent Message',
          text: event.data?.text || '',
          html: event.data?.html,
        });
        return info.accepted.length > 0;
      } catch {
        return false;
      }
    },
    async validate() {
      const errors: string[] = [];
      if (!config.user) errors.push('user required');
      if (!config.pass) errors.push('pass required');
      if (!config.from) errors.push('from required');
      return { valid: errors.length === 0, error: errors.join('; ') || undefined };
    },
  };
}
