import { Transaction } from '@mysten/sui/transactions';
import { createSuiClient, suiNetwork } from '../config.js';
import { resolve } from '@m2a/client';

const M2A_MODULE = 'm2a';

export function getM2APackageId(): string {
  return resolve('M2A_PACKAGE_ID') || '0x0';
}

export function getSuiNetwork(): string {
  return suiNetwork();
}

export function getSuiClient() {
  return createSuiClient();
}

export interface AgentPolicyOnChain {
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

export function buildCreateAgentTx(
  registryId: string,
  agentWallet: string,
  budgetCap: number,
  protocols: string[],
  tools: string[],
  expiryEpoch: number,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${getM2APackageId()}::${M2A_MODULE}::create_agent`,
    arguments: [
      tx.object(registryId),
      tx.pure.address(agentWallet),
      tx.pure.u64(budgetCap),
      tx.pure.vector('string', protocols),
      tx.pure.vector('string', tools),
      tx.pure.u64(expiryEpoch),
    ],
  });
  return tx;
}

export function buildTopUpAgentTx(
  policyId: string,
  coinId: string,
  amount: number,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${getM2APackageId()}::${M2A_MODULE}::top_up_agent`,
    arguments: [
      tx.object(policyId),
      tx.object(coinId),
      tx.pure.u64(amount),
    ],
  });
  return tx;
}

export function buildDeactivateAgentTx(
  policyId: string,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${getM2APackageId()}::${M2A_MODULE}::deactivate_agent`,
    arguments: [
      tx.object(policyId),
    ],
  });
  return tx;
}
