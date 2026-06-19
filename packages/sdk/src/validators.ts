import { z } from 'zod';

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const MemoryTierConfigSchema = z.object({
  read: z.array(z.string()),
  write: z.array(z.string()),
});

export const BaseWorkflowNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  position: PositionSchema,
  dependencies: z.array(z.string()).optional(),
});

export const AgentNodeSchema = BaseWorkflowNodeSchema.extend({
  type: z.literal('agent'),
  role: z.string(),
  model: z.string(),
  tools: z.array(z.string()),
  memory_tier: MemoryTierConfigSchema,
});

export const InputNodeSchema = BaseWorkflowNodeSchema.extend({
  type: z.literal('input'),
  schema: z.record(z.enum(['string', 'number', 'boolean'])),
});

export const OutputNodeSchema = BaseWorkflowNodeSchema.extend({
  type: z.literal('output'),
});

export const WorkflowNodeSchema = z.discriminatedUnion('type', [
  AgentNodeSchema,
  InputNodeSchema,
  OutputNodeSchema,
]);

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  namespace_prefix: z.string(),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
});

export const AgentPolicySchema = z.object({
  budgetCap: z.number().min(0),
  budgetUsed: z.number().min(0),
  protocolWhitelist: z.array(z.string()),
  toolWhitelist: z.array(z.string()),
  expiryEpoch: z.number().min(0),
  isActive: z.boolean(),
});

export const ActivityEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  action: z.string(),
  protocol: z.string(),
  amountSpent: z.number(),
  txDigest: z.string(),
  status: z.enum(['pending', 'success', 'failed']),
});

export const AgentConfigSchema = z.object({
  walletAddress: z.string().nullable(),
  policy: AgentPolicySchema,
  skills: z.array(z.string()),
  services: z.array(z.string()),
  tools: z.array(z.string()),
  integrations: z.array(z.string()),
});

// === On-Chain Schemas ===

export const AgentPolicyOnChainSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  owner: z.string(),
  agent_wallet: z.string(),
  budget_cap: z.number(),
  budget_used: z.number(),
  protocol_whitelist: z.array(z.string()),
  tool_whitelist: z.array(z.string()),
  expiry_epoch: z.number(),
  is_active: z.boolean(),
});

export const ActivityEntryOnChainSchema = z.object({
  timestamp_ms: z.number(),
  action: z.string(),
  protocol: z.string(),
  amount_spent: z.number(),
  tx_digest: z.string(),
  status: z.number(),
});

export const ExecutionResultSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  outputs: z.record(z.string()),
  logs: z.array(z.object({
    timestamp: z.number(),
    nodeId: z.string(),
    nodeLabel: z.string(),
    type: z.enum(['recall', 'remember', 'llm', 'tool', 'error', 'info']),
    message: z.string(),
  })),
  startedAt: z.number(),
  completedAt: z.number().optional(),
});
