import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Loader2, RefreshCw, Trash2, Zap } from "lucide-react";
import { useWorkflow } from "@/lib/workflow-context";
import { api } from "@/lib/api";
import { ErrorBoundary } from "@/lib/error-boundary";

const TABS = ["Logs", "Results", "Memory", "Datasets", "Activity", "History"] as const;
type Tab = (typeof TABS)[number];

export function BottomPanel() {
  const { logs, dispatch, nodes } = useWorkflow();
  const [tab, setTab] = useState<Tab>("Logs");
  const [open, setOpen] = useState(true);

  return (
    <ErrorBoundary>
    <div className={`shrink-0 border-t border-border bg-surface ${open ? "h-56" : "h-9"} flex flex-col transition-all`}>
      <div className="flex h-9 items-center border-b border-border pr-2">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setOpen(true);
              }}
              className={`relative px-4 py-2 text-xs font-semibold transition ${
                tab === t && open ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {tab === t && open && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {open && tab === "Logs" && (
            <button
              onClick={() => dispatch({ type: "clear_logs" })}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Clear"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => setOpen(!open)} className="rounded p-1 text-muted-foreground hover:bg-accent">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
          {tab === "Logs" && <LogsTab logs={logs} />}
          {tab === "Results" && <ResultsTab nodes={nodes} />}
          {tab === "Memory" && <Empty>Enter a pool name above to explore shared agent memory.</Empty>}
          {tab === "Datasets" && <DatasetsTab />}
          {tab === "Activity" && <ActivityTab active={tab === "Activity"} />}
          {tab === "History" && <HistoryTab />}
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

function LogsTab({ logs }: { logs: ReturnType<typeof useWorkflow>["logs"] }) {
  if (logs.length === 0) {
    return <Empty>No logs yet — press Run to execute the workflow.</Empty>;
  }
  return (
    <div className="space-y-1 font-mono text-[12px]">
      {logs.map((l) => (
        <div key={l.id} className="flex items-start gap-2 rounded px-2 py-1 hover:bg-surface-container">
          <span className="shrink-0 text-muted-foreground">[{l.ts}]</span>
          <span
            className={
              l.level === "success"
                ? "text-success"
                : l.level === "error"
                  ? "text-danger"
                  : l.level === "llm"
                    ? "text-warning"
                    : l.level === "debug"
                      ? "text-info"
                      : "text-foreground"
            }
          >
            [{l.level.toUpperCase()}]
          </span>
          <span className="flex-1 break-words text-foreground/90">{l.message}</span>
        </div>
      ))}
    </div>
  );
}

function ResultsTab({ nodes }: { nodes: ReturnType<typeof useWorkflow>["nodes"] }) {
  const results = nodes.filter((n) => n.config?.output);
  if (results.length === 0) {
    return <Empty>No results yet. Run a workflow to see outputs.</Empty>;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((n) => (
        <div key={n.id} className="rounded-md border border-border bg-surface-container p-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold">{n.type}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                n.status === "error" ? "bg-danger/15 text-danger" : "bg-success/15 text-success"
              }`}
            >
              {n.status ?? "idle"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-2">{String(n.config?.output || "").slice(0, 120)}</p>
        </div>
      ))}
    </div>
  );
}

function DatasetsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getDatasetStats()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data || !data.datasets || data.datasets.length === 0) {
    return <Empty>No datasets found.</Empty>;
  }
  return (
    <div className="space-y-2">
      <div className="mb-2 grid grid-cols-3 gap-2">
        <StatBox label="Total Interactions" value={data.totalInteractions ?? "—"} />
        <StatBox label="Claim Count" value={data.claimCount ?? "—"} />
        <StatBox label="Privacy Score" value={data.privacyScore ? `${data.privacyScore}/100` : "—"} />
      </div>
      {data.datasets.map((ds: any, i: number) => (
        <div key={i} className="flex items-center justify-between rounded-md border border-border bg-surface-container px-3 py-2 text-xs">
          <span className="font-semibold">{ds.category || ds.name || `Dataset ${i + 1}`}</span>
          <span className="text-muted-foreground">
            {ds.claimCount ?? ds.size ?? 0} claims
            {ds.privacyScore != null && <span className="ml-2 text-success">{ds.privacyScore}/100</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function ActivityTab({ active }: { active: boolean }) {
  const { selectedAgentId } = useWorkflow();
  const [activityEntries, setActivityEntries] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const loadActivity = async () => {
    if (!selectedAgentId) return;
    setActivityLoading(true);
    try {
      const res = await fetch(`/api/v1/agents/${selectedAgentId}/activity`);
      const entries = await res.json();
      setActivityEntries(entries || []);
    } catch { setActivityEntries([]); }
    finally { setActivityLoading(false); }
  };

  useEffect(() => { if (active) loadActivity(); }, [active, selectedAgentId]);

  if (!selectedAgentId) {
    return <Empty>Select an agent to view activity</Empty>;
  }
  if (activityLoading) return <Loading />;
  if (activityEntries.length === 0) {
    return <Empty>No activity for this agent</Empty>;
  }
  return (
    <div className="space-y-1.5">
      {activityEntries.map((entry: any) => (
        <div key={entry.id} className="rounded-md border border-border bg-surface-container px-2.5 py-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{entry.action}</span>
            <span className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleTimeString()}</span>
          </div>
          <div className="mt-0.5 text-muted-foreground">
            {entry.protocol} · {entry.amount_spent} mist
            {entry.tx_digest && (
              <a href={`https://suiscan.xyz/testnet/tx/${entry.tx_digest}`} target="_blank" className="ml-1 text-primary hover:underline">View</a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryTab() {
  const { dispatch } = useWorkflow();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.listExecutionHistory()
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading />;
  if (items.length === 0) {
    return (
      <div className="grid h-full place-items-center">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">No execution history.</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-container px-3 py-1.5 text-xs hover:bg-accent"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
    </div>
  );
  }
  return (
    <div className="space-y-2">
      {items.map((entry) => (
        <div key={entry.id || entry.run_id} className="rounded-md border border-border bg-surface-container p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  entry.status === "completed"
                    ? "bg-success/15 text-success"
                    : entry.status === "failed"
                      ? "bg-danger/15 text-danger"
                      : "bg-warning/15 text-warning"
                }`}
              >
                {entry.status || "unknown"}
              </span>
              <span className="text-xs font-semibold text-foreground">{entry.workflow_name || entry.name || "Workflow"}</span>
            </div>
            <div className="flex items-center gap-2">
              {entry.run_duration_ms != null && (
                <span className="text-[10px] text-muted-foreground">{entry.run_duration_ms}ms</span>
              )}
              <button
                onClick={() => {
                  if (entry.workflow_id) {
                    dispatch({ type: "log", entry: { id: `l_${Date.now()}`, level: "info", message: `Loading workflow ${entry.workflow_id}...`, ts: new Date().toTimeString().slice(0, 8) } });
                  }
                }}
                className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/25"
              >
                Re-run
              </button>
            </div>
          </div>
          {entry.started_at && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              {new Date(entry.started_at).toLocaleString()}
            </div>
          )}
          {entry.error_message && (
            <div className="mt-1 text-[10px] text-danger">{entry.error_message}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-surface-container p-2 text-center">
      <div className="text-sm font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid h-full place-items-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full place-items-center text-xs text-muted-foreground">{children}</div>;
}
