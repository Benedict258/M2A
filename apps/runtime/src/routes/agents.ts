import { Router } from 'express';
import { db } from '../db.js';
import crypto from 'crypto';

export const router = Router();

interface AgentRecord {
  id: string;
  name: string;
  wallet_address: string;
  owner_address: string;
  budget_cap: number;
  protocols: string[];
  tools: string[];
  created_at: string;
  last_run_at: string | null;
}

// GET /api/v1/agents — list all agents
router.get('/', async (req, res) => {
  try {
    const owner = (req.headers['x-user-address'] as string) || '';
    const query = owner
      ? 'SELECT * FROM agents WHERE owner_address = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM agents ORDER BY created_at DESC';
    const result = await db.query(query, owner ? [owner] : []);
    res.json(result.rows || []);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/agents/:id — get single agent
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM agents WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/agents — register an agent
router.post('/', async (req, res) => {
  try {
    const { id, name, walletAddress, ownerAddress, budgetCap, protocols, tools } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const result = await db.query(
      `INSERT INTO agents (id, name, wallet_address, owner_address, budget_cap, protocols, tools, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           wallet_address = EXCLUDED.wallet_address,
           owner_address = EXCLUDED.owner_address,
           budget_cap = EXCLUDED.budget_cap,
           protocols = EXCLUDED.protocols,
           tools = EXCLUDED.tools
       RETURNING *`,
      [id, name || `Agent ${id.slice(0, 8)}`, walletAddress || '', ownerAddress || '', budgetCap || 0, JSON.stringify(protocols || []), JSON.stringify(tools || [])],
    );
    res.status(201).json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/v1/agents/:id — update agent metadata
router.put('/:id', async (req, res) => {
  try {
    const { name, budgetCap, protocols, tools } = req.body;
    const result = await db.query(
      `UPDATE agents SET name = COALESCE($1, name), budget_cap = COALESCE($2, budget_cap), protocols = COALESCE($3, protocols), tools = COALESCE($4, tools) WHERE id = $5 RETURNING *`,
      [
        name || null,
        budgetCap != null ? budgetCap : null,
        protocols ? JSON.stringify(protocols) : null,
        tools ? JSON.stringify(tools) : null,
        req.params.id,
      ],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Agent not found' });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/agents/:id/activity — log an activity entry
router.post('/:id/activity', async (req, res) => {
  try {
    const { action, protocol, amountSpent, txDigest, status } = req.body;
    const result = await db.query(
      `INSERT INTO activity_log (agent_id, action, protocol, amount_spent, tx_digest, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, action || '', protocol || '', amountSpent || 0, txDigest || '', status || 0],
    );
    res.status(201).json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/agents/:id/activity — get activity log
router.get('/:id/activity', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM activity_log WHERE agent_id = $1 ORDER BY id DESC LIMIT 50',
      [req.params.id],
    );
    res.json(result.rows || []);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/agents/:id/top-up — record a top-up (just accounting)
router.post('/:id/top-up', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount is required' });
    const result = await db.query(
      'UPDATE agents SET budget_cap = budget_cap + $1 WHERE id = $2 RETURNING *',
      [amount, req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Agent not found' });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/v1/agents/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM agents WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
