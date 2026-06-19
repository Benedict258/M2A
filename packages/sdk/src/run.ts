import { M2AClient, RunOptions } from './M2AClient.js';
import { WorkflowDefinition } from './types.js';

/**
 * Convenience wrapper to quickly invoke an M2A execution.
 */
export async function run(
  runtimeUrl: string,
  workflow: string | WorkflowDefinition,
  options: RunOptions
) {
  const client = new M2AClient(runtimeUrl);

  if (typeof workflow === 'string') {
    return client.executeWorkflow(workflow, options);
  }

  return client.executeAdHoc(workflow, options);
}
