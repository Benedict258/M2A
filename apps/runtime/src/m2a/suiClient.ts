import { SuiGrpcClient } from '@mysten/sui/grpc';
import { bcs } from '@mysten/sui/bcs';
import { suiNetwork, suiRpcUrl } from '../config.js';

export interface SuiReaderConfig {
  rpcUrl?: string;
  packageId?: string;
}

export interface PolicyData {
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

function parsePolicyFields(id: string, fields: Record<string, unknown>): PolicyData {
  return {
    id,
    agentId: fields.agent_id as string,
    owner: fields.owner as string,
    agentWallet: fields.agent_wallet as string,
    budgetCap: Number(fields.budget_cap ?? 0),
    budgetUsed: Number(fields.budget_used ?? 0),
    protocolWhitelist: (fields.protocol_whitelist as string[]) ?? [],
    toolWhitelist: (fields.tool_whitelist as string[]) ?? [],
    expiryEpoch: Number(fields.expiry_epoch ?? 0),
    isActive: Boolean(fields.is_active),
  };
}

export class SuiReader {
  private client: SuiGrpcClient;
  private packageId?: string;

  constructor(config: SuiReaderConfig = {}) {
    this.client = new SuiGrpcClient({ network: suiNetwork(), baseUrl: config.rpcUrl || suiRpcUrl() });
    this.packageId = config.packageId;
  }

  async getPolicy(policyObjectId: string): Promise<PolicyData | null> {
    try {
      const res = await this.client.getObject({ objectId: policyObjectId, include: { json: true } });
      const fields = res.object?.json;
      if (!fields) return null;
      return parsePolicyFields(policyObjectId, fields as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async getAgentPolicy(registryId: string, agentWalletAddress: string): Promise<PolicyData | null> {
    try {
      const addressBytes = bcs.Address.serialize(agentWalletAddress).toBytes();
      const res = await this.client.getDynamicField({
        parentId: registryId,
        name: { type: 'address', bcs: addressBytes },
      });
      const dynamicField = res.dynamicField;
      if (dynamicField.$kind !== 'DynamicObject' || !dynamicField.childId) return null;
      return this.getPolicy(dynamicField.childId);
    } catch {
      return null;
    }
  }

  async getOwnerAgents(registryId: string, ownerAddress: string): Promise<PolicyData[]> {
    const results: PolicyData[] = [];
    let cursor: string | null = null;
    try {
      do {
        const pageResult: { hasNextPage: boolean; cursor: string | null; dynamicFields: any[] } = await this.client.listDynamicFields({ parentId: registryId, cursor, limit: 50 });
        const ids: string[] = [];
        for (const entry of pageResult.dynamicFields) {
          if (entry.$kind === 'DynamicObject' && entry.childId) {
            ids.push(entry.childId);
          }
        }
        if (ids.length > 0) {
          const batch = await this.client.getObjects({ objectIds: ids, include: { json: true } });
          for (const item of batch.objects) {
            if ('json' in item && item.json) {
              const fields = item.json as Record<string, unknown>;
              if (String(fields.owner ?? '') === ownerAddress) {
                results.push(parsePolicyFields(item.objectId, fields));
              }
            }
          }
        }
        cursor = pageResult.hasNextPage ? (pageResult.cursor ?? null) : null;
      } while (cursor);
    } catch {
      return results;
    }
    return results;
  }
}
