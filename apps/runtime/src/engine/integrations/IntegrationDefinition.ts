export interface IntegrationEvent {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: number;
}

export interface IntegrationConfig {
  webhookUrl?: string;
  botToken?: string;
  channelId?: string;
  apiKey?: string;
  recipients?: string[];
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  channel: 'telegram' | 'discord' | 'email' | 'slack' | 'whatsapp';
  config: IntegrationConfig;
  send(event: IntegrationEvent): Promise<boolean>;
  validate(): Promise<{ valid: boolean; error?: string }>;
}
