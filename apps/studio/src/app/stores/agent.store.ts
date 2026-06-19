import { Injectable, signal, inject } from '@angular/core';
import { AuthStore } from './auth.store';
import { SuiContractService } from '../shared/contract.service';
import { ApiService } from '../shared/api.service';
import type { Agent } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class AgentStore {
  private auth = inject(AuthStore);
  private contract = inject(SuiContractService);
  private api = inject(ApiService);

  agents = signal<Agent[]>([]);
  selectedAgentId = signal<string | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  /** Fetch all agents for the current user from on-chain registry */
  async fetchAgents(): Promise<void> {
    const owner = this.auth.address();
    if (!owner) return;
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const policyIds = await this.contract.fetchOwnerPolicyIds(owner);
      const agents: Agent[] = [];

      for (const policyId of policyIds) {
        const policy = await this.contract.fetchPolicy(policyId);
        if (!policy) continue;

        const agentId = policy.agentId;
        const activityLog = await this.contract.fetchActivityLog(agentId);

        // Get metadata from backend (name, timestamps)
          let meta: { name?: string; createdAt?: string; lastRunAt?: string | null } = {};
          try {
            const resp = await fetch(`${(import.meta as any).env?.VITE_RUNTIME_URL || 'http://localhost:3001'}/api/v1/agents/${agentId}`);
            if (resp.ok) meta = await resp.json();
          } catch {}

        agents.push({
          id: agentId,
          name: meta.name || `Agent 0x${agentId.slice(0, 8)}`,
          policyId: policy.id,
          walletAddress: policy.agentWallet,
          ownerAddress: policy.owner,
          status: policy.isActive ? 'active' : 'inactive',
          budgetCap: policy.budgetCap,
          budgetUsed: policy.budgetUsed,
          createdAt: meta.createdAt || new Date(0).toISOString(),
          lastRunAt: meta.lastRunAt || null,
          activityLog,
          protocols: policy.protocolWhitelist,
          tools: policy.toolWhitelist,
        });
      }

      this.agents.set(agents);
      if (agents.length > 0 && !this.selectedAgentId()) {
        this.selectAgent(agents[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      this.error.set('Failed to load agents from chain');
    } finally {
      this.isLoading.set(false);
    }
  }

  selectAgent(id: string) {
    this.selectedAgentId.set(id);
  }

  /** After creating an agent on-chain, add it to the local store */
  addAgentToStore(agent: Agent) {
    this.agents.update(list => [...list, agent]);
    this.selectAgent(agent.id);
  }

  updateAgent(id: string, updates: Partial<Agent>) {
    this.agents.update(list =>
      list.map(a => a.id === id ? { ...a, ...updates } : a),
    );
  }

  removeAgent(id: string) {
    this.agents.update(list => list.filter(a => a.id !== id));
    if (this.selectedAgentId() === id) {
      this.selectedAgentId.set(null);
    }
  }
}
