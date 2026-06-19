import { Injectable } from '@angular/core';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { environment } from '../../environments/environment';
import { dAppKit } from './dapp-kit';
import type { AgentPolicy, ActivityEntry } from './types';

@Injectable({ providedIn: 'root' })
export class SuiContractService {
  client: SuiGrpcClient;

  packageId = '';
  registryId = '';

  constructor() {
    const network = environment.suiNetwork === 'mainnet' ? 'mainnet' : 'testnet';
    this.client = new SuiGrpcClient({
      network,
      baseUrl: `https://fullnode.${network}.sui.io:443`,
    });

    this.packageId = (import.meta as any).env?.VITE_M2A_PACKAGE_ID || '';
    this.registryId = (import.meta as any).env?.VITE_M2A_REGISTRY_ID || '';
  }

  buildCreateAgentTx(
    agentWallet: string,
    budgetCap: number,
    protocols: string[],
    tools: string[],
    expiryEpoch: number,
    fundAmount?: number,
  ): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::m2a::create_agent`,
      arguments: [
        tx.object(this.registryId),
        tx.pure.address(agentWallet),
        tx.pure.u64(budgetCap),
        tx.pure('vector<string>', protocols),
        tx.pure('vector<string>', tools),
        tx.pure.u64(expiryEpoch),
      ],
    });
    if (fundAmount && fundAmount > 0) {
      const [agentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(fundAmount)]);
      tx.transferObjects([agentCoin], tx.pure.address(agentWallet));
    }
    return tx;
  }

  buildTopUpTx(policyId: string, amount: number): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::m2a::top_up_agent`,
      arguments: [tx.object(policyId), tx.gas, tx.pure.u64(amount)],
    });
    return tx;
  }

  buildDeactivateTx(policyId: string): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::m2a::deactivate_agent`,
      arguments: [tx.object(policyId)],
    });
    return tx;
  }

  buildFundAgentWalletTx(agentWallet: string, amount: number): Transaction {
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    tx.transferObjects([coin], tx.pure.address(agentWallet));
    return tx;
  }

  async executeTx(tx: Transaction): Promise<string> {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
    if (result.$kind === 'FailedTransaction') {
      throw new Error(result.FailedTransaction.status.error?.message || 'Transaction failed');
    }
    return result.Transaction.digest;
  }

  async fetchPolicy(policyId: string): Promise<AgentPolicy | null> {
    try {
      const obj = await this.client.getObject({ objectId: policyId });
      if (!obj) return null;
      const content = (obj as any).content;
      if (!content || content.dataType !== 'moveObject') return null;
      const f = content.fields as Record<string, any>;
      return {
        id: policyId,
        agentId: f['agent_id'],
        owner: f['owner'],
        agentWallet: f['agent_wallet'],
        budgetCap: Number(f['budget_cap']),
        budgetUsed: Number(f['budget_used']),
        protocolWhitelist: f['protocol_whitelist'] || [],
        toolWhitelist: f['tool_whitelist'] || [],
        expiryEpoch: Number(f['expiry_epoch']),
        isActive: f['is_active'],
      };
    } catch {
      return null;
    }
  }

  async fetchOwnerPolicyIds(ownerAddress: string): Promise<string[]> {
    try {
      const result = await this.client.getDynamicField({
        parentId: this.registryId,
        name: {
          type: 'address',
          bcs: bcs.Address.serialize(ownerAddress).toBytes(),
        },
      });
      if (!result) return [];
      const valueBcs = (result.dynamicField as any).value.bcs;
      const ids = bcs.vector(bcs.Address).parse(Uint8Array.from(atob(valueBcs), c => c.charCodeAt(0)));
      return ids.map((id: string) => id);
    } catch {
      return [];
    }
  }

  async fetchActivityLog(activityLogId: string): Promise<ActivityEntry[]> {
    try {
      const result = await this.client.listDynamicFields({ parentId: activityLogId });
      const fields = (result as any).dynamicFields || [];
      if (fields.length === 0) return [];

      const objs = await this.client.getObjects({
        objectIds: fields.map((d: any) => d.objectId),
      });
      const objectsList = (objs as any).objects || [];

      const entries: ActivityEntry[] = [];
      for (const obj of objectsList) {
        if (obj?.content?.dataType === 'moveObject') {
          const f = obj.content.fields as Record<string, any>;
          entries.push({
            timestampMs: Number(f['timestamp_ms']),
            action: f['action'],
            protocol: f['protocol'],
            amountSpent: Number(f['amount_spent']),
            txDigest: f['tx_digest'],
            status: Number(f['status']),
          });
        }
      }
      return entries.sort((a, b) => b.timestampMs - a.timestampMs);
    } catch {
      return [];
    }
  }

  async getCurrentEpoch(): Promise<number> {
    try {
      const state = await this.client.core.getCurrentSystemState();
      return Number(state.systemState.epoch);
    } catch {
      return 0;
    }
  }
}
