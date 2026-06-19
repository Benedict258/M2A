import { M2ATool, toolRegistry } from '../ToolRegistry.js';

export const webFetchTool: M2ATool = {
  name: 'web_fetch',
  description: 'Fetches content from a URL via HTTP GET or POST request.',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The URL to fetch' },
      method: { type: 'string', description: 'HTTP method (GET or POST)', enum: ['GET', 'POST'], default: 'GET' },
      headers: { type: 'object', description: 'Optional HTTP headers as key-value pairs' },
      body: { type: 'string', description: 'Request body for POST requests' },
    },
    required: ['url'],
  },
  async execute(args: { url: string; method?: string; headers?: Record<string, string>; body?: string }) {
    const { url, method = 'GET', headers, body } = args;
    console.log(`[WebFetchTool] Fetching: ${url}`);
    try {
      const response = await fetch(url, {
        method,
        headers: { ...headers },
        ...(body ? { body } : {}),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      return { url, status: response.status, contentType: response.headers.get('content-type'), content: text };
    } catch (e: any) {
      return { error: e.message };
    }
  },
};

toolRegistry.registerTool(webFetchTool);
