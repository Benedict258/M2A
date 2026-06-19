import { ServiceDefinition } from './ServiceDefinition.js';

export class ServiceRegistry {
  private services: Map<string, ServiceDefinition> = new Map();

  register(service: ServiceDefinition) {
    this.services.set(service.id, service);
  }

  get(id: string): ServiceDefinition | undefined {
    return this.services.get(id);
  }

  getAll(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  getByCategory(category: string): ServiceDefinition[] {
    return this.getAll().filter(s => s.category === category);
  }

  async execute(id: string, method: string, params: any, context: any): Promise<any> {
    const service = this.get(id);
    if (!service) throw new Error(`Service '${id}' not found`);
    return service.execute(method, params, context);
  }

  getServiceDefinitions() {
    return this.getAll().map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      requiresAuth: s.requiresAuth,
      requiresFunds: s.requiresFunds,
      methods: s.methods,
    }));
  }
}

export const serviceRegistry = new ServiceRegistry();
