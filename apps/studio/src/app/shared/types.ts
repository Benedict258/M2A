export interface Position {
  x: number;
  y: number;
}

export interface NodeDefinition {
  id: string;
  type: string;
  position: Position;
  data: Record<string, unknown>;
}

export interface EdgeDefinition {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: NodeDefinition[];
  edges: EdgeDefinition[];
  version: string;
  description?: string;
  category?: string;
}

export interface LogEntry {
  timestamp?: number;
  type: 'recall' | 'remember' | 'llm' | 'error' | 'info';
  message: string;
  nodeId: string;
  nodeLabel: string;
}

export interface WorkflowExecutionResult {
  nodeId: string;
  nodeLabel: string;
  status: 'success' | 'error';
  output: string;
  timestamp: number;
}

export interface AgentPolicy {
  id: string;
  agentId: string;
  owner: string;
  agentWallet: string;
  budgetCap: number;
  budgetUsed: number;
  protocolWhitelist: string[];
  toolWhitelist: string[];
  expiryEpoch: number;
  isActive: boolean;
}

export interface ActivityEntry {
  timestampMs: number;
  action: string;
  protocol: string;
  amountSpent: number;
  txDigest: string;
  status: number; // 0 = pending, 1 = success, 2 = error
}

export interface Agent {
  id: string;
  name: string;
  policyId: string;
  walletAddress: string;
  ownerAddress: string;
  status: 'active' | 'inactive';
  budgetCap: number;
  budgetUsed: number;
  createdAt: string;
  lastRunAt: string | null;
  activityLog: ActivityEntry[];
  protocols: string[];
  tools: string[];
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  nodeCount?: number;
  forkCount?: number;
  owner?: string;
  isPublic?: boolean;
  generate: () => WorkflowDefinition;
}

export interface PaletteNode {
  type: string;
  label: string;
  description: string;
  category: string;
  icon: string;
  color: string;
}
