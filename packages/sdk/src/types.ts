export type MemoryTierType = 'private' | 'pool' | 'workspace';

export interface MemoryTierConfig {
  read: string[];
  write: string[];
  tier?: 'hot' | 'cold';
}

export interface RecallMemory {
  namespace: string;
  content: string;
  timestamp: number;
  distance?: number;
}

export interface BaseWorkflowNode {
  id: string;
  type: 'agent' | 'input' | 'output' | 'condition' | 'walrus' | 'sui' | 'http' | 'conditional' | 'file' | 'agent_spawn' | 'webhook_trigger' | 'schedule_trigger' | 'merge' | 'aftermath' | 'navi' | 'suilend' | 'haedal' | 'volo' | 'bucket' | 'loop' | 'code' | 'bluefin' | 'pyth' | 'switchboard' | 'tradeport' | 'event_trigger' | 'wormhole' | 'sui_bridge' | 'alphafi' | 'google_sheets' | 'airtable' | 'notion' | 'twitter' | 'rss_reader' | 'csv_parser' | 'ipfs' | 'form_trigger' | 'discord_trigger' | 'price_alert' | 'balance_monitor' | 'nft_floor_alert' | 'counter' | 'email' | 'slack' | 'discord' | 'telegram_send' | 'wait' | 'json_parser' | 'suins';
  label: string;
  position: { x: number; y: number };
  dependencies?: string[];
  data?: Record<string, unknown>;
}

export interface AgentWorkflowNode extends BaseWorkflowNode {
  type: 'agent';
  role: string;
  model: string;
  tools: string[];
  memory_tier: MemoryTierConfig;
  data?: Record<string, unknown>;
}

export interface InputWorkflowNode extends BaseWorkflowNode {
  type: 'input';
  schema: Record<string, 'string' | 'number' | 'boolean'>;
}

export interface OutputWorkflowNode extends BaseWorkflowNode {
  type: 'output';
}

export interface WalrusWorkflowNode extends BaseWorkflowNode {
  type: 'walrus';
  action?: 'store' | 'fetch';
}

export interface SuiWorkflowNode extends BaseWorkflowNode {
  type: 'sui';
  action?: string;
}

