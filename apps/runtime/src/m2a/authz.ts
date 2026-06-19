import type { RuntimeAuthzRequest, RuntimeAuthzResponse } from './types.js';
import { SuiReader } from './suiClient.js';
import { suiRpcUrl, resolveNetworkVar } from '../config.js';

const DEFAULT_DENY_REASON = 'action denied by runtime policy';

let suiReader: SuiReader | null = null;

function getSuiReader(): SuiReader | null {
  if (!suiReader) {
    const packageId = resolveNetworkVar('M2A_PACKAGE_ID');
    if (suiRpcUrl() && packageId) {
      suiReader = new SuiReader({ packageId });
    }
  }
  return suiReader;
}

export async function authorizeM2AAction(input: RuntimeAuthzRequest): Promise<RuntimeAuthzResponse> {
  if (!input.agentId || !input.action) {
    return { allowed: false, reason: 'missing agentId or action' };
  }

  const blockedTools = new Set((process.env.M2A_BLOCKED_TOOLS || '').split(',').map((entry) => entry.trim()).filter(Boolean));
  if (input.tool && blockedTools.has(input.tool)) {
    return { allowed: false, reason: `tool ${input.tool} is blocked`, policyVersion: 1 };
  }

  const blockedActions = new Set((process.env.M2A_BLOCKED_ACTIONS || '').split(',').map((entry) => entry.trim()).filter(Boolean));
  if (blockedActions.has(input.action)) {
    return { allowed: false, reason: DEFAULT_DENY_REASON, policyVersion: 1 };
  }

  const reader = getSuiReader();
  const packageId = resolveNetworkVar('M2A_PACKAGE_ID');
  const registryId = resolveNetworkVar('M2A_REGISTRY_ID');

  if (!reader || !packageId || !registryId) {
    return { allowed: true, policyVersion: 1 };
  }

  const agentWallet = input.agentWallet;
  if (!agentWallet) {
    console.warn('[authz] no agentWallet provided, skipping on-chain policy check');
    return { allowed: true, policyVersion: 1 };
  }

  try {
    const policy = await reader.getAgentPolicy(registryId, agentWallet);
    if (!policy) {
      console.warn(`[authz] on-chain policy not found for wallet ${agentWallet}, falling back to env`);
      return { allowed: true, policyVersion: 1 };
    }

    if (!policy.isActive) {
      return { allowed: false, reason: 'policy is not active', policyVersion: 1 };
    }

    if (policy.expiryEpoch > 0) {
      const currentEpoch = await fetchCurrentEpoch();
      if (currentEpoch !== null && currentEpoch > policy.expiryEpoch) {
        return { allowed: false, reason: 'policy has expired', policyVersion: 1 };
      }
    }

    const budgetRemaining = policy.budgetCap - policy.budgetUsed;
    if (budgetRemaining <= 0) {
      return { allowed: false, reason: 'budget exceeded', policyVersion: 1 };
    }

    if (input.action && policy.protocolWhitelist.length > 0) {
      if (!policy.protocolWhitelist.includes(input.action)) {
        return { allowed: false, reason: `protocol ${input.action} not in allowed list`, policyVersion: 1 };
      }
    }

    if (input.tool && policy.toolWhitelist.length > 0) {
      if (!policy.toolWhitelist.includes(input.tool)) {
        return { allowed: false, reason: `tool ${input.tool} not in allowed list`, policyVersion: 1 };
      }
    }

    return { allowed: true, policyVersion: 1 };
  } catch (err) {
    console.warn(`[authz] on-chain check failed for agent ${input.agentId}:`, err);
    return { allowed: true, policyVersion: 1 };
  }
}

async function fetchCurrentEpoch(): Promise<number | null> {
  try {
    const res = await fetch(suiRpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'suix_getLatestSuiSystemState',
        params: [],
      }),
    });
    const json = await res.json();
    return json.result?.epoch ? Number(json.result.epoch) : null;
  } catch {
    return null;
  }
}