import { memoryRouter, platformAccountId, platformDelegateKey } from './engine/components.js';
import { db } from './db.js';

const REQUIRED_POOLS = ['pool::code-review', 'pool::research', 'pool::trading'];

const DEFAULT_TOOLS = ['webSearchTool', 'webFetchTool', 'sui_query', 'store_to_walrus', 'fetch_from_walrus'];
const DEFI_TOOLS = ['sui_query', 'aftermath-swap', 'cetus-swap', 'defi-deepbook-trade', 'navi-lending', 'suilend-lending', 'pyth'];

const DEFAULT_MEMORY = {
  read: ['pool::default'],
  write: [],
  tier: 'hot' as const,
};

const BUILTIN_TEMPLATES = [
  {
    id: 'code-review',
    name: 'Code Review Agent',
    description: 'Multi-reviewer code analysis pipeline',
    category: 'Development',
    owner: '',
    is_public: true,
    fork_count: 0,
    definition: {
      id: 'code-review',
      name: 'Code Review Agent',
      version: '1.0.0',
      namespace_prefix: '',
      nodes: [
        { id: 'input_1', type: 'input', position: { x: 50, y: 200 }, data: { label: 'Input', type: 'input', token: '', description: 'Paste your code here for review' } },
        { id: 'agent_1', type: 'agent', position: { x: 350, y: 120 }, data: { label: 'Senior Reviewer', type: 'agent', model: 'llama-3.3-70b-versatile', directives: 'You are a senior code reviewer. Review the provided code for bugs, security vulnerabilities, style issues, and performance problems. Provide detailed, actionable feedback.', tools: DEFAULT_TOOLS, memory_tier: { ...DEFAULT_MEMORY, write: ['pool::code-review'] } } },
        { id: 'agent_2', type: 'agent', position: { x: 350, y: 320 }, data: { label: 'Junior Reviewer', type: 'agent', model: 'llama-3.3-70b-versatile', directives: 'You are a junior code reviewer. Check the provided code for common mistakes, typos, and suggest improvements. Focus on readability and best practices.', tools: DEFAULT_TOOLS, memory_tier: { ...DEFAULT_MEMORY, write: ['pool::code-review'] } } },
        { id: 'output_1', type: 'output', position: { x: 650, y: 200 }, data: { label: 'Output', type: 'output', format: 'raw' } },
      ],
      edges: [
        { id: 'e1', source: 'input_1', target: 'agent_1' },
        { id: 'e2', source: 'input_1', target: 'agent_2' },
        { id: 'e3', source: 'agent_1', target: 'output_1' },
        { id: 'e4', source: 'agent_2', target: 'output_1' },
      ],
    },
  },
  {
    id: 'market-research',
    name: 'Market Research Agent',
    description: 'Automated market research and analysis',
    category: 'Research',
    owner: '',
    is_public: true,
    fork_count: 0,
    definition: {
      id: 'market-research',
      name: 'Market Research Agent',
      version: '1.0.0',
      namespace_prefix: '',
      nodes: [
        { id: 'input_1', type: 'input', position: { x: 50, y: 200 }, data: { label: 'Input', type: 'input', token: '', description: 'Enter your research question or topic' } },
        { id: 'agent_1', type: 'agent', position: { x: 350, y: 200 }, data: { label: 'Researcher', type: 'agent', model: 'llama-3.3-70b-versatile', directives: 'You are a market research analyst. Research market trends, competitors, and industry dynamics using web search and data analysis. Provide comprehensive, data-driven insights.', tools: DEFAULT_TOOLS, memory_tier: { ...DEFAULT_MEMORY, write: ['pool::research'] } } },
        { id: 'output_1', type: 'output', position: { x: 650, y: 200 }, data: { label: 'Output', type: 'output', format: 'raw' } },
      ],
      edges: [
        { id: 'e1', source: 'input_1', target: 'agent_1' },
        { id: 'e2', source: 'agent_1', target: 'output_1' },
      ],
    },
  },
  {
    id: 'customer-support',
    name: 'Customer Support Bot',
    description: 'AI-powered customer support with knowledge base',
    category: 'Support',
    owner: '',
    is_public: true,
    fork_count: 0,
    definition: {
      id: 'customer-support',
      name: 'Customer Support Bot',
      version: '1.0.0',
      namespace_prefix: '',
      nodes: [
        { id: 'input_1', type: 'input', position: { x: 50, y: 200 }, data: { label: 'Input', type: 'input', token: '', description: 'Type your customer support question' } },
        { id: 'agent_1', type: 'agent', position: { x: 350, y: 200 }, data: { label: 'Support Agent', type: 'agent', model: 'llama-3.3-70b-versatile', directives: 'You are a helpful customer support agent. Use your tools (web search, walrus storage) to find relevant information. Always be polite, professional, and thorough in your responses.', tools: [...DEFAULT_TOOLS, 'semanticSearchTool'], memory_tier: DEFAULT_MEMORY } },
        { id: 'output_1', type: 'output', position: { x: 650, y: 200 }, data: { label: 'Output', type: 'output', format: 'raw' } },
      ],
      edges: [
        { id: 'e1', source: 'input_1', target: 'agent_1' },
        { id: 'e2', source: 'agent_1', target: 'output_1' },
      ],
    },
  },
  {
    id: 'defi-trading',
    name: 'DeFi Trading Agent',
    description: 'Automated DeFi trading and analysis across multiple protocols',
    category: 'DeFi',
    owner: '',
    is_public: true,
    fork_count: 0,
    definition: {
      id: 'defi-trading',
      name: 'DeFi Trading Agent',
      version: '1.0.0',
      namespace_prefix: '',
      nodes: [
        { id: 'input_1', type: 'input', position: { x: 50, y: 200 }, data: { label: 'Input', type: 'input', token: '', description: 'Describe the trade or analysis you want to perform' } },
        { id: 'agent_1', type: 'agent', position: { x: 350, y: 200 }, data: { label: 'Trading Agent', type: 'agent', model: 'llama-3.3-70b-versatile', directives: 'You are an automated DeFi trading agent. You have access to DeepBook, Cetus, Aftermath, Navi, Suilend, and other protocols. Use sui_query to discover pools, check prices, and on-chain data. Then execute trades using the available DeFi tools like aftermath-swap, cetus-swap, defi-deepbook-trade, navi-lending, suilend-lending. Always explain your analysis before executing. Default to testnet/simulation unless told otherwise.', tools: DEFI_TOOLS, memory_tier: { ...DEFAULT_MEMORY, write: ['pool::trading'] } } },
        { id: 'output_1', type: 'output', position: { x: 650, y: 200 }, data: { label: 'Output', type: 'output', format: 'raw' } },
      ],
      edges: [
        { id: 'e1', source: 'input_1', target: 'agent_1' },
        { id: 'e2', source: 'agent_1', target: 'output_1' },
      ],
    },
  },
  {
    id: 'deepbook-trading',
    name: 'DeepBook DEX Trader',
    description: 'Execute token swaps and limit orders using DeepBook order-book DEX',
    category: 'DeFi',
    owner: '',
    is_public: true,
    fork_count: 0,
    definition: {
      id: 'deepbook-trading',
      name: 'DeepBook DEX Trader',
      version: '1.0.0',
      namespace_prefix: '',
      nodes: [
        { id: 'input_1', type: 'input', position: { x: 50, y: 200 }, data: { label: 'Trade Input', type: 'input', token: '', description: 'Describe the DeepBook trade you want to execute' } },
        { id: 'agent_1', type: 'agent', position: { x: 350, y: 200 }, data: { label: 'DeepBook Trader', type: 'agent', model: 'llama-3.3-70b-versatile', directives: 'You are a DeepBook DEX trading agent. Use sui_query to discover pool IDs, check order book depth, and get pool info on-chain. Then use defi-deepbook-trade to execute swaps or limit orders. Always check pool state first and explain your analysis before trading.', tools: ['sui_query', 'defi-deepbook-trade', 'pyth'], memory_tier: { ...DEFAULT_MEMORY, write: ['pool::trading'] } } },
        { id: 'output_1', type: 'output', position: { x: 650, y: 200 }, data: { label: 'Trade Result', type: 'output', format: 'raw' } },
      ],
      edges: [
        { id: 'e1', source: 'input_1', target: 'agent_1' },
        { id: 'e2', source: 'agent_1', target: 'output_1' },
      ],
    },
  },
];

