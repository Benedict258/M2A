# M2A (Memory2Agents) Platform

**Multi-agent workflow orchestration with persistent, verifiable, shared memory on Sui.**

M2A is a full-stack platform where AI agent nodes utilize persistent memory via **MemWal** infrastructure (self-hosted relayer or hosted service) connected to on-chain MemWal contracts on Sui. Agents learn across workflows, teams, and a platform-wide public knowledge pool - every execution enriches the next.

---

## Architecture

```
                          USER LAYER
  ┌────────────────────┐  ┌───────────────────────┐  ┌─────────────────────┐
  │  M2A Studio        │  │  MCP (via runtime)    │  │  SDK / API Client   │
  │ (React + ReactFlow)│  │  Claude Desktop,      │  │  (@m2a/sdk)         │
  │ Visual canvas      │  │  Cursor, etc.         │  │  Programmatic       │
  │ Drag-and-drop DAG  │  │  HTTP or stdio        │  │  workflow exec      │
  └────────┬───────────┘  └───────────┬───────────┘  └───────────┬─────────┘
           │ POST /api/v1/execute/raw │ POST /api/v1/mcp/exec    │ axios
           │ GET  /api/v1/memory/*    │                          │
           │ POST /api/v1/workflows   │                          │
           └──────────┬───────────────┘──────────────────────────┘
                      │
               ┌──────▼─────────────────────────────────────────┐
               │          M2A UNIFIED RUNTIME (:3001)           │
               │          Express + TypeScript                  │
               │                                                │
               │  ┌─────────────┐  ┌──────────────┐             │
               │  │WorkflowParser│ │ MemoryRouter │             │
               │  │ DAG executor│  │  Context     │             │
               │  │ Retry logic │  │  hydration   │             │
               │  │ Parallelism │  │  Artifact    │             │
               │  └──────┬──────┘  │  persistence │             │
               │         │         └──────┬───────┘             │
               │  ┌──────▼──────┐  ┌──────▼───────┐             │
               │  │ AgentRunner │  │  ToolRegistry│             │
               │  │LLM providers│  │  Walrus, Sui │             │
               │  │ Tool loop   │  │  Web tools   │             │
               │  └─────────────┘  └──────────────┘             │
               │                                                │
               │  ┌──────────────────────────────────────────┐  │
               │  │  8 LLM Providers                         │  │
               │  │  Anthropic · OpenAI · Gemini · Groq      │  │
               │  │  DeepSeek · OpenRouter · GitHub · Custom │  │
               │  └──────────────────────────────────────────┘  │
               │                                                │
               │  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │
               │  │ Routes   │  │   DB      │  │  M2A Authz   │ │
               │  │ execute  │  │  Postgres │  │ env blocklist│ │
               │  │ export   │  │  workflows│  │ + on-chain   │ │
               │  │ memory   │  │  table    │  │ policy check │ │
               │  │ workflows│  │           │  │              │ │
               │  │ mcp      │  │           │  │              │ │
               │  │ authz    │  │           │  │              │ │
               │  └──────────┘  └───────────┘  └──────────────┘ │
               └────────────────────────────────────────────────┘
                                                      │
               ┌──────────────────────────────────────────────────────┐
               │              MEMWAL RELAYER (:8000)                  │
               │              Rust Axum                               │
               │                                                      │
               │  • Ed25519 signature verification on every request   │
               │  • pgvector cosine similarity search                 │
               │  • SEAL encryption (via TS sidecar :9000)            │
               │  • Walrus blob upload/fetch (via TS sidecar)         │
               │  • 3-tier rate limiting (Redis)                      │
               │  • Apalis job queues for async operations            │
               └───────┬──────────────────────────────────┬───────────┘
                       │                                  │
               ┌───────▼────────┐              ┌─────────▼──────────┐
               │Postgres (:5432)│              │  Walrus Testnet    │
               │  + pgvector    │              │  Decentralized     │
               │  vector_entries│              │  blob storage      │
               │  accounts      │              │  (permanent blobs) │
               │  indexer_state │              └────────────────────┘
               └───────┬────────┘
                       │ syncs events
               ┌───────▼────────┐              ┌────────────────────┐
               │  MEMWAL INDEXER│◄─────────────│  Sui Testnet       │
               │  (Rust, bg)    │ polls events │  Smart contracts   │
               │  Syncs accounts│              │  MemWal + M2A      │
               │  + delegates   │              └────────────────────┘
               └────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      SUI SMART CONTRACTS                            │
│                                                                     │
│  m2a::m2a       - Main module: create_agent, top_up, deactivate     │
│  m2a::policy    - AgentPolicy (budget, whitelists, expiry, logs)    │
│  m2a::registry  - AgentRegistry (wallet→policy mapping, owner idx)  │
│  m2a::execution - Pre/post execution guards and record-keeping      │
│  m2a::capability- Fine-grained scoped capability tokens             │
│  m2a::governance- GovernanceCap: freeze_agent, update_policy        │
│                                                                     │
│  34 unit tests across 3 test modules. Move 2024 edition.            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Repository Anatomy

```
m2a/
├── apps/
│   ├── studio/          # React + Vite + React Flow visual canvas
│   └── runtime/         # Express workflow execution engine (unified backend)
├── packages/
│   ├── memwal-client/   # @m2a/client - MemWal SDK wrapper
│   └── sdk/             # @m2a/sdk - Types + Zod validators + REST client
├── contracts/
│   └── m2a/             # Sui Move smart contracts (6 modules)
├── services/
│   ├── server/          # MemWal relayer (Rust Axum, copied from MemWal)
│   └── indexer/         # Sui event indexer (Rust, copied from MemWal)
├── apps/runtime/docker-compose.yml   # Postgres (pgvector) + Redis
├── package.json          # npm workspace root + turbo scripts
├── turbo.json           # Turborepo pipeline config
└── .env.example         # Root environment template
```

---

## Component Details

### apps/studio - Visual Workflow Canvas

| Feature | Details |
|---------|---------|
| **Framework** | React 18 + TypeScript + Vite |
| **Canvas** | @xyflow/react (React Flow v12) - drag-and-drop DAG builder |
| **Styling** | Tailwind CSS, dark theme (slate/blue/#6366f1), font-outfit, framer-motion |
| **State** | Zustand stores (workflow, auth, agent, suiContract) |
| **Auth** | Dual auth: Sui wallet (dapp-kit) + Google zkLogin |
| **zkLogin** | OAuth callback page, ephemeral keypair in sessionStorage |
| **Node Types** | Input, Agent (with 8 LLM model selection), Output, Walrus, Sui |
| **Edge Types** | glow, ConverseEdge - animated gradient connections |
| **Tooling** | Memory tier selector, skills browser, policy editor, create-agent dialog |
| **Viewer** | Live execution logs + memory pool explorer with search/filter |
| **Export** | Modal generates Claude Desktop JSON config for MCP server |
| **Workflow Mgmt** | Save/load/list/delete workflows via runtime API |
| **Templates** | Marketplace with 5 starter templates (search, filter, one-click use) |
| **Admin** | Dashboard with stat cards, activity feed, agent list, health indicators |

### apps/runtime - Unified Backend (execution + authz + MCP)

| Capability | Implementation |
|------------|---------------|
| **DAG Executor** | WorkflowParser - topological sort, parallel execution, deadlock detection |
| **Retry Logic** | 3 attempts per agent node, exponential backoff (1s/2s), per-node retry counter |
| **LLM Providers** | 8 providers via ProviderRegistry: Anthropic, OpenAI, Gemini, Groq, DeepSeek, OpenRouter, GitHub, custom |
| **Tool System** | ToolRegistry - register/lookup/execute M2ATool, up to 5 tool calls per step |
| **Memory** | MemoryRouter - hydrateContext (recall) + saveArtifacts (remember) via MemWal |
| **Streaming** | StreamEmitter - SSE for live execution events to the studio |
| **Authz** | authorizeM2AAction - env blocklists + on-chain AgentPolicy lookup (direct, no proxy) |
| **MCP** | HTTP endpoint (`POST /api/v1/mcp/execute`) + stdio mode (`MCP_MODE=stdio`) |
| **Platform Init** | Auto-initializes pool namespaces on startup |
| **Routes** | POST /execute, POST /execute/raw, POST /export/mcp, GET /memory/pool, CRUD /workflows, POST /api/m2a/authz/check, POST /api/v1/mcp/execute |
| **Persistence** | PostgreSQL via pg (saved workflows table with upsert) |
| **Tests** | 15 unit tests (WorkflowParser: 6, MemoryRouter: 4, ToolRegistry: 5) |

### packages/memwal-client (@m2a/client)

High-level SDK wrapping the `@mysten-incubation/memwal` SDK:
- `createPoolClient(config)` - platform-scoped MemWal client
- `createUserClient(config)` - per-user scoped client
- `MemoryRouter` - `recallForNode()` with dedup + distance sorting, `rememberFromNode()` (fire-and-forget)
- `ns` - namespace builders (`pool::`, `private::`, `workspace::`, `session::`) with `{userId}`/`{runId}` template resolution

### packages/sdk (@m2a/sdk)

Canonical TypeScript types + Zod validators + REST client:
- `WorkflowDefinition`, `WorkflowNode` (agent/input/output), `WorkflowEdge`
- `MemoryTierConfig`, `RecallMemory`, `AgentPolicy`, `ActivityEntry`
- On-chain mirror types (`AgentPolicyOnChain`, `ActivityLogOnChain`, `CapabilityOnChain`)
- `fromOnChainPolicy()` converter
- `M2AClient(runtimeUrl)` - `executeWorkflow(id, options)` + `executeAdHoc(workflow, options)`
- Uses axios, supports optional Bearer token auth

---

## The Three-Layer Memory Model

M2A's memory system uses **namespaced vector embeddings** stored in pgvector, encrypted via SEAL, and backed by Walrus blobs:

```
Namespace Format         Scope              Example
───────────────────────  ─────────────────  ─────────────────────────
pool::{domain}           Global platform    pool::research, pool::code-review
private::{user}::{path}  User-private       private::0xABC::notes::session-1
workspace::{team}::{proj} Team-scoped       workspace::acme::project-x
```

**Cross-user learning flow:**
1. Node A recalls from `pool::research` → gets knowledge from ALL past platform runs
2. Agent executes with enriched context
3. Node A remembers output → `pool::research` grows
4. Next user's agent automatically inherits this knowledge

The platform wallet owns all pool namespaces. Users get scoped delegate keys from the MemWal contract.

---

## Sui Smart Contracts (Move 2024 Edition)

| Module | Lines | Purpose |
|--------|-------|---------|
| `m2a.move` | 104 | Main entry: `init`, `create_agent`, `top_up_agent`, `deactivate_agent` |
| `policy.move` | 175 | `AgentPolicy` struct with budget, whitelists, expiry, activity log |
| `registry.move` | 54 | `AgentRegistry` with wallet→policy and owner→policies mappings |
| `execution.move` | 43 | Pre/post execution guards, `can_execute` check |
| `capability.move` | 48 | Scoped `Capability` tokens with expiry and revocation |
| `governance.move` | 47 | `GovernanceCap` for `freeze_agent` and `update_policy` |

**Test suite:** 34 tests across 3 files (`execution_tests`, `policy_tests`, `registry_tests`)

---

## Environment Configuration

### Network-aware env vars

All env vars that differ per network are suffixed with `_{SUI_NETWORK}`.
`SUI_NETWORK=testnet` reads `M2A_PACKAGE_ID_testnet`, `M2A_PACKAGE_ID_mainnet`
for mainnet. No bare fallback. Affected vars:

- `M2A_PACKAGE_ID_{SUI_NETWORK}`
- `M2A_REGISTRY_ID_{SUI_NETWORK}`  
- `MEMWAL_PLATFORM_ACCOUNT_ID_{SUI_NETWORK}`

### Root `.env`
```
M2A_RUNTIME_PORT=3001
ANTHROPIC_API_KEY=...
SUI_NETWORK=testnet
MEMWAL_MODE=self

