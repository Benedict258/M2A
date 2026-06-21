import { Router } from 'express';
import { db } from '../db.js';
import crypto from 'crypto';
import { createSuiClient, resolveNetworkVar, suiRpcUrl } from '../config.js';
import { SuiReader } from '../m2a/suiClient.js';
import { fromBase64 } from '@mysten/sui/utils';

export const router = Router();

// GET /api/v1/agents/config — return shared config needed by the frontend to build txs
router.get('/config', async (_req, res) => {
  res.json({
    m2aPackageId: resolveNetworkVar('M2A_PACKAGE_ID') || '0x0',
    registryId: resolveNetworkVar('M2A_REGISTRY_ID') || '0x0',
    suiNetwork: process.env.SUI_NETWORK || 'testnet',
  });
});

interface AgentRecord {
  id: string;
  name: string;
  wallet_address: string;
  owner_address: string;
  budget_cap: number;
  protocols: string[];
  tools: string[];
  on_chain_agent_id: string;
  tx_digest: string;
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

// POST /api/v1/agents — relay signed tx to Sui, store agent record
router.post('/', async (req, res) => {
  try {
    const { txBytes, digest, name, walletAddress, ownerAddress, budgetCap, protocols, tools, signatures } = req.body;

    if (!txBytes) {
      return res.status(400).json({ error: 'txBytes is required' });
    }

    const suiClient = createSuiClient();
    const txBytesBytes = fromBase64(txBytes);

    const response = await suiClient.executeTransaction({
      transaction: txBytesBytes,
      signatures: signatures || [],
      include: { effects: true, events: true },
    });

    if (response.$kind !== 'Transaction') {
      return res.status(500).json({ error: 'Transaction failed', details: response.FailedTransaction });
    }

    const txDigest = response.Transaction.digest || digest;

    let onChainAgentId = '';
    const changedObjects: Array<{ objectId: string; idOperation: string | null }> =
      (response.Transaction.effects as any)?.changedObjects || [];
    const created = changedObjects.filter((c) => c.idOperation === 'Created');
    if (created.length > 0) {
      onChainAgentId = created[0].objectId;
    }

    const agentId = crypto.randomUUID();
    const result = await db.query(
      `INSERT INTO agents (id, name, wallet_address, owner_address, budget_cap, protocols, tools, on_chain_agent_id, tx_digest, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE
       SET on_chain_agent_id = EXCLUDED.on_chain_agent_id,
           tx_digest = EXCLUDED.tx_digest
       RETURNING *`,
      [
        agentId,
        name || `Agent ${agentId.slice(0, 8)}`,
        walletAddress || '',
        ownerAddress || '',
        budgetCap || 0,
        JSON.stringify(protocols || []),
        JSON.stringify(tools || []),
        onChainAgentId,
        txDigest,
      ],
    );

    res.status(201).json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      status: 'active',
      budgetUsed: Number(result.rows[0].budget_used || 0),
      budgetCap: result.rows[0].budget_cap,
      address: result.rows[0].wallet_address,
      onChainId: result.rows[0].on_chain_agent_id,
      txDigest: result.rows[0].tx_digest,
    });
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

// GET /api/v1/agents/:id/balance — fetch on-chain SUI balance
router.get('/:id/balance', async (req, res) => {
  try {
    const result = await db.query('SELECT wallet_address FROM agents WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Agent not found' });
    const walletAddress = result.rows[0].wallet_address;
    const suiClient = createSuiClient();
    const balance: any = await suiClient.getBalance({ owner: walletAddress });
    res.json({
      walletAddress,
      totalBalance: balance.totalBalance ?? '0',
      coins: balance.coins || [],
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/agents/:id/top-up — relay signed SUI transfer to agent wallet
router.post('/:id/top-up', async (req, res) => {
  try {
    const { txBytes, signatures, amount } = req.body;
    if (!txBytes) return res.status(400).json({ error: 'txBytes is required' });
    if (!amount) return res.status(400).json({ error: 'amount is required' });

    const suiClient = createSuiClient();
    const txBytesBytes = fromBase64(txBytes);

    const response = await suiClient.executeTransaction({
      transaction: txBytesBytes,
      signatures: signatures || [],
      include: { effects: true },
    });

    if (response.$kind !== 'Transaction') {
      return res.status(500).json({ error: 'Transaction failed', details: response.FailedTransaction });
    }

    const txDigest = response.Transaction.digest;

    const result = await db.query(
      'UPDATE agents SET budget_cap = budget_cap + $1 WHERE id = $2 RETURNING *',
      [amount, req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Agent not found' });

    res.json({
      ...result.rows[0],
      txDigest,
      budgetCap: result.rows[0].budget_cap,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/agents/discover/:ownerAddress — discover agents from on-chain registry
router.get('/discover/:ownerAddress', async (req, res) => {
  try {
    const { ownerAddress } = req.params;
    const packageId = resolveNetworkVar('M2A_PACKAGE_ID');
    const registryId = resolveNetworkVar('M2A_REGISTRY_ID');
    if (!packageId || !registryId) {
      return res.json({ agents: [], note: 'M2A contracts not configured' });
    }

    const reader = new SuiReader({ packageId });
    const policies = await reader.getOwnerAgents(registryId, ownerAddress);

    const agents = [];
    for (const policy of policies) {
      const existing = await db.query(
        'SELECT * FROM agents WHERE wallet_address = $1 OR on_chain_agent_id = $2',
        [policy.agentWallet, policy.id],
      );
      if (existing.rows.length > 0) {
        agents.push(existing.rows[0]);
      } else {
        const agentId = crypto.randomUUID();
        const newAgent = await db.query(
          `INSERT INTO agents (id, name, wallet_address, owner_address, budget_cap, protocols, tools, on_chain_agent_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            agentId,
            `Agent ${policy.agentWallet.slice(0, 6)}`,
            policy.agentWallet,
            policy.owner,
            Number(policy.budgetCap),
            JSON.stringify(policy.protocolWhitelist),
            JSON.stringify(policy.toolWhitelist),
            policy.id,
          ],
        );
        agents.push(newAgent.rows[0]);
      }
    }

    res.json({ agents });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/agents/:id/deactivate — deactivate agent on-chain, then remove DB record
router.post('/:id/deactivate', async (req, res) => {
  try {
    const { txBytes, signatures } = req.body;
    if (!txBytes) return res.status(400).json({ error: 'txBytes is required' });

    const suiClient = createSuiClient();
    const txBytesBytes = fromBase64(txBytes);

    const response = await suiClient.executeTransaction({
      transaction: txBytesBytes,
      signatures: signatures || [],
      include: { effects: true },
    });

    if (response.$kind !== 'Transaction') {
      return res.status(500).json({ error: 'Deactivation tx failed', details: response.FailedTransaction });
    }

    const txDigest = response.Transaction.digest;
    await db.query('DELETE FROM agents WHERE id = $1', [req.params.id]);

    res.json({ deleted: true, txDigest });
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