export async function initializePlatform(): Promise<void> {
  for (const tmpl of BUILTIN_TEMPLATES) {
    try {
      await db.saveTemplate(tmpl);
    } catch (e: any) {
      console.warn(`[init] Failed to seed template '${tmpl.id}': ${e.message}`);
    }
  }
  console.log(`[init] ${BUILTIN_TEMPLATES.length} templates seeded`);

  if (!platformDelegateKey) {
    console.warn('[init] SERVER_SUI_PRIVATE_KEY not set, skipping platform init');
    return;
  }

  if (!platformAccountId) {
    console.warn('[init] MEMWAL_PLATFORM_ACCOUNT_ID not found, skipping platform init');
    return;
  }

  console.log('[init] Initializing shared pool namespaces...');

  let initialized = 0;
  for (const pool of REQUIRED_POOLS) {
    try {
      await memoryRouter.saveArtifacts(
        { read: [], write: [pool] },
        `System initialized: Shared pool [${pool}] is now active.`,
        { accountId: platformAccountId, delegateKey: platformDelegateKey } as any
      );
      initialized++;
    } catch (e: any) {
      console.warn(`[init] Could not initialize [${pool}]: ${e.message}`);
    }
  }

  console.log(`[init] ${initialized}/${REQUIRED_POOLS.length} pool namespaces active`);
}
