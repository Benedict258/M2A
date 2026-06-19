import { Router } from 'express';
import { db } from '../db.js';
import crypto from 'crypto';

export const router = Router();

router.get('/', async (req, res) => {
  try {
    const owner = req.headers['x-user-address'] as string;
    const templates = await db.listTemplates({
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      owner: owner || undefined,
    });
    res.json(templates);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tmpl = await db.getTemplate(req.params.id);
    if (!tmpl) return res.status(404).json({ error: 'Template not found' });
    res.json(tmpl);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const owner = (req.headers['x-user-address'] as string) || '';
    const body = req.body;

    if (!body.name || !body.definition) {
      return res.status(400).json({ error: 'name and definition are required' });
    }

    const tmpl = {
      id: body.id || crypto.randomUUID(),
      name: body.name,
      description: body.description || '',
      category: body.category || 'Custom',
      owner,
      definition: body.definition,
      is_public: body.is_public || false,
      fork_count: 0,
    };

    await db.saveTemplate(tmpl);
    res.status(201).json(tmpl);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await db.getTemplate(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    const owner = (req.headers['x-user-address'] as string) || '';
    if (existing.owner && existing.owner !== owner) {
      return res.status(403).json({ error: 'Not authorized to edit this template' });
    }

    await db.saveTemplate({ ...existing, ...req.body, id: req.params.id });
    res.json({ updated: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/fork', async (req, res) => {
  try {
    const original = await db.getTemplate(req.params.id);
    if (!original) return res.status(404).json({ error: 'Template not found' });

    const owner = (req.headers['x-user-address'] as string) || '';

    const fork = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (fork)`,
      owner,
      is_public: false,
      fork_count: 0,
    };
    delete fork.created_at;
    delete fork.updated_at;

    await db.saveTemplate(fork);
    await db.incrementTemplateFork(req.params.id);

    res.status(201).json(fork);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const owner = (req.headers['x-user-address'] as string) || '';
    const existing = await db.getTemplate(req.params.id);
    if (existing && existing.owner && existing.owner !== owner) {
      return res.status(403).json({ error: 'Not authorized to delete this template' });
    }
    await db.deleteTemplate(req.params.id);
    res.json({ deleted: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
