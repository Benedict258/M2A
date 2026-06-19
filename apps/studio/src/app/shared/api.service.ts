import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { WorkflowDefinition, NodeDefinition, EdgeDefinition } from './types';
import { AgentStore } from '../stores/agent.store';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private injector = inject(Injector);
  private _agentStore: AgentStore | null = null;
  private get agentStore(): AgentStore {
    if (!this._agentStore) {
      this._agentStore = this.injector.get(AgentStore);
    }
    return this._agentStore;
  }
  private baseUrl = 'http://localhost:3001/api/v1';

  executeWorkflow(workflow: WorkflowDefinition, inputs: Record<string, unknown>) {
    const selectedAgentId = this.agentStore.selectedAgentId();
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/execute/raw`, {
        workflow,
        inputs,
        agentWallet: selectedAgentId || undefined,
      })
    );
  }

  exportMCP(workflow: WorkflowDefinition) {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/export/mcp`, { workflow })
    );
  }

  listWorkflows() {
    return firstValueFrom<WorkflowDefinition[]>(
      this.http.get<WorkflowDefinition[]>(`${this.baseUrl}/workflows`)
    );
  }

  getWorkflow(id: string) {
    return firstValueFrom<WorkflowDefinition>(
      this.http.get<WorkflowDefinition>(`${this.baseUrl}/workflows/${id}`)
    );
  }

  saveWorkflow(workflow: WorkflowDefinition) {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/workflows`, workflow)
    );
  }

  updateWorkflow(id: string, workflow: WorkflowDefinition) {
    return firstValueFrom(
      this.http.put(`${this.baseUrl}/workflows/${id}`, workflow)
    );
  }

  deleteWorkflow(id: string) {
    return firstValueFrom(
      this.http.delete(`${this.baseUrl}/workflows/${id}`)
    );
  }

  listTemplates(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    return firstValueFrom(
      this.http.get(`${this.baseUrl}/templates?${query}`)
    );
  }

  getTemplate(id: string) {
    return firstValueFrom(
      this.http.get(`${this.baseUrl}/templates/${id}`)
    );
  }

  saveTemplate(tmpl: Record<string, unknown>) {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/templates`, tmpl)
    );
  }

  updateTemplate(id: string, tmpl: Record<string, unknown>) {
    return firstValueFrom(
      this.http.put(`${this.baseUrl}/templates/${id}`, tmpl)
    );
  }

  forkTemplate(id: string) {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/templates/${id}/fork`, {})
    );
  }

  deleteTemplate(id: string) {
    return firstValueFrom(
      this.http.delete(`${this.baseUrl}/templates/${id}`)
    );
  }

  fetchMemoryLogs(poolName: string) {
    return firstValueFrom(
      this.http.get(`${this.baseUrl}/memory/pool/${poolName}`)
    );
  }

  // Agent-related endpoints
  registerAgent(data: {
    id: string;
    name: string;
    walletAddress: string;
    ownerAddress: string;
    budgetCap: number;
    protocols: string[];
    tools: string[];
  }) {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/agents`, data)
    );
  }

  listAgents() {
    return firstValueFrom<any[]>(
      this.http.get<any[]>(`${this.baseUrl}/agents`)
    );
  }

  updateAgent(id: string, data: Record<string, unknown>) {
    return firstValueFrom(
      this.http.put(`${this.baseUrl}/agents/${id}`, data)
    );
  }

  getAgentActivity(id: string) {
    return firstValueFrom<any[]>(
      this.http.get<any[]>(`${this.baseUrl}/agents/${id}/activity`)
    );
  }

  logAgentActivity(id: string, data: {
    action: string;
    protocol: string;
    amountSpent: number;
    txDigest: string;
    status: number;
  }) {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/agents/${id}/activity`, data)
    );
  }

  topUpAgent(id: string, amount: number) {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/agents/${id}/top-up`, { amount })
    );
  }
}
