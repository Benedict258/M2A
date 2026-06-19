import { MemoryRouter as CoreMemoryRouter, UserContext } from '@m2a/client';
import { MemoryTierConfig, RecallMemory } from '@m2a/sdk';

/**
 * High-level broker for the Runtime.
 * Manages how memories are pulled for agents and where they are saved.
 */
export class MemoryRouter {
  constructor(private core: CoreMemoryRouter) {}

  /**
   * Pulls information from multiple memory namespaces and formats into a markdown context.
   */
  async hydrateContext(
    config: MemoryTierConfig, 
    query: string, 
    userContext: UserContext & { delegateKey: string; accountId: string }
  ): Promise<string> {
    console.log('[MemoryRouter] Hydrating context for namespaces:', config.read);

    // Use the core router to handle cross-namespace recall
    // We wrap it in a pseudo-node structure to satisfy the core router's API
    const pseudoNode = { type: 'agent' as const, memory_tier: config };
    const results: RecallMemory[] = await this.core.recallForNode(pseudoNode as any, query, userContext);

    if (results.length === 0) {
      return 'No relevant background records found.';
    }

    return results
      .map((r, i) => `[RECALL ${i+1}] (from ${r.namespace}): ${r.content}`)
      .join('\n\n');
  }

  /**
   * Persists thoughts across all target destinations.
   */
  async saveArtifacts(
    config: MemoryTierConfig, 
    content: string,
    userContext: UserContext & { delegateKey: string; accountId: string }
  ): Promise<void> {
    console.log('[MemoryRouter] Saving execution artifact to namespaces:', config.write);

    const pseudoNode = { type: 'agent' as const, memory_tier: config };
    await this.core.rememberFromNode(pseudoNode as any, content, userContext);
  }
}

