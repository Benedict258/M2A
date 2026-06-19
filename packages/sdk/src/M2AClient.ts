import axios from 'axios';
import { WorkflowDefinition } from './types.js';

export interface RunOptions {
  inputs: Record<string, any>;
  sessionId?: string;
}

export class M2AClient {
  private runtimeUrl: string;
  private apiKey?: string;

  constructor(runtimeUrl: string, apiKey?: string) {
    this.runtimeUrl = runtimeUrl;
    this.apiKey = apiKey;
  }

  /**
   * Executes a predefined workflow via the engine.
   */
  async executeWorkflow(workflowId: string, options: RunOptions) {
    const response = await axios.post(`${this.runtimeUrl}/api/v1/execute`, {
      workflowId,
      ...options
    }, {
      headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
    });

    return response.data;
  }

  /**
   * Validates and executes a raw workflow JSON structure directly.
   */
  async executeAdHoc(workflow: WorkflowDefinition, options: RunOptions) {
    const response = await axios.post(`${this.runtimeUrl}/api/v1/execute/raw`, {
      workflow,
      ...options
    });

    return response.data;
  }
}
