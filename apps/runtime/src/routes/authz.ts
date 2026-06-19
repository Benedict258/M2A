import { Router } from 'express';
import { z } from 'zod';
import { authorizeM2AAction } from '../m2a/authz.js';

export const router = Router();

const AuthzSchema = z.object({
  agentId: z.string().min(1),
  action: z.string().min(1),
  namespace: z.string().optional(),
  tool: z.string().optional(),
  agentWallet: z.string().optional(),
});

router.post('/check', async (req, res) => {
  const parsed = AuthzSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ allowed: false, reason: 'invalid request' });
  }
  const result = await authorizeM2AAction(parsed.data);
  return res.json(result);
});