export interface HttpWorkflowNode extends BaseWorkflowNode {
  type: 'http';
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface ConditionalWorkflowNode extends BaseWorkflowNode {
  type: 'conditional';
  condition?: string;
  trueOutput?: string;
  falseOutput?: string;
}

export interface FileWorkflowNode extends BaseWorkflowNode {
  type: 'file';
  action?: 'store' | 'fetch';
  blobId?: string;
}

export interface AgentSpawnWorkflowNode extends BaseWorkflowNode {
  type: 'agent_spawn';
  role?: string;
  model?: string;
  tools?: string[];
}

export interface WebhookTriggerNode extends BaseWorkflowNode {
  type: 'webhook_trigger';
  data?: {
    label?: string;
    method?: 'GET' | 'POST';
    webhookToken?: string;
  };
}

export interface ScheduleTriggerNode extends BaseWorkflowNode {
  type: 'schedule_trigger';
  data?: {
    label?: string;
    cronExpression?: string;
  };
}

export interface MergeNode extends BaseWorkflowNode {
  type: 'merge';
  data?: {
    label?: string;
    strategy?: 'concat' | 'first' | 'last' | 'json_array';
  };
}

export interface AftermathNode extends BaseWorkflowNode {
  type: 'aftermath';
  data?: { label?: string; action?: 'swap' | 'quote'; coinInType?: string; coinOutType?: string; amountIn?: string; slippage?: number };
}

export interface NaviNode extends BaseWorkflowNode {
  type: 'navi';
  data?: { label?: string; action?: 'supply' | 'borrow' | 'repay' | 'getPosition'; assetType?: string; amount?: string };
}

export interface SuilendNode extends BaseWorkflowNode {
  type: 'suilend';
  data?: { label?: string; action?: 'lend' | 'borrow' | 'getPosition'; assetType?: string; amount?: string };
}

export interface HaedalNode extends BaseWorkflowNode {
  type: 'haedal';
  data?: { label?: string; action?: 'stake' | 'unstake' | 'info'; amount?: string; };
}

export interface VoloNode extends BaseWorkflowNode {
  type: 'volo';
  data?: { label?: string; action?: 'stake' | 'unstake' | 'apr'; amount?: string; };
}

export interface BucketNode extends BaseWorkflowNode {
  type: 'bucket';
  data?: { label?: string; action?: 'mint' | 'redeem' | 'ratio'; amount?: string; };
}

export interface BluefinNode extends BaseWorkflowNode {
  type: 'bluefin';
  data?: { label?: string; action?: 'open_position' | 'close_position' | 'markets'; market?: string; side?: 'long' | 'short'; marginAmount?: string; leverage?: number; positionId?: string; };
}

export interface PythNode extends BaseWorkflowNode {
  type: 'pyth';
  data?: { label?: string; action?: 'get_price' | 'get_ema' | 'list_feeds'; priceFeedId?: string; };
}

export interface SwitchboardNode extends BaseWorkflowNode {
  type: 'switchboard';
  data?: { label?: string; action?: 'get_feed' | 'request_update'; feedAddress?: string; };
}

export interface TradeportNode extends BaseWorkflowNode {
  type: 'tradeport';
  data?: { label?: string; action?: 'get_floor' | 'get_listings'; collectionSlug?: string; limit?: number; };
}

export interface EventTriggerNode extends BaseWorkflowNode {
  type: 'event_trigger';
  data?: { label?: string; packageId?: string; moduleName?: string; eventName?: string; workflowId?: string; };
}

export interface LoopNode extends BaseWorkflowNode {
  type: 'loop';
  data?: {
    label?: string;
    maxIterations?: number;
    itemsJsonPath?: string;
  };
}

export interface CodeNode extends BaseWorkflowNode {
  type: 'code';
  data?: {
    label?: string;
    language?: 'typescript' | 'javascript';
    code?: string;
  };
}

export interface WormholeNode extends BaseWorkflowNode {
  type: 'wormhole';
  data?: { label?: string; action?: 'transfer' | 'get_vaa'; targetChain?: number; targetAddress?: string; tokenType?: string; amount?: string; };
}

export interface SuiBridgeNode extends BaseWorkflowNode {
  type: 'sui_bridge';
  data?: { label?: string; action?: 'bridge_to_eth' | 'claim' | 'status'; amount?: string; ethDestination?: string; };
}

export interface AlphaFiNode extends BaseWorkflowNode {
  type: 'alphafi';
  data?: { label?: string; action?: 'deposit' | 'withdraw' | 'vaults' | 'position'; vaultType?: string; amount?: string; };
}

export interface GoogleSheetsNode extends BaseWorkflowNode {
  type: 'google_sheets';
  data?: { label?: string; action?: 'append' | 'read'; spreadsheetId?: string; range?: string; apiKey?: string; };
}

export interface AirtableNode extends BaseWorkflowNode {
  type: 'airtable';
  data?: { label?: string; action?: 'list' | 'create'; baseId?: string; tableName?: string; apiKey?: string; };
}

export interface NotionNode extends BaseWorkflowNode {
  type: 'notion';
  data?: { label?: string; action?: 'query' | 'create_page'; apiKey?: string; databaseId?: string; };
}

export interface TwitterNode extends BaseWorkflowNode {
  type: 'twitter';
  data?: { label?: string; bearerToken?: string; };
}

export interface RssReaderNode extends BaseWorkflowNode {
  type: 'rss_reader';
  data?: { label?: string; feedUrl?: string; limit?: number; };
}

export interface CsvParserNode extends BaseWorkflowNode {
  type: 'csv_parser';
  data?: { label?: string; delimiter?: string; hasHeader?: boolean; };
}

export interface IpfsNode extends BaseWorkflowNode {
  type: 'ipfs';
  data?: { label?: string; service?: 'pinata' | 'web3_storage'; apiKey?: string; apiSecret?: string; };
}

export interface FormTriggerNode extends BaseWorkflowNode {
  type: 'form_trigger';
  data?: { label?: string; formToken?: string; fields?: string[]; };
}

export interface DiscordTriggerNode extends BaseWorkflowNode {
  type: 'discord_trigger';
  data?: { label?: string; botToken?: string; channelId?: string; };
}

export interface PriceAlertTriggerNode extends BaseWorkflowNode {
  type: 'price_alert';
  data?: { label?: string; priceFeedId?: string; threshold?: string; direction?: 'above' | 'below'; checkInterval?: number; };
}

export interface BalanceMonitorNode extends BaseWorkflowNode {
  type: 'balance_monitor';
  data?: { label?: string; walletAddress?: string; threshold?: string; direction?: 'above' | 'below'; };
}

export interface NftFloorAlertNode extends BaseWorkflowNode {
  type: 'nft_floor_alert';
  data?: { label?: string; collectionSlug?: string; threshold?: string; };
}

export interface CounterNode extends BaseWorkflowNode {
  type: 'counter';
  data?: { label?: string; counterId?: string; action?: 'increment' | 'decrement' | 'reset' | 'get'; resetValue?: number; };
}

export interface EmailNode extends BaseWorkflowNode {
  type: 'email';
  data?: { label?: string; to?: string; subject?: string; from?: string; smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPass?: string; };
}

export interface SlackNode extends BaseWorkflowNode {
  type: 'slack';
  data?: { label?: string; webhookUrl?: string; };
}

export interface DiscordNode extends BaseWorkflowNode {
  type: 'discord';
  data?: { label?: string; webhookUrl?: string; };
}

export interface TelegramSendNode extends BaseWorkflowNode {
  type: 'telegram_send';
  data?: { label?: string; botToken?: string; chatId?: string; };
}

export interface WaitNode extends BaseWorkflowNode {
  type: 'wait';
  data?: { label?: string; durationMs?: number; };
}

export interface JsonParserNode extends BaseWorkflowNode {
  type: 'json_parser';
  data?: { label?: string; extractPath?: string; };
}

export interface SuiNSNode extends BaseWorkflowNode {
  type: 'suins';
  data?: { label?: string; name?: string; action?: 'resolve' | 'reverse'; };
}

export type WorkflowNode = AgentWorkflowNode | InputWorkflowNode | OutputWorkflowNode | WalrusWorkflowNode | SuiWorkflowNode | HttpWorkflowNode | ConditionalWorkflowNode | FileWorkflowNode | AgentSpawnWorkflowNode | WebhookTriggerNode | ScheduleTriggerNode | MergeNode | AftermathNode | NaviNode | SuilendNode | HaedalNode | VoloNode | BucketNode | LoopNode | CodeNode | BluefinNode | PythNode | SwitchboardNode | TradeportNode | EventTriggerNode | WormholeNode | SuiBridgeNode | AlphaFiNode | GoogleSheetsNode | AirtableNode | NotionNode | TwitterNode | RssReaderNode | CsvParserNode | IpfsNode | FormTriggerNode | DiscordTriggerNode | PriceAlertTriggerNode | BalanceMonitorNode | NftFloorAlertNode | CounterNode | EmailNode | SlackNode | DiscordNode | TelegramSendNode | WaitNode | JsonParserNode | SuiNSNode;

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  namespace_prefix: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  errorFallbackId?: string;
}

