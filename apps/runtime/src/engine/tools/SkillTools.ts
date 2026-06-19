import type { M2ATool } from './ToolRegistry.js';
import { toolRegistry } from './ToolRegistry.js';
import { skillRegistry } from '../skills/SkillRegistry.js';

function skillToTool(skillId: string): M2ATool | null {
  const skill = skillRegistry.get(skillId);
  if (!skill) return null;

  const paramProperties: Record<string, any> = {};
  if (skill.inputSchema?.properties) {
    for (const [k, v] of Object.entries(skill.inputSchema.properties)) {
      paramProperties[k] = v;
    }
  }

  return {
    name: skill.id,
    description: skill.description,
    parameters: {
      type: 'object',
      properties: paramProperties,
      required: skill.inputSchema?.required || [],
    },
    execute: async (args, userContext) => {
      const result = await skill.execute(args, {
        agentId: userContext.accountId,
        agentWallet: { address: userContext.accountId },
        userContext,
        network: process.env.SUI_NETWORK || 'testnet',
      });
      return result;
    },
  };
}

export function registerAllSkillsAsTools() {
  const skills = skillRegistry.getAll();
  for (const skill of skills) {
    const tool = skillToTool(skill.id);
    if (tool) {
      toolRegistry.registerTool(tool);
      console.log(`  📦 Registered skill as tool: ${skill.id}`);
    }
  }
}
