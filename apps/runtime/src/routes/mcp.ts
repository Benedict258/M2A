import { Router } from 'express';
import { run } from '@m2a/sdk';

export const router = Router();

router.post('/execute', async (req, res) => {
  try {
    const { workflowId, input } = req.body;
    if (!workflowId || !input) {
      return res.status(400).json({ error: 'workflowId and input are required' });
    }
    const runtimeUrl = `http://localhost:${process.env.M2A_RUNTIME_PORT || 3001}`;
    const response = await run(runtimeUrl, workflowId, {
      inputs: { userInput: input },
      sessionId: `mcp_${Date.now()}`,
    });
    return res.json({ success: true, data: response });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/export', async (req, res) => {
  try {
    const { workflow } = req.body;
    if (!workflow) return res.status(400).json({ error: 'workflow field is required' });
    return res.json({
      success: true,
      mcpConfig: {
        mcpServerName: `m2a-tool-${workflow.id}`,
        runtimeUrl: `http://localhost:${process.env.M2A_RUNTIME_PORT || 3001}`,
        workflowId: workflow.id,
        instructions: "Use POST /api/v1/mcp/execute with { workflowId, input } to run this workflow.",
      },
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