// === Policy Types ===
export interface AgentPolicy {
  budgetCap: number;
  budgetUsed: number;
  protocolWhitelist: string[];
  toolWhitelist: string[];
  expiryEpoch: number;
  isActive: boolean;
}

export interface ActivityEntry {
  id: string;
  timestamp: number;
  action: string;
  protocol: string;
  amountSpent: number;
  txDigest: string;
  status: 'pending' | 'success' | 'failed';
}

// === On-Chain Types (matching Move structs in snake_case) ===

export interface AgentPolicyOnChain {
  id: string;
  agent_id: string;
  owner: string;
  agent_wallet: string;
  budget_cap: number;
  budget_used: number;
  protocol_whitelist: string[];
  tool_whitelist: string[];
  expiry_epoch: number;
  is_active: boolean;
}

export interface ActivityEntryOnChain {
  timestamp_ms: number;
  action: string;
  protocol: string;
  amount_spent: number;
  tx_digest: string;
  status: number;
}

export interface ActivityLogOnChain {
  id: string;
  agent_id: string;
  entries: { id: string; size: number };
  next_id: number;
}

export interface CapabilityOnChain {
  id: string;
  agent_id: string;
  scope: number[];
  expires_at: number;
  revoked: boolean;
}

// === Conversion Functions ===

export function fromOnChainPolicy(onChain: AgentPolicyOnChain): AgentPolicy {
  return {
    budgetCap: onChain.budget_cap,
    budgetUsed: onChain.budget_used,
    protocolWhitelist: onChain.protocol_whitelist,
    toolWhitelist: onChain.tool_whitelist,
    expiryEpoch: onChain.expiry_epoch,
    isActive: onChain.is_active,
  };
}

// === Plugin Types ===
export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  protocols: string[];
  requiresAuth: boolean;
  requiresFunds: boolean;
}

export type PluginCategory = 'skill' | 'service' | 'tool' | 'integration';
export type PluginChannel = 'telegram' | 'discord' | 'email' | 'slack' | 'whatsapp';

export interface SkillDefinitionData {
  id: string;
  name: string;
  description: string;
  category: 'defi' | 'nft' | 'gaming' | 'social' | 'data';
  subcategory: 'lending' | 'trading' | 'yield' | 'mint' | 'transfer' | 'query';
  protocols: string[];
  requiresFunds: boolean;
  inputSchema: Record<string, any>;
}

export interface ServiceDefinitionData {
  id: string;
  name: string;
  description: string;
  category: 'sui' | 'defi' | 'storage' | 'ai';
  requiresAuth: boolean;
  requiresFunds: boolean;
  methods: string[];
}

export interface ToolDefinitionData {
  id: string;
  name: string;
  description: string;
  category: 'blockchain' | 'storage' | 'web' | 'data';
  inputSchema: Record<string, any>;
}

export interface IntegrationDefinitionData {
  id: string;
  name: string;
  description: string;
  channel: PluginChannel;
}

// === Agent Config ===
export interface AgentConfig {
  walletAddress: string | null;
  policy: AgentPolicy;
  skills: string[];
  services: string[];
  tools: string[];
  integrations: string[];
}

// === Execution Types ===
export interface ExecutionResult {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  outputs: Record<string, string>;
  logs: ExecutionLogEntry[];
  startedAt: number;
  completedAt?: number;
}

export interface ExecutionLogEntry {
  timestamp: number;
  nodeId: string;
  nodeLabel: string;
  type: 'recall' | 'remember' | 'llm' | 'tool' | 'error' | 'info';
  message: string;
}
