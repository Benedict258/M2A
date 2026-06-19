import { M2ATool, toolRegistry } from '../ToolRegistry.js';

export const webSearchTool: M2ATool = {
  name: 'web_search',
  description: 'Search the web for current information. Use this for real-time data, news, or anything that might have changed since the LLM training cutoff.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query' },
      maxResults: { type: 'number', description: 'Maximum number of results (default 5)' },
    },
    required: ['query'],
  },
  async execute(args: { query: string; maxResults?: number }) {
    const { query, maxResults = 5 } = args;
    console.log(`[WebSearchTool] Searching for: ${query}`);
    return {
      query,
      results: [],
      message: `Web search for "${query}" — requires search API key configuration`,
    };
  },
};

toolRegistry.registerTool(webSearchTool);
