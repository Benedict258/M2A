import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner TEXT NOT NULL DEFAULT '',
        namespace_prefix TEXT NOT NULL DEFAULT '',
        definition JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE workflows ADD COLUMN IF NOT EXISTS owner TEXT NOT NULL DEFAULT '';
    `);
    await client.query(`
      ALTER TABLE workflows ADD COLUMN IF NOT EXISTS namespace_prefix TEXT NOT NULL DEFAULT '';
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_workflows_owner ON workflows (owner);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'Custom',
        owner TEXT NOT NULL DEFAULT '',
        definition JSONB NOT NULL,
        is_public BOOLEAN NOT NULL DEFAULT false,
        fork_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_templates_public ON templates (is_public);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_templates_category ON templates (category);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_templates_owner ON templates (owner);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_integrations (
        agent_id TEXT PRIMARY KEY,
        channel TEXT NOT NULL,
        bot_token TEXT NOT NULL DEFAULT '',
        channel_id TEXT NOT NULL DEFAULT '',
        webhook_url TEXT NOT NULL DEFAULT '',
        config JSONB NOT NULL DEFAULT '{}',
        enabled BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_integrations_channel ON agent_integrations (channel);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        wallet_address TEXT NOT NULL DEFAULT '',
        owner_address TEXT NOT NULL DEFAULT '',
        budget_cap BIGINT NOT NULL DEFAULT 0,
        protocols JSONB NOT NULL DEFAULT '[]',
        tools JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_run_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents (owner_address);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        action TEXT NOT NULL DEFAULT '',
        protocol TEXT NOT NULL DEFAULT '',
        amount_spent BIGINT NOT NULL DEFAULT 0,
        tx_digest TEXT NOT NULL DEFAULT '',
        status INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_agent ON activity_log (agent_id);
    `);

    console.log('✅ Postgres: all tables verified/created');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
  } finally {
    client.release();
  }
}

export const db = {
  saveWorkflow: async (workflow: any) => {
    const query = `
      INSERT INTO workflows (id, name, owner, namespace_prefix, definition, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          owner = EXCLUDED.owner,
          namespace_prefix = EXCLUDED.namespace_prefix,
          definition = EXCLUDED.definition,
          updated_at = CURRENT_TIMESTAMP;
    `;
    await pool.query(query, [
      workflow.id,
      workflow.name,
      workflow.owner || '',
      workflow.namespace_prefix || '',
      workflow,
    ]);
  },

  getWorkflow: async (id: string) => {
    const res = await pool.query('SELECT id, name, owner, namespace_prefix, definition, created_at, updated_at FROM workflows WHERE id = $1', [id]);
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return { ...row.definition, owner: row.owner, namespace_prefix: row.namespace_prefix };
  },

  listWorkflows: async (owner?: string) => {
    if (owner) {
      const res = await pool.query(
        'SELECT id, name, owner, namespace_prefix, definition->>\'version\' as version, created_at, updated_at FROM workflows WHERE owner = $1 ORDER BY updated_at DESC',
        [owner]
      );
      return res.rows;
    }
    const res = await pool.query('SELECT id, name, owner, namespace_prefix, definition->>\'version\' as version, created_at, updated_at FROM workflows ORDER BY updated_at DESC');
    return res.rows;
  },

  deleteWorkflow: async (id: string) => {
    await pool.query('DELETE FROM workflows WHERE id = $1', [id]);
  },

  saveTemplate: async (tmpl: any) => {
    const query = `
      INSERT INTO templates (id, name, description, category, owner, definition, is_public, fork_count, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          definition = EXCLUDED.definition,
          is_public = EXCLUDED.is_public,
          updated_at = CURRENT_TIMESTAMP;
    `;
    await pool.query(query, [
      tmpl.id,
      tmpl.name,
      tmpl.description || '',
      tmpl.category || 'Custom',
      tmpl.owner || '',
      tmpl.definition,
      tmpl.is_public || false,
      tmpl.fork_count || 0,
    ]);
  },

  getTemplate: async (id: string) => {
    const res = await pool.query('SELECT * FROM templates WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  listTemplates: async (opts?: { category?: string; owner?: string; search?: string }) => {
    let query = 'SELECT * FROM templates WHERE (is_public = true';
    const params: any[] = [];
    let paramIdx = 1;

    if (opts?.owner) {
      query += ` OR owner = $${paramIdx}`;
      params.push(opts.owner);
      paramIdx++;
    }
    query += ')';

    if (opts?.category) {
      query += ` AND category = $${paramIdx}`;
      params.push(opts.category);
      paramIdx++;
    }

    if (opts?.search) {
      query += ` AND (name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`;
      params.push(`%${opts.search}%`);
      paramIdx++;
    }

    query += ' ORDER BY fork_count DESC, updated_at DESC LIMIT 50';

    const res = await pool.query(query, params);
    return res.rows;
  },

  deleteTemplate: async (id: string) => {
    await pool.query('DELETE FROM templates WHERE id = $1', [id]);
  },

  incrementTemplateFork: async (id: string) => {
    await pool.query('UPDATE templates SET fork_count = fork_count + 1 WHERE id = $1', [id]);
  },

  saveAgentIntegration: async (cfg: { agent_id: string; channel: string; bot_token?: string; channel_id?: string; webhook_url?: string; config?: any; enabled?: boolean }) => {
    const query = `
      INSERT INTO agent_integrations (agent_id, channel, bot_token, channel_id, webhook_url, config, enabled, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (agent_id) DO UPDATE
      SET bot_token = EXCLUDED.bot_token,
          channel_id = EXCLUDED.channel_id,
          webhook_url = EXCLUDED.webhook_url,
          config = EXCLUDED.config,
          enabled = EXCLUDED.enabled,
          updated_at = CURRENT_TIMESTAMP;
    `;
    await pool.query(query, [
      cfg.agent_id,
      cfg.channel,
      cfg.bot_token || '',
      cfg.channel_id || '',
      cfg.webhook_url || '',
      JSON.stringify(cfg.config || {}),
      cfg.enabled ?? true,
    ]);
  },

  getAgentIntegration: async (agent_id: string) => {
    const res = await pool.query('SELECT * FROM agent_integrations WHERE agent_id = $1', [agent_id]);
    return res.rows[0] || null;
  },

  listAgentIntegrations: async (channel?: string) => {
    if (channel) {
      const res = await pool.query('SELECT * FROM agent_integrations WHERE channel = $1 AND enabled = true', [channel]);
      return res.rows;
    }
    const res = await pool.query('SELECT * FROM agent_integrations WHERE enabled = true');
    return res.rows;
  },

  deleteAgentIntegration: async (agent_id: string) => {
    await pool.query('DELETE FROM agent_integrations WHERE agent_id = $1', [agent_id]);
  },

  query: (text: string, params?: any[]) => pool.query(text, params),
};
