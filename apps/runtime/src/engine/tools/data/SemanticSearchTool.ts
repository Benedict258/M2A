import { M2ATool, toolRegistry } from '../ToolRegistry.js';

export const semanticSearchTool: M2ATool = {
  name: 'semantic_search',
  description: 'Search across memory pools and past agent runs using semantic similarity. Finds relevant context from previous executions.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The semantic search query' },
      namespace: { type: 'string', description: 'Memory namespace to search (e.g., pool::research)' },
      limit: { type: 'number', description: 'Maximum results (default 10)' },
    },
    required: ['query'],
  },
  async execute(args: { query: string; namespace?: string; limit?: number }) {
    const { query, namespace = 'pool::general', limit = 10 } = args;
    console.log(`[SemanticSearchTool] Searching ${namespace} for: ${query}`);
    return {
      query,
      namespace,
      results: [],
      message: 'Semantic search requires MemWal relayer connection',
    };
  },
};

toolRegistry.registerTool(semanticSearchTool);
