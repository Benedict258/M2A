import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowLeft, ArrowUp, Boxes, Cpu, Database, Plus, RefreshCw, Shield, Workflow as WorkflowIcon, Diamond, Loader2 } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";
import { ErrorBoundary } from "@/lib/error-boundary";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Buiry M2A Studio" },
      { name: "description", content: "System-wide performance and orchestration telemetry." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { theme, toggle } = useTheme();

  const [agents, setAgents] = useState<number>(0);
  const [workflows, setWorkflows] = useState<number>(0);
  const [activePolicies, setActivePolicies] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<string>("—");
  const [healthItems, setHealthItems] = useState<Array<{ name: string; value: string }>>([]);
  const [activities, setActivities] = useState<Array<{ title: string; id: string; time: string; status: string }>>([]);
  const [history, setHistory] = useState<Array<{ label: string; success: number; failed: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.listAgents().then((a) => setAgents(a.length)),
      api.listWorkflows().then((w) => setWorkflows(w.length)),
      api.health(),
      api.listExecutionHistory(),
      api.getDatasetStats(),
    ]).then((results) => {
      const agentsData = results[0].status === "fulfilled" ? results[0].value : 0;
      setActivePolicies(agentsData as number);

      const healthData = results[2].status === "fulfilled" ? results[2].value : null;
      if (healthData) {
        setHealthItems([
          { name: "Sui RPC", value: healthData.suiRpc || "Healthy" },
          { name: "Walrus Node", value: healthData.walrusNode || "Active" },
          { name: "AI Gateway", value: healthData.aiGateway || "Ready" },
          { name: "Workflow Engine", value: healthData.engine || "Running" },
        ]);
      }

      if (results[3].status === "fulfilled") {
        const histData = results[3].value || [];
        const successCount = histData.filter((e: any) => e.status === "completed").length;
        const failCount = histData.filter((e: any) => e.status === "failed").length;
        setHistory(histData.slice(0, 5).map((e: any) => ({
          label: e.workflow_name || "Workflow",
          success: e.status === "completed" ? 1 : 0,
          failed: e.status === "failed" ? 1 : 0,
        })));
        setActivities(histData.slice(0, 4).map((e: any) => ({
          title: e.workflow_name || "Workflow execution",
          id: e.workflow_id || e.id || "—",
          time: e.started_at ? new Date(e.started_at).toLocaleTimeString() : "—",
          status: e.status === "completed" ? "SUCCESS" : e.status === "failed" ? "ERROR" : "RUNNING",
        })));
      }

      if (results[4].status === "fulfilled") {
        const dsData = results[4].value;
        setMemoryUsage(dsData?.totalInteractions ? String(dsData.totalInteractions) : "—");
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <ErrorBoundary>
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-primary">
            <span className="text-sm font-bold">M</span>
          </div>
          <span className="font-display text-base font-semibold">M2A Studio</span>
        </div>
        <div className="px-3 pb-3">
          <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to editor
          </Link>
        </div>
        <div className="mx-3 mb-3 rounded-lg border border-border bg-surface-container p-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-primary">
              <Boxes className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold">Library</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Workflow Assets</div>
            </div>
          </div>
        </div>
        <nav className="space-y-0.5 px-3 text-sm">
          <SideLink active icon={WorkflowIcon}>Nodes</SideLink>
          <SideLink icon={WorkflowIcon}>Workflows</SideLink>
          <SideLink icon={Activity}>Executions</SideLink>
        </nav>
        <div className="mt-auto space-y-2 p-3 text-xs">
          <button className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary/15 px-3 py-2 font-semibold text-primary hover:bg-primary/25">
            <Plus className="h-3.5 w-3.5" /> New Workflow
          </button>
          <button className="block w-full rounded-md px-3 py-2 text-left text-muted-foreground hover:bg-accent hover:text-foreground">Settings</button>
          <button className="block w-full rounded-md px-3 py-2 text-left text-muted-foreground hover:bg-accent hover:text-foreground">Support</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Dashboard</span>
          <Link to="/" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Editor
          </Link>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assets</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface-container hover:bg-accent text-xs">
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button className="rounded-md border border-border bg-surface-container px-3 py-1.5 text-sm hover:bg-accent">
              Create Agent
            </button>
            <Link to="/" className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Run
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="grid flex-1 place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="canvas-grid scrollbar-thin flex-1 overflow-y-auto px-6 py-8 lg:px-10">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-semibold">Buiry Admin Dashboard</h1>
                <p className="mt-1 text-sm text-muted-foreground">System-wide performance and orchestration telemetry.</p>
              </div>
              <div className="flex items-center gap-1 rounded-md border border-border bg-surface-container p-1 text-xs">
                {["24 Hours", "7 Days", "30 Days"].map((t, i) => (
                  <button key={t} className={`rounded px-3 py-1.5 font-semibold uppercase tracking-wider ${i === 0 ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat title="Total Agents" value={String(agents)} sub={<span className="inline-flex items-center gap-1 text-success"><ArrowUp className="h-3 w-3" /> Active</span>} accent="var(--primary)" />
              <Stat title="Total Workflows" value={String(workflows)} sub="On platform" accent="var(--cyan)" />
              <Stat title="Active Policies" value={String(activePolicies)} sub="Governing" accent="var(--success)" />
              <Stat title="Memory Usage" value={memoryUsage} sub="Total interactions" accent="var(--warning)" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <Panel title="Workflow Executions (24h)" right={<Legend />}>
                  <ExecutionsChart history={history} />
                </Panel>
                <Panel title="Recent Activity" right={<RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />}>
                  {activities.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">No recent activity</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {activities.map((a, i) => (
                        <div key={i} className="flex items-center gap-4 py-3">
                          <div className="grid h-9 w-9 place-items-center rounded-md bg-surface-container">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold">{a.title}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">Workflow ID: {a.id}</div>
                          </div>
                          <div className="text-right text-[11px]">
                            <div className="font-mono">{a.time}</div>
                            <div className="uppercase tracking-wider text-muted-foreground">Today</div>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${a.status === "ERROR" ? "bg-danger/15 text-danger" : "bg-success/15 text-success"}`}>
                            {a.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <div className="space-y-6">
                <Panel title="System Health">
                  <div className="space-y-2">
                    {healthItems.length === 0 ? (
                      <div className="py-4 text-center text-xs text-muted-foreground">No health data available</div>
                    ) : (
                      healthItems.map((h) => (
                        <div key={h.name} className="flex items-center justify-between rounded-md border border-border bg-surface-container px-3 py-2 text-sm">
                          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success" />{h.name}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{h.value}</span>
                        </div>
                      ))
                    )}
                    <button className="mt-2 w-full rounded-md border border-border bg-surface-container py-2 text-xs font-semibold uppercase tracking-wider hover:bg-accent">
                      Refresh
                    </button>
                  </div>
                </Panel>

                <Panel title="Environment">
                  <div className="space-y-3 text-xs">
                    <EnvField label="Network" value="Sui Testnet v1.2.0" />
                    <EnvField label="Walrus Aggregator" value="https://aggregator.walrus-testnet.walrus.space" />
                    <EnvField label="API Base" value="/api/v1" />
                  </div>
                </Panel>

                <div className="grid grid-cols-2 gap-3">
                  <Link to="/" className="flex flex-col items-center gap-1 rounded-lg bg-primary py-4 text-primary-foreground hover:opacity-90">
                    <Plus className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">New Node</span>
                  </Link>
                  <button className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface-container py-4 hover:bg-accent">
                    <RefreshCw className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Reboot</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-4 border-b border-border px-4 py-2 text-xs">
                <span className="font-semibold text-primary">TERMINAL</span>
                <span className="text-muted-foreground">DEBUG</span>
              </div>
              <pre className="scrollbar-thin overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed">
                {history.map((h, i) => (
                  <span key={i} className={h.success ? "text-success" : "text-danger"}>
                    [{new Date().toTimeString().slice(0, 8)}] {h.label}: {h.success ? "success" : "failed"}{"\n"}
                  </span>
                ))}
                {history.length === 0 && <span className="text-muted-foreground">No execution data available.</span>}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}

function SideLink({ children, icon: Icon, active }: { children: React.ReactNode; icon: typeof Cpu; active?: boolean }) {
  return (
    <button className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function Stat({ title, value, sub, accent }: { title: string; value: string; sub: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-xl border-l-2 border-border bg-card p-5 shadow-sm" style={{ borderLeftColor: accent }}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-2 font-display text-3xl font-semibold" style={{ color: accent }}>
        {value}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Panel({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Success</span>
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Failed</span>
    </div>
  );
}

function ExecutionsChart({ history }: { history: Array<{ label: string; success: number; failed: number }> }) {
  const total = history.reduce((s, h) => s + h.success + h.failed, 0);
  const successPct = total > 0 ? (history.reduce((s, h) => s + h.success, 0) / total) * 100 : 50;
  const failPct = total > 0 ? (history.reduce((s, h) => s + h.failed, 0) / total) * 100 : 0;
  return (
    <svg viewBox="0 0 600 200" className="h-56 w-full">
      {history.length > 0 ? (
        <>
          <path d={`M0,${200 - successPct * 1.5} C100,${180 - successPct * 1.2} 200,${160 - successPct} 400,${140 - successPct * 0.8} C500,${130 - successPct * 0.5} 550,${150 - successPct * 0.6} 600,${160 - successPct * 0.7}`} fill="none" stroke="var(--primary)" strokeWidth={2.5} />
          <path d={`M0,${180 - failPct} C100,${160 - failPct} 200,${170 - failPct} 400,${160 - failPct} C500,${155 - failPct} 550,${165 - failPct} 600,${170 - failPct}`} fill="none" stroke="var(--danger)" strokeWidth={2} strokeDasharray="6 4" opacity={0.6} />
        </>
      ) : (
        <>
          <path d="M0,140 C80,110 120,170 200,150 S320,80 400,60 S560,150 600,130" fill="none" stroke="var(--primary)" strokeWidth={2.5} />
          <path d="M0,160 C80,150 120,180 200,170 S320,140 400,150 S560,180 600,170" fill="none" stroke="var(--danger)" strokeWidth={2} strokeDasharray="6 4" opacity={0.6} />
        </>
      )}
    </svg>
  );
}

function EnvField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 truncate rounded-md border border-border bg-surface-container px-3 py-2 font-mono text-[11px]">{value}</div>
    </div>
  );
}
