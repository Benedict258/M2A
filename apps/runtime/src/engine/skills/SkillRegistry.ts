import { SkillDefinition, SkillResult, SkillParams, ExecutionContext } from './SkillDefinition.js';

export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();

  register(skill: SkillDefinition) {
    this.skills.set(skill.id, skill);
  }

  get(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  getAll(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  getByCategory(category: string): SkillDefinition[] {
    return this.getAll().filter(s => s.category === category);
  }

  getBySubcategory(subcategory: string): SkillDefinition[] {
    return this.getAll().filter(s => s.subcategory === subcategory);
  }

  getByProtocol(protocol: string): SkillDefinition[] {
    return this.getAll().filter(s => s.protocols.includes(protocol));
  }

  async execute(id: string, params: SkillParams, context: ExecutionContext): Promise<SkillResult> {
    const skill = this.get(id);
    if (!skill) return { success: false, error: `Skill '${id}' not found` };
    return skill.execute(params, context);
  }

  findAll(opts: { query?: string; category?: string }): SkillDefinition[] {
    let results = this.getAll();
    if (opts.query) {
      const q = opts.query.toLowerCase();
      results = results.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    if (opts.category) {
      results = results.filter(s => s.category === opts.category);
    }
    return results;
  }

  getSkillDefinitions() {
    return this.getAll().map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      subcategory: s.subcategory,
      protocols: s.protocols,
      requiresFunds: s.requiresFunds,
      inputSchema: s.inputSchema,
    }));
  }
}

export const skillRegistry = new SkillRegistry();
