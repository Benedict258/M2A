import { Router } from 'express';
import { db } from '../db.js';
import { createTelegramIntegration } from '../engine/integrations/telegram/TelegramIntegration.js';
import { integrationRegistry } from '../engine/integrations/IntegrationRegistry.js';

export const router = Router();

/**
 * GET /api/v1/integrations/:agent_id
 * Returns the integration config for an agent (bot token masked).
 */
router.get('/:agent_id', async (req, res) => {
  try {
    const { agent_id } = req.params;
    const integ = await db.getAgentIntegration(agent_id);
    if (!integ) return res.status(404).json({ error: 'No integration found for this agent' });
    return res.json({
      agent_id: integ.agent_id,
      channel: integ.channel,
      channel_id: integ.channel_id,
      enabled: integ.enabled,
      has_bot_token: !!integ.bot_token,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * PUT /api/v1/integrations/:agent_id/telegram
 * Store or update an agent's Telegram bot token and channel.
 */
router.put('/:agent_id/telegram', async (req, res) => {
  try {
    const { agent_id } = req.params;
    const { bot_token, channel_id } = req.body;
    if (!bot_token) return res.status(400).json({ error: 'bot_token is required' });

    await db.saveAgentIntegration({
      agent_id,
      channel: 'telegram',
      bot_token,
      channel_id: channel_id || '',
      enabled: true,
    });

    // Register the live integration for this agent
    const integration = createTelegramIntegration({ botToken: bot_token, channelId: channel_id });
    integrationRegistry.register(integration);

    return res.json({
      success: true,
      agent_id,
      channel: 'telegram',
      message: 'Telegram bot registered',
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /api/v1/integrations/:agent_id
 * Remove an agent's integration.
 */
router.delete('/:agent_id', async (req, res) => {
  try {
    const { agent_id } = req.params;
    await db.deleteAgentIntegration(agent_id);
    return res.json({ success: true, message: 'Integration removed' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
