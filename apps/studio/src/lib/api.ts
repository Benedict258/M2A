interface WorkflowPayload {
  workflow: WorkflowDefinition;
  input: string;
  agentWallet?: string;
}

interface StreamEvent {
  type: string;
  nodeId?: string;
  nodeLabel?: string;
  output?: string;
  error?: string;
  status?: string;
  timestamp?: number;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data?: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
}

const BASE = '/api/v1';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const zkUser = localStorage.getItem('zklogin_user');
  if (zkUser) {
    try {
      const session = JSON.parse(zkUser);
      if (session.address) headers['x-user-address'] = session.address;
    } catch {}
  }
  return headers;
}

export const api = {
  async listWorkflows(): Promise<any[]> {
    const res = await fetch(`${BASE}/workflows`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getWorkflow(id: string): Promise<any> {
    const res = await fetch(`${BASE}/workflows/${id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async saveWorkflow(workflow: WorkflowDefinition): Promise<any> {
    const res = await fetch(`${BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(workflow),
    });
    return res.json();
  },

  async updateWorkflow(id: string, workflow: WorkflowDefinition): Promise<any> {
    const res = await fetch(`${BASE}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(workflow),
    });
    return res.json();
  },

  async deleteWorkflow(id: string): Promise<void> {
    await fetch(`${BASE}/workflows/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  },

  async executeWorkflow(workflow: WorkflowDefinition, input: string): Promise<any> {
    const res = await fetch(`${BASE}/execute/raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ workflow, input }),
    });
    return res.json();
  },

  streamExecute(
    workflow: WorkflowDefinition,
    input: string,
    onEvent: (event: StreamEvent) => void,
  ): () => void {
    const controller = new AbortController();
    fetch(`${BASE}/execute/raw/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ workflow, input }),
      signal: controller.signal,
    }).then(async (response) => {
      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              onEvent(JSON.parse(line.slice(6)));
            } catch {}
          }
        }
      }
    }).catch(() => {});
    return () => controller.abort();
  },

  async executeWorkflowById(workflowId: string, input: string): Promise<any> {
    const res = await fetch(`${BASE}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ workflowId, input }),
    });
    return res.json();
  },

  async listTemplates(params?: { category?: string; search?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const res = await fetch(`${BASE}/templates?${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getTemplate(id: string): Promise<any> {
    const res = await fetch(`${BASE}/templates/${id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async listAgents(): Promise<any[]> {
    const res = await fetch(`${BASE}/agents`, { headers: getAuthHeaders() });
    return res.json();
  },

  async registerAgent(data: any): Promise<any> {
    const res = await fetch(`${BASE}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deployWorkflow(id: string): Promise<any> {
    const res = await fetch(`${BASE}/workflows/${id}/deploy`, { method: 'POST', headers: getAuthHeaders() });
    return res.json();
  },

  async undeployWorkflow(id: string): Promise<any> {
    const res = await fetch(`${BASE}/workflows/${id}/undeploy`, { method: 'POST', headers: getAuthHeaders() });
    return res.json();
  },

  async listDeployed(): Promise<any[]> {
    const res = await fetch(`${BASE}/workflows/deployed`, { headers: getAuthHeaders() });
    return res.json();
  },

  async listExecutionHistory(): Promise<any[]> {
    const res = await fetch(`${BASE}/execute/history`, { headers: getAuthHeaders() });
    return res.json();
  },

  async fetchRunChain(runId: string): Promise<any> {
    const res = await fetch(`${BASE}/execute/history/${runId}/chain`);
    return res.json();
  },

  async getDatasetStats(): Promise<any> {
    const res = await fetch(`${BASE}/datasets/stats`, { headers: getAuthHeaders() });
    return res.json();
  },

  async searchMemory(poolName: string): Promise<any> {
    const res = await fetch(`${BASE}/memory/pool/${encodeURIComponent(poolName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
    return res.json();
  },

  async health(): Promise<any> {
    const res = await fetch('/health', { headers: getAuthHeaders() });
    return res.json();
  },
};
