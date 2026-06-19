export type MemoryTierType = 'private' | 'pool' | 'workspace';

export interface MemoryTierConfig {
  read: string[];
  write: string[];
}

export interface RecallMemory {
  namespace: string;
  content: string;
  timestamp: number;
  distance?: number;
}

export interface BaseWorkflowNode {
  id: string;
  type: 'agent' | 'input' | 'output' | 'condition';
  label: string;
  position: { x: number; y: number };
  dependencies?: string[];
}

export interface AgentWorkflowNode extends BaseWorkflowNode {
  type: 'agent';
  role: string;
  model: string;
  tools: string[];
  memory_tier: MemoryTierConfig;
}

export interface InputWorkflowNode extends BaseWorkflowNode {
  type: 'input';
  schema: Record<string, 'string' | 'number' | 'boolean'>;
}

export interface OutputWorkflowNode extends BaseWorkflowNode {
  type: 'output';
}

export type WorkflowNode = AgentWorkflowNode | InputWorkflowNode | OutputWorkflowNode;

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