MEMWAL_RELAYER_URL=http://localhost:8000
MEMWAL_PACKAGE_ID=0x...
MEMWAL_REGISTRY_ID=0x...
MEMWAL_PLATFORM_ACCOUNT_ID_testnet=0x...
SERVER_SUI_PRIVATE_KEY=suiprivkey1...
DATABASE_URL=postgres://postgres:postgres@localhost:5432/memwal
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=... (Gemini free tier)
OPENAI_API_BASE=https://generativelanguage.googleapis.com/v1beta/openai
```

### apps/runtime `.env`
```
M2A_RUNTIME_PORT=3001
SUI_NETWORK=testnet
MEMWAL_MODE=self
MEMWAL_PLATFORM_ACCOUNT_ID_testnet=0x...
SERVER_SUI_PRIVATE_KEY=suiprivkey1...
MEMWAL_RELAYER_URL=http://localhost:8000
ANTHROPIC_API_KEY=...  # or GEMINI_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, etc.
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/m2a
```

### apps/studio `.env`
```
VITE_RUNTIME_URL=http://localhost:3001
VITE_NETWORK=testnet
VITE_M2A_PACKAGE_ID_testnet=0x...
VITE_M2A_REGISTRY_ID_testnet=0x...
```

---

## Boot Order

### 1. Infrastructure
```bash
docker compose -f apps/runtime/docker-compose.yml up -d
# postgres:5432 (pgvector) + redis:6379
```

### 2. Relayer sidecar deps (one time)
```bash
cd services/server/scripts && npm ci && cd ../../..
```

### 3. MemWal Relayer
```bash
cd services/server
cargo run
# Relayer :8000 + auto-starts TS sidecar :9000
```

### 4. MemWal Indexer (separate terminal)
```bash
cd services/indexer
cargo run
# Polls Sui testnet events → syncs to postgres
```

### 5. Build shared packages
```bash
npm run build:packages
```

### 6. Runtime (unified backend)
```bash
npm run dev:runtime
# Express :3001 — execution, authz, MCP, workflow CRUD
```

### 7. Studio
```bash
npm run dev:studio
# Vite :5173
```

---

## Development Commands

```bash
npm run dev            # Run runtime + studio concurrently
npm run build          # Build all packages and apps
npm test               # Run all tests (turbo)
npm run clean          # Clean all dist/ directories

