# M2A (Memory2Agents) Platform - Agent Context

## Project Vision

M2A is a **multi-agent workflow orchestration platform** inspired by n8n, purpose-built for the **Sui blockchain ecosystem**. It lets users build visual DAG workflows where each node is an AI agent that uses **persistent, verifiable, shared memory** via [MemWal](https://memwal.xyz) infrastructure on Sui.

The core differentiator: **cross-user, cross-workflow continuous learning**. Every agent run writes knowledge to configurable namespaces (`pool::`, `workspace::`, `private::`, `session::`) that subsequent runs across different users and workflows automatically inherit.

**Think: n8n meets Claude Code meets Sui blockchain memory.**

---

## Status

**Fully built and integrated.** All major components are implemented end-to-end.

### Apps

| Component | Port | Tech | What it does |
|-----------|------|------|-------------|
| **Studio** | 5173 | React 18, Vite 8, React Flow 12, Zustand, Tailwind | Visual workflow builder - 5 node types (agent/input/output/walrus/sui), canvas with minimap + undo/redo, inspector panel, memory viewer with pool explorer, action palette, export modal, skills browser, template marketplace, policies editor, agent CRUD, activity log, admin dashboard, zkLogin Google OAuth + Sui Wallet connect |
| **Runtime** | 3001 | Express + TypeScript | WorkflowParser (DAG executor), AgentRunner (LLM tool-loop, up to 5 tool iterations, 3-retry with backoff), MemoryRouter (context hydration + artifact persistence), StreamEmitter (SSE), 7 LLM providers, 7 tools, 6 skills, 7 services, 3 integrations, DB-backed workflow CRUD, built-in authz (env blocklist + on-chain policy), MCP over HTTP + stdio, auto platform init on startup |

### Packages

| Package | What it provides |
|---------|-----------------|
| `@m2a/sdk` (`packages/sdk/`) | Types + Zod validators (`WorkflowDefinition`, `WorkflowNode`, `MemoryTierConfig`, `AgentPolicy`, `ExecutionResult`, on-chain types) + `M2AClient` REST client with `executeWorkflow`/`executeAdHoc` |
| `@m2a/client` (`packages/memwal-client/`) | MemWal SDK wrappers: `createPoolClient`/`createUserClient`, `MemoryRouter` (recall/remember), `ns` namespace builders, `resolve`/`currentNetwork`/`hostedRelayerUrl` env-var resolution |

### Smart Contracts (`contracts/m2a/`)

6 Move 2024 modules, 34 unit tests, deployed to Testnet:

| Module | Purpose |
|--------|---------|
| `m2a.move` | Entry: `create_agent`, `top_up_agent`, `deactivate_agent`; events (`AgentCreated`, `PolicyUpdated`, `AgentFrozen`, `RegistryCreated`) |
| `registry.move` | `AgentRegistry` - table-based map `agent_wallet → policy_id` and `owner → policy_ids` |
| `policy.move` | `AgentPolicy` struct, budget/expiry/protocol checks, `ActivityLog` with entries, accessors/setters |
| `capability.move` | Scoped, expiring, revocable capabilities |
| `governance.move` | `GovernanceCap` - freeze agent, update policy (budget/expiry/protocols/tools) |
| `execution.move` | `pre_execution_check()`/`post_execution_record()` helpers, `can_execute()` |

### Infrastructure (`services/`)

| Service | Stack | Purpose |
|---------|-------|---------|
| **Relayer** (`services/server/`) | Rust Axum, pgvector, Redis, Gemini embeddings, SEAL encrypt, Walrus, Apalis jobs, Ed25519 auth | MemWal HTTP API - remember, recall, analyze, ask, restore; rate limiting, TS sidecar for SEAL/Walrus |
| **Indexer** (`services/indexer/`) | Rust | Polls Sui for `AccountCreated` events, syncs to Postgres, resumable cursor |

---

## Architecture (End-to-End)

```
User / Developer
   │
   ├── Browser → Studio (Vite + React Flow) :5173
   │     Build DAG, configure persona/memory/tools, save/load/list workflows
   │     Connect wallet (zkLogin Google / Sui Wallet), manage agents on-chain
   │     Execute workflow → live SSE logs → inspect outputs
   │
   └── Claude Desktop / Cursor → MCP (runtime stdio or HTTP)
         Exposes saved workflows as LLM-callable tools → Runtime
              │
              ▼
      Runtime (Express + TypeScript) :3001
        WorkflowParser - resolves DAG, parallel execution, 3-retry w/ backoff
        AgentRunner - LLM tool-loop (7 providers routed by model name)
        MemoryRouter - recall() before agent run, remember() after
        StreamEmitter - SSE streaming to Studio
        Authz - env blocklists + on-chain policy (no external gateway)
        MCP - HTTP /api/v1/mcp/execute + MCP_MODE=stdio
        Platform Init - auto-seeds pool:: namespaces on startup
        Tools (7): sui_query, sui_query_tool, sui_tx_tool, web_fetch,
                   web_search, store_to_walrus, fetch_from_walrus
        Skills (6): defi-base, deepbook-trade, deepbook-lend,
                    cetus-swap, cetus-lend, nft
        Services (7): sui_tx, sui_query, agent_wallet, deepbook,
                      cetus, walrus, llm
        Integrations (3): Telegram, Discord, Email
              │
              ▼
      services/server (Rust Axum) :8000  ← MemWal Relayer
        Ed25519 auth → Gemini embedding → pgvector → SEAL encrypt → Walrus
        TS sidecar :9000 for SEAL + Walrus operations
              │
              ▼
      PostgreSQL + pgvector ← Indexer polls Sui events
      Redis 7 - blob/embedding cache, rate limiter, nonce
      Walrus Testnet - decentralized encrypted blob storage
      Sui Testnet - M2A contracts (registry, policy, governance)
```

---

## Codebase Map

```
m2a/
├── apps/
│   ├── studio/                   # Frontend (React 18, Vite 8, React Flow 12)
│   │   └── src/
│   │       ├── main.tsx          # AppShell: tab routing + zkLogin callback
│   │       ├── stores/           # Zustand: workflowStore (undo/redo), authStore, agentStore, suiContractStore
│   │       ├── lib/api.ts        # Axios client → runtime
│   │       ├── components/       # Canvas, NodePanel, MemoryViewer, ActionPalette, ConnectWallet,
│   │       │                     # CreateAgentDialog, SkillsBrowser, PolicyEditor, ActivityLog,
│   │       │                     # AdminDashboard, TemplateMarketplace, ExportModal, edges
│   │       ├── nodes/            # GenericNode, AgentNode, InputNode, OutputNode, WalrusNode, SuiNode
│   │       ├── hooks/            # useAuth, useZkLogin
│   │       └── providers/        # SuiProvider (dApp-kit + TanStack Query)
│   │
│   └── runtime/                  # Unified backend (Express + TypeScript)
│       └── src/
│           ├── server.ts         # Express entry, mounts routes, calls initializePlatform()
│           ├── init.ts           # Auto-seeds pool:: namespaces on startup
│           ├── env.ts            # Multi-path dotenv loader
│           ├── db.ts             # pg Pool + workflows CRUD (save/get/list/delete)
│           ├── routes/           # execute, execute/raw, export/mcp, memory/pool, workflows CRUD,
│           │                     # authz/check, mcp/execute, mcp/export
│           ├── engine/
│           │   ├── WorkflowParser.ts   # DAG executor
│           │   ├── AgentRunner.ts      # LLM tool-loop (authz → memory → provider → tools → persist)
│           │   ├── MemoryRouter.ts     # hydrateContext + saveArtifacts
│           │   ├── StreamEmitter.ts    # SSE event emitter
│           │   ├── bootstrap.ts        # Registers skills, services, integrations
│           │   ├── components.ts       # Wires MemWal clients + engine singletons
│           │   ├── providers/          # 8 providers (Anthropic, OpenAI, Gemini, Groq, DeepSeek,
│           │   │                       #   OpenRouter, GitHub, ProviderRegistry)
│           │   ├── tools/              # ToolRegistry + 7 tools (SuiTools, WalrusTools,
│           │   │                       #   WebFetchTool, WebSearchTool, SuiQueryTool, SuiTxTool,
│           │   │                       #   SemanticSearchTool)
│           │   ├── skills/             # SkillRegistry + 6 skills (DeFi base, DeepBook trade/lend,
│           │   │                       #   Cetus swap/lend, NFT)
│           │   ├── services/           # ServiceRegistry + 7 services (SuiTx, SuiQuery, AgentWallet,
│           │   │                       #   DeepBook, Cetus, Walrus, LLM)
│           │   └── integrations/       # IntegrationRegistry + 3 (Telegram, Discord, Email)
│           ├── m2a/                    # authz.ts (env blocklist + on-chain policy), suiClient.ts,
│           │                           # contracts.ts (tx builders), types.ts
│           └── tests/                  # MemoryRouter, ToolRegistry, WorkflowParser tests
│
├── packages/
│   ├── memwal-client/            # @m2a/client - MemWal SDK, namespaces, network resolution
│   └── sdk/                      # @m2a/sdk - Types + Zod + M2AClient + run()
│
├── services/
│   ├── server/                   # Rust Axum relayer + TS sidecar
│   └── indexer/                  # Rust Sui event indexer
│
├── contracts/m2a/                # 6 Move 2024 modules + 34 tests
└── apps/runtime/docker-compose.yml  # Postgres (pgvector:pg16) + Redis 7
```

---

## LLM Providers

8 providers, auto-registered from env vars on runtime startup:

| Provider | SDK | Model matching | Env key |
|----------|-----|---------------|---------|
| Anthropic | `@anthropic-ai/sdk` | `claude-*` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai` | `gpt-*`, `o1-*`, `o3-*` | `OPENAI_API_KEY` |
| Gemini | `@google/generative-ai` | `gemini-*` | `GEMINI_API_KEY` |
| Groq | `openai` (compatible) | `groq-*`, `mixtral-*`, `llama-*` | `GROQ_API_KEY` |
| DeepSeek | `openai` (compatible) | `deepseek-*` | `DEEPSEEK_API_KEY` |
| OpenRouter | `openai` (compatible) | `openrouter-*` | `OPENROUTER_API_KEY` |
| GitHub | `openai` (compatible) | `gpt-*` (preferred over OpenAI) | `GITHUB_TOKEN` |
| Default | fallback | First available provider | (any) |

---

## Tools (7)

| Tool | Methods | What it does |
|------|---------|-------------|
| `sui_query` | `SuiTools` | 5 RPC: getObject, getTransactionBlock, getCoins, getBalance, getOwnedObjects |
| `sui_query_tool` | `SuiQueryTool` | getObject, getTransaction, getBalance, listOwnedObjects |
| `sui_tx_tool` | `SuiTxTool` | buildTransferTx, buildMoveCallTx |
| `web_fetch` | `WebFetchTool` | HTTP GET/POST |
| `web_search` | `WebSearchTool` | STUB - requires search API key |
| `semantic_search` | `SemanticSearchTool` | STUB - requires MemWal relayer |
| `store_to_walrus` / `fetch_from_walrus` / `delete_from_walrus` | `WalrusTools` | Blob store/fetch/delete on Walrus |

---

## Skills (6)

| Skill | Category | What it does |
|-------|----------|-------------|
| `defi-base` | DeFi | Simulated deposit/withdraw/swap/lend/borrow on DeepBook + Cetus |
| `defi-deepbook-trade` | DeFi | Real: swapExactQuantity, placeLimitOrder, cancelOrder via `@mysten/deepbook-v3` SDK |
| `defi-deepbook-lend` | DeFi | Real: supplyToMarginPool, withdrawFromMarginPool, borrowBase, repayQuote |
| `cetus-swap` | DeFi | Real: token swap via Cetus CLMM DEX PTB (swap_a2b / swap_b2a) |
| `cetus-lend` | DeFi | Real: open_position_with_liquidity / close_position via Cetus PTB |
| `nft` | NFT | Real: mint + transfer via Sui PTB |

---

## Services (7)

| Service | What it does |
|---------|-------------|
| `sui_tx` | buildTransferTx, buildMoveCallTx, simulateTx, estimateGas |
| `sui_query` | getObject, getTransaction, getBalance, listBalances, listOwnedObjects, getReferenceGasPrice, listCoins |
| `agent_wallet` | AgentWalletService - session mgmt, transferFunds, getBalance, executeWithAgentWallet |
| `deepbook` | getPoolInfo, getOrderBook, estimateSwap, buildSwapTx |
| `cetus` | getPoolInfo, estimateSwap, buildSwapTx |
| `walrus` | storeBlob, readBlob, readByObjectId, deleteBlob |
| `llm` | generate (prompt), chat (messages), model fallback |

---

## Integrations (3)

| Integration | Channel | Backend |
|-------------|---------|---------|
| Telegram | `sendMessage` with Markdown | `node:https` → `api.telegram.org/bot<token>/sendMessage` |
| Discord | webhook POST | `node:https` → Discord webhook URL |
| Email | SMTP | `nodemailer` |

---

## Studio Features

| Feature | Component |
|---------|-----------|
| **Canvas** | React Flow DAG builder with 5 node types, GlowEdge + ConverseEdge |
| **Inspector** | 3-tab: Persona (role/model), Memory (read/write namespaces), Tools |
| **Memory Viewer** | Bottom panel: live execution logs + pool explorer |
| **Action Palette** | Cmd+K - add agent/input/output/walrus/sui nodes |
| **Workflow Manager** | Save/load/list via runtime API |
| **Export** | Export as MCP server JSON |
| **Wallet** | Sui Wallet connect (dApp-kit) + zkLogin (Google OAuth) |
| **Agent Manager** | Create/fund/deactivate on-chain agents, policy editor, activity log |
| **Admin Dashboard** | System stats, health metrics, agents table |
| **Skills Browser** | Catalog of all tools/services/skills/integrations with search/filter |
| **Template Marketplace** | Pre-built workflow templates |

---

## Network Config & Env Vars

All network-specific env vars use `_{SUI_NETWORK}` suffix (no bare fallback):

```
M2A_PACKAGE_ID_testnet=0x...
M2A_PACKAGE_ID_mainnet=0x...
M2A_REGISTRY_ID_testnet=0x...
M2A_REGISTRY_ID_mainnet=0x...
MEMWAL_PLATFORM_ACCOUNT_ID_testnet=0x...
MEMWAL_PLATFORM_ACCOUNT_ID_mainnet=0x...
```

`SUI_NETWORK=testnet` or `mainnet` - drives hosted relayer URL, env var resolution, and gRPC network param. `MEMWAL_MODE=self` (local) or `hosted` (external relayer).

---

## Boot Sequence

```bash
# 1. Infrastructure
docker compose -f apps/runtime/docker-compose.yml up -d  # postgres + redis

# 2. Build shared packages (first run)
npm run build:packages

# 3. Runtime (unified backend - execution, authz, MCP)
npm run dev:runtime                         # :3001

# 4. Studio
npm run dev:studio                          # :5173

# 5. Rust services (separate terminals)
cd services/server && cargo run             # relayer :8000
cd services/indexer && cargo run            # indexer
```
