import { SkillDefinition, SkillParams, ExecutionContext, SkillResult } from '../SkillDefinition.js';

export interface DeFiProtocolConfig {
  protocolName: string;
  poolId: string;
  assetType: string;
}

export const defiBaseSkill: SkillDefinition = {
  id: 'defi-base',
  name: 'DeFi Base',
  description: 'Base DeFi operations - deposit, withdraw, swap, lend, borrow',
  category: 'defi',
  subcategory: 'yield',
  protocols: ['deepbook', 'cetus'],
  requiredTools: ['sui-tx'],
  requiredServices: ['deepbook', 'cetus', 'sui-rpc'],
  requiresFunds: true,
  inputSchema: {
    type: 'object',
    properties: {
      protocol: { type: 'string', enum: ['deepbook', 'cetus'], description: 'Target protocol' },
      action: { type: 'string', enum: ['deposit', 'withdraw', 'swap', 'lend', 'borrow'], description: 'Action to perform' },
      pool: { type: 'string', description: 'Pool/manager ID' },
      amount: { type: 'number', description: 'Amount in MIST' },
      assetType: { type: 'string', description: 'Asset type (e.g., 0x2::sui::SUI)' },
    },
    required: ['protocol', 'action', 'pool', 'amount'],
  },
  async execute(params: SkillParams, context: ExecutionContext): Promise<SkillResult> {
    try {
      const { protocol, action, pool, amount, assetType } = params;
      console.log(`[DeFi] ${action} ${amount} on ${protocol} pool ${pool}`);

      return {
        success: true,
        data: {
          protocol,
          action,
          pool,
          amount,
          assetType: assetType || '0x2::sui::SUI',
          status: 'simulated',
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
