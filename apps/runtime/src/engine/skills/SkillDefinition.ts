export interface SkillParams {
  [key: string]: any;
}

export interface ExecutionContext {
  agentId: string;
  agentWallet: { address: string };
  userContext: any;
  network: string;
}

export interface SkillResult {
  success: boolean;
  data?: any;
  error?: string;
  txDigest?: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: 'defi' | 'nft' | 'gaming' | 'social' | 'data';
  subcategory: 'lending' | 'trading' | 'yield' | 'mint' | 'transfer' | 'query';
  protocols: string[];
  requiredTools: string[];
  requiredServices: string[];
  requiresFunds: boolean;
  inputSchema: Record<string, any>;
  execute(params: SkillParams, context: ExecutionContext): Promise<SkillResult>;
}
