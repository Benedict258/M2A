import { useState, useEffect } from "react";
import { Check, Loader2, Search, X, ExternalLink, Wallet, ArrowRight, AlertCircle } from "lucide-react";
import { useWorkflow, type Agent, type CanvasNode, type Connection } from "@/lib/workflow-context";
import { api } from "@/lib/api";
import { useSui } from "@/lib/sui-provider";
import { notify } from "@/lib/toast";

/* ------------ Shell ------------ */
function Shell({ open, onClose, children, size = "md" }: { open: boolean; onClose: () => void; children: React.ReactNode; size?: "md" | "lg" | "xl" }) {
  if (!open) return null;
  const max = size === "xl" ? "max-w-4xl" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full ${max} overflow-hidden rounded-xl border border-border bg-popover shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ------------ Templates ------------ */
type TemplateDef = {
  id: string;
  category: string;
  title: string;
  nodes: number;
  desc: string;
  canvasNodes?: CanvasNode[];
  canvasConnections?: Connection[];
};

const BUILTIN_TEMPLATES: TemplateDef[] = [
  {
    id: "whale", category: "DeFi", title: "SUI Whale Tracker", nodes: 5,
    desc: "Real-time monitoring of large-scale SUI movements with automated alert routing to Discord and Telegram.",
    canvasNodes: [
      { id: "n_sched", type: "schedule_trigger", x: 80, y: 200, status: "idle" },
      { id: "n_monitor", type: "balance_monitor", x: 320, y: 200, status: "idle" },
      { id: "n_cond", type: "conditional", x: 560, y: 140, status: "idle" },
      { id: "n_discord", type: "discord", x: 800, y: 80, status: "idle" },
      { id: "n_telegram", type: "telegram_send", x: 800, y: 200, status: "idle" },
    ],
    canvasConnections: [
      { id: "c1", from: "n_sched", to: "n_monitor" },
      { id: "c2", from: "n_monitor", to: "n_cond" },
      { id: "c3", from: "n_cond", to: "n_discord", branch: "true" },
      { id: "c4", from: "n_cond", to: "n_telegram" },
    ],
  },
  {
    id: "social", category: "AI", title: "AI Social Media Agent", nodes: 8,
    desc: "GPT-powered agent that scans mentions, performs sentiment analysis, and generates contextual responses.",
    canvasNodes: [
      { id: "n_sched", type: "schedule_trigger", x: 80, y: 200, status: "idle" },
      { id: "n_rss", type: "rss_reader", x: 320, y: 80, status: "idle" },
      { id: "n_agent", type: "agent", x: 320, y: 200, status: "idle" },
      { id: "n_twitter", type: "twitter", x: 320, y: 320, status: "idle" },
      { id: "n_merge", type: "merge", x: 560, y: 200, status: "idle" },
      { id: "n_out", type: "output", x: 800, y: 200, status: "idle" },
    ],
    canvasConnections: [
      { id: "c1", from: "n_sched", to: "n_rss" },
      { id: "c2", from: "n_sched", to: "n_agent" },
      { id: "c3", from: "n_sched", to: "n_twitter" },
      { id: "c4", from: "n_rss", to: "n_merge" },
      { id: "c5", from: "n_agent", to: "n_merge" },
      { id: "c6", from: "n_twitter", to: "n_merge" },
      { id: "c7", from: "n_merge", to: "n_out" },
    ],
  },
  {
    id: "discord", category: "Trigger", title: "Discord-to-On-Chain Bot", nodes: 4,
    desc: "Bridge Web2 commands to Web3 actions. Execute secure smart contract calls directly from specialized Discord roles.",
    canvasNodes: [
      { id: "n_discord", type: "discord_trigger", x: 80, y: 200, status: "idle" },
      { id: "n_agent", type: "agent", x: 320, y: 200, status: "idle" },
      { id: "n_tx", type: "sui", x: 560, y: 200, status: "idle" },
      { id: "n_out", type: "output", x: 800, y: 200, status: "idle" },
    ],
    canvasConnections: [
      { id: "c1", from: "n_discord", to: "n_agent" },
      { id: "c2", from: "n_agent", to: "n_tx" },
      { id: "c3", from: "n_tx", to: "n_out" },
    ],
  },
  {
    id: "yield", category: "DeFi", title: "Automated Yield Harvester", nodes: 6,
    desc: "Automatically claims rewards and reinvests them into high-APY pools based on gas-price thresholds and slippage.",
    canvasNodes: [
      { id: "n_sched", type: "schedule_trigger", x: 80, y: 240, status: "idle" },
      { id: "n_pyth", type: "pyth", x: 320, y: 80, status: "idle" },
      { id: "n_cond", type: "conditional", x: 320, y: 240, status: "idle" },
      { id: "n_alphafi", type: "alphafi", x: 560, y: 120, status: "idle" },
      { id: "n_haedal", type: "haedal", x: 560, y: 280, status: "idle" },
      { id: "n_out", type: "output", x: 800, y: 200, status: "idle" },
    ],
    canvasConnections: [
      { id: "c1", from: "n_sched", to: "n_pyth" },
      { id: "c2", from: "n_pyth", to: "n_cond" },
      { id: "c3", from: "n_cond", to: "n_alphafi", branch: "true" },
      { id: "c4", from: "n_cond", to: "n_haedal" },
      { id: "c5", from: "n_alphafi", to: "n_out" },
      { id: "c6", from: "n_haedal", to: "n_out" },
    ],
  },
  {
    id: "rebalance", category: "DeFi", title: "Treasury Auto-Rebalance", nodes: 7,
    desc: "Maintain target allocation across SUI/USDC pools with safe slippage and oracle-confirmed price feeds.",
    canvasNodes: [
      { id: "n_sched", type: "schedule_trigger", x: 80, y: 200, status: "idle" },
      { id: "n_pyth", type: "pyth", x: 320, y: 80, status: "idle" },
      { id: "n_balance", type: "balance_monitor", x: 320, y: 200, status: "idle" },
      { id: "n_cond", type: "conditional", x: 560, y: 200, status: "idle" },
      { id: "n_swap", type: "aftermath", x: 800, y: 120, status: "idle" },
      { id: "n_lend", type: "suilend", x: 800, y: 280, status: "idle" },
      { id: "n_out", type: "output", x: 1040, y: 200, status: "idle" },
    ],
    canvasConnections: [
      { id: "c1", from: "n_sched", to: "n_pyth" },
      { id: "c2", from: "n_sched", to: "n_balance" },
      { id: "c3", from: "n_pyth", to: "n_cond" },
      { id: "c4", from: "n_balance", to: "n_cond" },
      { id: "c5", from: "n_cond", to: "n_swap", branch: "true" },
      { id: "c6", from: "n_cond", to: "n_lend" },
      { id: "c7", from: "n_swap", to: "n_out" },
      { id: "c8", from: "n_lend", to: "n_out" },
    ],
  },
  {
    id: "rss", category: "Web2", title: "RSS → AI Summary → Slack", nodes: 4,
    desc: "Poll feeds, summarize with an agent, post the digest to Slack.",
    canvasNodes: [
      { id: "n_sched", type: "schedule_trigger", x: 80, y: 200, status: "idle" },
      { id: "n_rss", type: "rss_reader", x: 320, y: 200, status: "idle" },
      { id: "n_agent", type: "agent", x: 560, y: 200, status: "idle" },
      { id: "n_slack", type: "slack", x: 800, y: 200, status: "idle" },
    ],
    canvasConnections: [
      { id: "c1", from: "n_sched", to: "n_rss" },
      { id: "c2", from: "n_rss", to: "n_agent" },
      { id: "c3", from: "n_agent", to: "n_slack" },
    ],
  },
];

export function TemplateMarketplace({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useWorkflow();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [remoteTemplates, setRemoteTemplates] = useState<TemplateDef[]>([]);
  const [loading, setLoading] = useState(false);
  const cats = ["All", "AI", "DeFi", "Web2", "Trigger"];

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.listTemplates().then((templates: any[]) => {
      const mapped: TemplateDef[] = templates.map((t: any) => {
        const def = t.definition || t;
        const nodes = def.nodes || [];
        const edges = def.edges || def.connections || [];
        return {
          id: def.id || t.id,
          category: t.category || def.category || "API",
          title: def.name || t.name || "Untitled",
          nodes: nodes.length,
          desc: def.description || t.description || "",
          canvasNodes: nodes.map((n: any) => ({ id: n.id, type: n.type, x: n.position?.x ?? n.x ?? 280, y: n.position?.y ?? n.y ?? 180, status: "idle" as const, config: n.data || {} })),
          canvasConnections: edges.map((e: any) => ({ id: e.id, from: e.source || e.from, to: e.target || e.to, branch: e.sourceHandle || e.branch || undefined })),
        };
      });
      setRemoteTemplates(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open]);

  const all = remoteTemplates.length > 0 ? remoteTemplates : BUILTIN_TEMPLATES;
  const filtered = all.filter((t) => (cat === "All" || t.category === cat) && t.title.toLowerCase().includes(q.toLowerCase()));

  const useTemplate = (t: TemplateDef) => {
    if (t.canvasNodes && t.canvasConnections) {
      dispatch({ type: "load_template", nodes: t.canvasNodes, connections: t.canvasConnections, name: t.title });
    }
    onClose();
  };

  return (
    <Shell open={open} onClose={onClose} size="xl">
      <div className="flex items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h2 className="font-display text-xl font-semibold">Template Marketplace</h2>
          <p className="text-sm text-muted-foreground">Deploy pre-built AI & Blockchain automation logic in seconds.</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-container/50 px-6 py-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates…"
            className="h-10 w-full rounded-full border border-border bg-surface px-10 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollbar-thin grid max-h-[60vh] gap-4 overflow-y-auto p-6 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-full grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full grid place-items-center py-16 text-xs text-muted-foreground">No templates found.</div>
        ) : filtered.map((t) => (
          <div key={t.id} className="flex flex-col rounded-lg border border-border bg-surface p-5 transition hover:border-primary/40">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">{t.category}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{t.nodes} Nodes</span>
            </div>
            <h3 className="font-display text-base font-semibold">{t.title}</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
            <button
              onClick={() => useTemplate(t)}
              className="mt-4 w-full rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Use Template
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-surface-container/50 px-6 py-3 text-[11px] text-muted-foreground">
        <span>
          <strong className="text-foreground">{all.length} templates</strong>
        </span>
        <span>{remoteTemplates.length > 0 ? "API" : "Built-in"}</span>
      </div>
    </Shell>
  );
}

/* ------------ Create Agent ------------ */
const PROTOCOLS = ["Aftermath", "Navi", "Cetus", "Bluefin", "Suilend"];
const TOOLS = ["Walrus Storage", "Sui RPC", "Price Feeds", "AI Memory"];

export function CreateAgentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useWorkflow();
  const { isConnected, authMethod, startZkLogin, address } = useSui();
  const [step, setStep] = useState<"form" | "auth" | "signing" | "done">("form");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState(50);
  const [fund, setFund] = useState(10);
  const [protocols, setProtocols] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [txDigest, setTxDigest] = useState("");
  const [txError, setTxError] = useState("");

  const reset = () => {
    setStep("form");
    setTxError("");
    onClose();
  };

  const next = async () => {
    setTxError("");
    if (!isConnected) {
      setStep("auth");
      startZkLogin();
      return;
    }
    setStep("signing");
    try {
      const result = await api.registerAgent({
        name,
        budgetCap: budget,
        initialFund: fund,
        protocols,
        tools,
        address,
      });
      const agent: Agent = {
        id: result.id || `a_${Date.now()}`,
        name: result.name || name,
        status: result.status === "active" ? "active" : "inactive",
        budgetUsed: result.budgetUsed ?? 0,
        budgetCap: result.budgetCap ?? budget,
        address: result.address || address || "",
      };
      dispatch({ type: "add_agent", agent });
      setTxDigest(result.txDigest || "");
      setStep("done");
      notify.success('Agent created');
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create agent";
      setTxError(msg);
      notify.error('Agent creation failed: ' + msg);
      setStep("form");
    }
  };

  const stepIdx = ["form", "auth", "signing", "done"].indexOf(step);

  return (
    <Shell open={open} onClose={reset} size="lg">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-primary">Step {stepIdx + 1} of 4: {step === "form" ? "Configuration" : step === "auth" ? "Authentication" : step === "signing" ? "Signing" : "Complete"}</span>
          <span className="text-muted-foreground uppercase tracking-wider font-bold">General Identity</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= stepIdx ? "bg-primary" : "bg-surface-high"}`} />
          ))}
        </div>
      </div>

      <div className="scrollbar-thin max-h-[60vh] overflow-y-auto px-6 py-6">
        {step === "form" && (
            <div className="space-y-5">
            <Field label="Agent Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Trading Bot"
                className="h-11 w-full rounded-md border border-border bg-surface-container px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Budget Cap">
                <div className="relative">
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="h-11 w-full rounded-md border border-border bg-surface-container pl-3.5 pr-12 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">SUI</span>
                </div>
              </Field>
              <Field label="Initial Fund">
                <div className="relative">
                  <input
                    type="number"
                    value={fund}
                    onChange={(e) => setFund(Number(e.target.value))}
                    className="h-11 w-full rounded-md border border-border bg-surface-container pl-3.5 pr-12 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">SUI</span>
                </div>
              </Field>
            </div>
            <Field label="Protocol Permissions">
              <Pills options={PROTOCOLS} selected={protocols} onChange={setProtocols} />
            </Field>
            <Field label="Authorized Tools">
              <Pills options={TOOLS} selected={tools} onChange={setTools} />
            </Field>
            <div className="rounded-md border border-border bg-surface-container p-3 text-xs text-muted-foreground">
              {authMethod === "zklogin" ? (
                <>Agent wallet: <span className="font-mono text-foreground">{address}</span> (same as your Google-authenticated address)</>
              ) : isConnected ? (
                <>Agent wallet: <span className="font-mono text-foreground">{address}</span></>
              ) : (
                <>You'll authenticate with Google to create the agent wallet address.</>
              )}
            </div>
          </div>
        )}

        {step === "auth" && (
          <Center>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium">Complete Google sign-in in the popup…</p>
            <p className="mt-1 text-xs text-muted-foreground">zkLogin establishes the agent wallet keypair on Sui.</p>
          </Center>
        )}
        {step === "signing" && (
          <Center>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium">Sign the transaction in your wallet…</p>
            <p className="mt-1 text-xs text-muted-foreground">This funds the agent and writes its policy on-chain.</p>
            {txError && (
              <>
                <p className="mt-4 text-sm text-red-400">{txError}</p>
                <button onClick={() => setStep("form")} className="mt-4 rounded-md border border-border bg-surface-container px-4 py-2 text-sm hover:bg-accent">Go Back</button>
              </>
            )}
          </Center>
        )}
        {step === "done" && (
          <Center>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15">
              <Check className="h-6 w-6 text-success" />
            </div>
            <p className="mt-4 font-display text-lg font-semibold">Agent created</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}</p>
            {txDigest && (
              <a href={`https://suiscan.xyz/testnet/tx/${txDigest}`} target="_blank" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                View transaction <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </Center>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-surface-container/50 px-6 py-4">
        <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground">
          {step === "done" ? "Close" : "Cancel"}
        </button>
        {step === "form" && (
          <button
            onClick={next}
            disabled={!name.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            {isConnected && authMethod === "zklogin" ? "Confirm & Create Agent" : "Sign with Google & Create Agent"} <ArrowRight className="h-4 w-4" />
          </button>
        )}
        {step === "auth" && (
          <button onClick={() => setStep("form")} className="text-sm text-muted-foreground hover:text-foreground underline">
            Cancel authentication
          </button>
        )}
        {step === "done" && (
          <button onClick={reset} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Done
          </button>
        )}
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Center({ children }: { children: React.ReactNode }) {
  return <div className="py-10 text-center">{children}</div>;
}
function Pills({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface-container hover:bg-accent"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ------------ Top Up ------------ */
export function TopUpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { agents, selectedAgentId } = useWorkflow();
  const agent = agents.find((a) => a.id === selectedAgentId);
  const [amount, setAmount] = useState(10);

  return (
    <Shell open={open} onClose={onClose}>
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-display text-lg font-semibold">Top Up Agent</h2>
        <p className="text-xs text-muted-foreground">Add SUI to the agent's spending budget.</p>
      </div>
      <div className="space-y-4 px-6 py-5">
        {agent && (
          <div className="rounded-md border border-border bg-surface-container p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">{agent.name}</span>
              <span className="font-mono text-muted-foreground">{agent.address}</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Budget: {agent.budgetUsed} / {agent.budgetCap} SUI
            </div>
          </div>
        )}
        <Field label="Amount (SUI)">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="h-11 w-full rounded-md border border-border bg-surface-container px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-container/50 px-6 py-4">
        <button onClick={onClose} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
        <button onClick={onClose} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Sign & Top Up
        </button>
      </div>
    </Shell>
  );
}

/* ------------ Wallet Connect ------------ */
export function WalletDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isConnected, isConnecting, address, authMethod, connectWallet, startZkLogin, disconnect } = useSui();

  const handleConnectWallet = async () => {
    await connectWallet();
    onClose();
  };

  const handleGoogleLogin = () => {
    startZkLogin();
    onClose();
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const addrLabel = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <Shell open={open} onClose={onClose}>
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-display text-lg font-semibold">Connect Wallet</h2>
        <p className="text-xs text-muted-foreground">Use a Sui wallet or sign in with Google (zkLogin).</p>
      </div>
      <div className="space-y-2 px-4 py-4">
        {isConnected ? (
          <>
            <div className="rounded-md border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
              {authMethod === "zklogin" ? "Signed in with Google" : "Wallet connected"} · {addrLabel}
            </div>
            <button
              onClick={handleDisconnect}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-danger/30 bg-surface-container px-4 py-3 text-sm text-danger hover:bg-danger/10"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            {["Sui Wallet", "Suiet", "Ethos", "Phantom"].map((w) => (
              <button
                key={w}
                onClick={w === "Sui Wallet" ? handleConnectWallet : handleConnectWallet}
                disabled={isConnecting}
                className="flex w-full items-center justify-between rounded-md border border-border bg-surface-container px-4 py-3 text-sm hover:bg-accent disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" /> {w}
                </span>
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </button>
        ))}

            <button
              onClick={handleGoogleLogin}
              disabled={isConnecting}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">G</span>
              Sign in with Google
            </button>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-border bg-surface-container/50 px-6 py-3 text-[11px] text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5" />
        Wallet keys never leave your device.
      </div>
    </Shell>
  );
}
