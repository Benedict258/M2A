import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from '../src/engine/MemoryRouter.js';
import type { MemoryRouter as CoreMemoryRouter } from '@m2a/client';
import type { MemoryTierConfig } from '@m2a/sdk';

const mockRecallForNode = vi.fn();
const mockRememberFromNode = vi.fn();
const mockCoreRouter = {
  recallForNode: mockRecallForNode,
  rememberFromNode: mockRememberFromNode,
} as unknown as CoreMemoryRouter;

const defaultUserContext = { userId: 'user1', delegateKey: 'dk1', accountId: 'acct1' };

describe('MemoryRouter', () => {
  let router: MemoryRouter;

  beforeEach(() => {
    vi.clearAllMocks();
    router = new MemoryRouter(mockCoreRouter);
  });

  describe('hydrateContext', () => {
    it('formats recall results into markdown text', async () => {
      mockRecallForNode.mockResolvedValue([
        { namespace: 'pool::docs', content: 'Doc content', timestamp: 1000 },
        { namespace: 'private::user1::notes', content: 'Note content', timestamp: 2000 },
      ]);

      const config: MemoryTierConfig = { read: ['pool::docs', 'private::{userId}::notes'], write: [] };
      const result = await router.hydrateContext(config, 'my query', defaultUserContext);

      expect(result).toContain('[RECALL 1] (from pool::docs): Doc content');
      expect(result).toContain('[RECALL 2] (from private::user1::notes): Note content');
      expect(mockRecallForNode).toHaveBeenCalledTimes(1);
    });

    it('returns fallback message when no results found', async () => {
      mockRecallForNode.mockResolvedValue([]);

      const config: MemoryTierConfig = { read: ['pool::empty'], write: [] };
      const result = await router.hydrateContext(config, 'empty query', defaultUserContext);

      expect(result).toBe('No relevant background records found.');
    });

    it('passes the correct pseudo-node and query to the core router', async () => {
      mockRecallForNode.mockResolvedValue([]);

      const config: MemoryTierConfig = { read: ['pool::test'], write: ['pool::test-write'] };
      await router.hydrateContext(config, 'test query', defaultUserContext);

      expect(mockRecallForNode).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'agent', memory_tier: config }),
        'test query',
        defaultUserContext,
      );
    });
  });

  describe('saveArtifacts', () => {
    it('delegates to the core router rememberFromNode', async () => {
      const config: MemoryTierConfig = { read: [], write: ['pool::archive'] };

      await router.saveArtifacts(config, 'artifact content', defaultUserContext);

      expect(mockRememberFromNode).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'agent', memory_tier: config }),
        'artifact content',
        defaultUserContext,
      );
    });
  });
});
