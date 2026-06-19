import './env.js';
import { initDb } from './db.js';
import { bootstrapEngine } from './engine/bootstrap.js';

initDb().catch(console.error);
bootstrapEngine();

import http from 'http';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { router as executeRouter } from './routes/execute.js';
import { router as exportRouter } from './routes/export.js';
import { router as memoryRouter } from './routes/memory.js';
import { router as workflowsRouter } from './routes/workflows.js';
import { router as authzRouter } from './routes/authz.js';
import { router as mcpRouter } from './routes/mcp.js';
import { router as templatesRouter } from './routes/templates.js';
import { router as integrationsRouter } from './routes/integrations.js';
import { router as agentsRouter } from './routes/agents.js';
import { initializePlatform } from './init.js';

// MCP stdio mode — run as MCP server instead of HTTP
if (process.env.MCP_MODE === 'stdio') {
  const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
  const { CallToolRequestSchema, ListToolsRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');
  const { run } = await import('@m2a/sdk');

  const server = new Server(
    { name: 'm2a-unified', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error(`[${new Date().toISOString()}] MCP: ListTools`);
    return {
      tools: [{
        name: 'run_m2a_workflow',
        description: 'Executes a workflow on the M2A runtime.',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: { type: 'string' },
            input: { type: 'string' },
          },
          required: ['workflowId', 'input'],
        },
      }],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const ts = new Date().toISOString();
    console.error(`[${ts}] MCP: CallTool ${request.params.name}`);
    if (request.params.name === 'run_m2a_workflow') {
      const { workflowId, input } = request.params.arguments as any;
      const runtimeUrl = `http://localhost:${process.env.M2A_RUNTIME_PORT || 3001}`;
      try {
        const response = await run(runtimeUrl, workflowId, {
          inputs: { userInput: input },
          sessionId: `mcp_${Date.now()}`,
        });
        console.error(`[${new Date().toISOString()}] MCP: CallTool → completed`);
        return { content: [{ type: 'text', text: JSON.stringify(response) }] };
      } catch (err: any) {
        return { isError: true, content: [{ type: 'text', text: err.message }] };
      }
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('⚡ M2A Unified MCP Server (stdio)');
  process.exit(0);
}

if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
  console.warn('⚠️  Warning: No major LLM API keys found in environment!');
}

const app = express();
const PORT = process.env.M2A_RUNTIME_PORT || 3001;

app.use(cors());
app.use(express.json());

// Production hardening: HTTPS redirect
if (process.env.NODE_ENV === 'production' && process.env.HTTPS_REDIRECT !== 'false') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Production hardening: rate limiting
const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Stricter rate limit for execute endpoints
const executeLimiter = rateLimit({
  windowMs: 60_000,
  max: parseInt(process.env.RATE_LIMIT_EXECUTE_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many execution requests, please try again later.' },
});
app.use('/api/v1/execute', executeLimiter);

// Stricter rate limit for proof endpoint equivalent
const authzLimiter = rateLimit({
  windowMs: 60_000,
  max: parseInt(process.env.RATE_LIMIT_AUTHZ_MAX || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authz requests, please try again later.' },
});
app.use('/api/m2a/authz', authzLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const body = req.body && Object.keys(req.body).length ? ` | body=${JSON.stringify(req.body).slice(0, 500)}` : '';
    const query = Object.keys(req.query).length ? ` | query=${JSON.stringify(req.query)}` : '';
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)${body}${query}`);
  });

  next();
});

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'm2a-runtime', timestamp: Date.now() });
});

// zkLogin auth callback — the zkLogin service redirects here after Google OAuth
// We forward to the Angular frontend with all query params preserved
app.get('/auth/callback', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const params = new URLSearchParams(req.query as Record<string, string>).toString();
  res.redirect(302, `${frontendUrl}/zklogin-callback?${params}`);
});

// Registers orchestrator routes
app.use('/api/v1/execute', executeRouter);
app.use('/api/v1/export', exportRouter);
app.use('/api/v1/memory', memoryRouter);
app.use('/api/v1/workflows', workflowsRouter);

// Unified gateway authz route (formerly separate gateway service)
app.use('/api/m2a/authz', authzRouter);

// Unified MCP-over-HTTP route (formerly separate mcp-export service)
app.use('/api/v1/mcp', mcpRouter);

// Template marketplace routes
app.use('/api/v1/templates', templatesRouter);

// Per-agent integration routes (Telegram, Discord, etc.)
app.use('/api/v1/integrations', integrationsRouter);

// Agent metadata CRUD
app.use('/api/v1/agents', agentsRouter);

app.listen(PORT, () => {
  console.log(`🚀 M2A Unified Runtime listening on port ${PORT}`);
  console.log(`- Execution:    http://localhost:${PORT}/api/v1/execute`);
  console.log(`- Memory:       http://localhost:${PORT}/api/v1/memory`);
  console.log(`- Authz:        http://localhost:${PORT}/api/m2a/authz/check`);
  console.log(`- MCP over HTTP: http://localhost:${PORT}/api/v1/mcp/execute`);
  console.log(`- MCP stdio:    MCP_MODE=stdio node dist/server.js`);

  // Initialize platform (pool namespaces, etc.) — non-blocking
  initializePlatform();
});

// zkLogin helper: listen on port 3000 to catch Google OAuth redirect
// (Google Cloud OAuth client is configured with http://localhost:3000/auth/callback)
const ZKL_PORT = 3000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${ZKL_PORT}`);
  const params = url.searchParams.toString();
  res.writeHead(302, { Location: `${frontendUrl}/zklogin-callback?${params}` });
  res.end();
}).listen(ZKL_PORT, () => {
  console.log(`🔐 zkLogin callback helper on http://localhost:${ZKL_PORT}/auth/callback → ${frontendUrl}/zklogin-callback`);
});
