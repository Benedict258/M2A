export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'blockchain' | 'storage' | 'web' | 'data';
  requiresAuth: boolean;
  requiresFunds: boolean;
  inputSchema: Record<string, any>;
  execute(params: Record<string, any>): Promise<any>;
}
