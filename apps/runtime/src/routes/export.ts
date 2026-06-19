import { Router } from 'express';

export const router = Router();

/**
 * POST /api/v1/export/mcp
 * Packs a workflow graph definition into a standalone MCP configuration
 */
router.post('/mcp', async (req, res) => {
  try {
    const { workflow } = req.body;
    if (!workflow) return res.status(400).json({ error: 'workflow field is required' });

    console.log(`[Exporter] Constructing MCP wrapper for ${workflow.name || 'unnamed'}...`);
    
    // Create standalone configuration mappings
    return res.json({
      success: true,
      mcpConfig: {
        mcpServerName: `m2a-tool-${workflow.id}`,
        runtimeUrl: `http://localhost:${process.env.M2A_RUNTIME_PORT || 3001}`,
        workflowId: workflow.id,
        instructions: "Run 'npm start' in apps/mcp-export and use the tool 'run_m2a_workflow' with the above workflowId."
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
