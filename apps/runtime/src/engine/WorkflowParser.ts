import { WorkflowDefinition, WorkflowNode } from '@m2a/sdk';
import { AgentRunner } from './AgentRunner.js';
import { UserContext } from '@m2a/client';

export interface WorkflowState {
  outputs: Record<string, string>; // nodeId -> result
  status: 'pending' | 'running' | 'completed' | 'failed';
  retries: Record<string, number>; // nodeId -> retry count
}

/**
 * Traverses and executes a Directed Acyclic Graph (DAG) of agents.
 * Ensures dependencies are resolved before a node is triggered.
 */
export class WorkflowParser {
  constructor(private agentRunner: AgentRunner) {}

  /**
   * Executes the entire workflow.
   */
  async execute(
    workflow: WorkflowDefinition, 
    initialInput: string,
    userContext: UserContext & { delegateKey: string; accountId: string }
  ): Promise<WorkflowState> {
    console.log(`[WorkflowParser] Starting execution: ${workflow.name}`);
    
    const state: WorkflowState = {
      outputs: { 'start': initialInput },
      status: 'running',
      retries: {}
    };

    const completedNodes = new Set<string>();
    const pendingNodes = new Set<string>(workflow.nodes.map(n => n.id));

    while (pendingNodes.size > 0) {
      // Find nodes whose dependencies are all met
      const readyNodes = workflow.nodes.filter(node => {
        if (!pendingNodes.has(node.id)) return false;
        
        // If no dependencies, it's ready (initial roots)
        if (!node.dependencies || node.dependencies.length === 0) return true;

        // Check if all dependencies are in the completedNodes set
        return node.dependencies.every(depId => completedNodes.has(depId));
      });

      if (readyNodes.length === 0 && pendingNodes.size > 0) {
        throw new Error('Deadlock detected in workflow DAG. Check for circular dependencies.');
      }

      // Execute ready nodes in parallel
      await Promise.all(readyNodes.map(async (node) => {
        if (node.type !== 'agent') {
          try {
            // Non-agent nodes (input/output) are handled as simple state markers for now
            completedNodes.add(node.id);
            pendingNodes.delete(node.id);
            return;
          } catch (e: any) {
            state.status = 'failed';
            console.error(`   ❌ Node [${node.id}] failed:`, e.message);
            throw e;
          }
        }

        // Prepare input: collect results from dependencies
        const inputs = node.dependencies?.map((depId: string) => state.outputs[depId]) || [initialInput];
        const combinedInput = inputs.join('\n\n---\n\n');

        // Agent nodes get retry logic: up to 3 attempts with exponential backoff
        let lastError: Error | undefined;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const result = await this.agentRunner.runStep(node, combinedInput, userContext);

            state.outputs[node.id] = result;
            completedNodes.add(node.id);
            pendingNodes.delete(node.id);

            console.log(`   ✓ Node [${node.id}] completed.`);
            return;
          } catch (e: any) {
            lastError = e;
            if (attempt < 3) {
              state.retries[node.id] = (state.retries[node.id] || 0) + 1;
              const delayMs = attempt === 1 ? 1000 : 2000;
              console.log(`   ⚠ Node [${node.id}] failed (attempt ${attempt}/3). Retrying in ${delayMs}ms...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
        }

        // All retries exhausted — mark node as failed but continue the workflow
        console.error(`   ❌ Node [${node.id}] failed after 3 attempts:`, (lastError as Error).message);
        completedNodes.add(node.id);
        pendingNodes.delete(node.id);
      }));
    }

    state.status = 'completed';
    console.log(`[WorkflowParser] Workflow '${workflow.name}' completed successfully.`);
    return state;
  }
}