# Individual apps
npm run dev:studio     # Studio only (:5173)
npm run dev:runtime    # Runtime only (:3001)
npm run dev:runtime:mcp# Runtime in MCP stdio mode

# Individual packages
npm run build:packages # @m2a/sdk + @m2a/client

# Test via Studio UI at http://localhost:5173

# Smart contracts
cd contracts/m2a
sui move build         # Compile Move 2024 contracts
sui move test          # Run 34 unit tests

# Runtime tests
npm -w @m2a/runtime test
```

---

## Package Dependency Graph

```
@m2a/sdk (types + Zod + axios)
    ↑         ↑
    │         │
@m2a/client  @m2a/runtime
(memwal +    (express +
 sui SDK)     anthropic +
              gemini + etc.)
    ↑              ↑
    │              │
@m2a/runtime  @m2a/studio
(uses client  (react + reactflow +
 for memory)   dapp-kit + zustand)
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Zustand over Redux** | Minimal boilerplate, excellent TypeScript inference, built-in middleware |
| **Namespace memory model** | Cross-user learning via pool:: - no user owns the pool, the platform does |
| **8 LLM providers** | Agnostic execution - bring your own key, any model |
| **Unified runtime (no gateway)** | Direct authz call eliminates HTTP proxy latency and deployment complexity |
| **MCP via runtime** | HTTP + stdio modes in same binary, no separate mcp-export service |
| **Retry with continue** | Failed agent nodes retry 3x but don't abort the workflow (partial results OK) |
| **Move 2024 edition** | Method syntax, direct string literals, explicit destroy() for non-drop objects |
| **PostgreSQL + pgvector** | Vector similarity search for memory recall, JSONB for workflow definitions |
| **SEAL + Walrus** | Encrypted blob storage: content-addressable, permanent, verifiable |
| **Turbo repo** | Parallel builds, cached outputs, filtered task execution |

---

## Production Readiness Checklist

- [ ] Deploy M2A Move contracts to Mainnet
- [ ] Set `VITE_M2A_PACKAGE_ID` / `VITE_M2A_REGISTRY_ID` env vars
- [ ] Set `M2A_PACKAGE_ID` / `M2A_REGISTRY_ID` in runtime env
- [ ] Fund platform wallet via faucet or mainnet transfer
- [ ] Add PostgreSQL connection pooling (pgBouncer)
- [ ] Add rate limiting on runtime (express-rate-limit)
- [ ] Add HTTPS termination (reverse proxy: Caddy / nginx)
- [ ] Expand template marketplace with user-created templates and sharing

---

## License

GPL v3
