import { Router } from 'express';
import { db } from '../db.js';
import crypto from 'crypto';
import { WorkflowDefinitionSchema } from '@m2a/sdk';

export const router = Router();

router.get('/', async (req, res) => {
  try {
    const owner = (req.headers['x-user-address'] as string) || undefined;
    const list = await db.listWorkflows(owner);
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const workflow = await db.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const owner = (req.headers['x-user-address'] as string) || '';
    const body = { ...req.body, owner: req.body.owner || owner };

    if (!body.id) {
      body.id = crypto.randomUUID();
    }

    const parsed = WorkflowDefinitionSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(422).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    await db.saveWorkflow(parsed.data);
    res.status(201).json(parsed.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await db.getWorkflow(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const owner = (req.headers['x-user-address'] as string) || '';
    const body = { ...req.body, id: req.params.id, owner: req.body.owner || owner };

    const parsed = WorkflowDefinitionSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(422).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    await db.saveWorkflow(parsed.data);
    res.json(parsed.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.deleteWorkflow(req.params.id);
    res.json({ deleted: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
