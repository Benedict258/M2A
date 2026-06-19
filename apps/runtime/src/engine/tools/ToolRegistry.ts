import { UserContext } from '@m2a/client';

export interface M2ATool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any, userContext: UserContext & { delegateKey: string; accountId: string }) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, M2ATool> = new Map();

  registerTool(tool: M2ATool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): M2ATool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): M2ATool[] {
    return Array.from(this.tools.values());
  }

  getToolDefinitions() {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }
}

export const toolRegistry = new ToolRegistry();
