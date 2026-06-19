export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  category: 'sui' | 'defi' | 'storage' | 'ai';
  requiresAuth: boolean;
  requiresFunds: boolean;
  methods: string[];
  execute(method: string, params: any, context: any): Promise<any>;
}
