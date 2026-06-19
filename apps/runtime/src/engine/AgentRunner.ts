import { AgentWorkflowNode } from '@m2a/sdk';
import { providers } from './providers/ProviderRegistry.js';
import { MemoryRouter } from './MemoryRouter.js';
import { UserContext } from '@m2a/client';
import { toolRegistry } from './tools/index.js';
import { authorizeM2AAction } from '../m2a/authz.js';

export interface AgentMetadata {
  creator: string;
  version: string;
  revenueSplit: number; // percentage (0-100)
  budgetLimit?: number; // in mist/sui
}

export class AgentRunner {
  constructor(private memoryRouter: MemoryRouter) {}

  async runStep(
    node: AgentWorkflowNode, 
    userInput: string, 
    userContext: UserContext & { delegateKey: string; accountId: string },
    metadata?: AgentMetadata
  ): Promise<string> {
    console.log(`[AgentRunner] Dispatching Node [${node.id}] (Tools: ${node.tools?.length || 0})...`);

    const stepAuthz = await authorizeM2AAction({
      agentId: node.id,
      action: 'agent.runStep',
      namespace: node.memory_tier.write?.[0] || node.memory_tier.read?.[0],
    });

    if (!stepAuthz.allowed) {
      throw new Error(stepAuthz.reason || `agent ${node.id} is not allowed to run`);
    }

    const context = await this.memoryRouter.hydrateContext(node.memory_tier, userInput, userContext);
    const modelName = node.model || 'gemini-1.5-flash';
    const provider = providers.resolveProviderForModel(modelName);

    // 1. Resolve Tools
    const availableTools = (node.tools || []).map(name => toolRegistry.getTool(name)).filter(Boolean);
    const toolDefinitions = availableTools.map(t => ({
      name: t?.name,
      description: t?.description,
      parameters: t?.parameters
    }));

    const toolPrompt = availableTools.length > 0 
      ? `\n\n### AVAILABLE TOOLS ###\nYou can use the following tools by outputting a JSON block like this: \n{"tool_call": {"name": "tool_name", "args": {...}}}\n\nTools:\n${JSON.stringify(toolDefinitions, null, 2)}`
      : '';

    let currentMessages: any[] = [
      { 
        role: 'system', 
        content: `${node.role}\n\n### HISTORICAL CONTEXT (via MemWal) ###\n${context}${toolPrompt}` 
      },
      { 
        role: 'user', 
        content: userInput 
      }
    ];

    let loopCount = 0;
    while (loopCount < 5) { // Max 5 tool calls per step
      const result = await provider.generate(currentMessages, { model: modelName, temperature: 0.7 });
      const text = result.text;

      // 2. Check for Tool Call
      const toolMatch = text.match(/\{"tool_call":\s*\{.*\}\}/s);
      if (toolMatch) {
        try {
          const call = JSON.parse(toolMatch[0]).tool_call;
          const tool = toolRegistry.getTool(call.name);
          
          if (tool) {
            const toolAuthz = await authorizeM2AAction({
              agentId: node.id,
              action: 'tool.execute',
              namespace: node.memory_tier.write?.[0] || node.memory_tier.read?.[0],
              tool: call.name,
            });

            if (!toolAuthz.allowed) {
              throw new Error(toolAuthz.reason || `tool ${call.name} is not allowed`);
            }

            console.log(`   🛠️  Executing tool: ${call.name}`);
            const toolResult = await tool.execute(call.args, userContext);
            
            currentMessages.push({ role: 'assistant', content: text });
            currentMessages.push({ role: 'user', content: `Tool result for ${call.name}: ${JSON.stringify(toolResult)}` });
            
            loopCount++;
            continue; // Go back to LLM with tool result
          }
        } catch (err) {
          console.error('   ⚠️  Failed to parse or execute tool call:', err);
        }
      }

      // 3. Persist result back to MemWal (if configured)
      if (node.memory_tier.write.length > 0) {
        await this.memoryRouter.saveArtifacts(node.memory_tier, text, userContext);
      }

      return text;
    }

    throw new Error('Max tool loop count reached.');
  }
}

