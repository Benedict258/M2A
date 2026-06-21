import { Link } from "@tanstack/react-router";
import { ChevronDown, MoreHorizontal, Play, Loader2, Plus, Wallet, Sun, Moon, LayoutDashboard, LogOut, Save, Rocket, Power } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { useWorkflow } from "@/lib/workflow-context";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { api } from "@/lib/api";
import { notify } from "@/lib/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  onCreateAgent: () => void;
  onTopUp: () => void;
  onTemplates: () => void;
  onConnectWallet: () => void;
};

export function EditorHeader({ onCreateAgent, onTopUp, onTemplates, onConnectWallet }: Props) {
  const { theme, toggle } = useTheme();
  const { workflowName, dispatch, running, runWorkflow, agents, selectedAgentId, saveWorkflow, deployed, workflowId, nodes } = useWorkflow();
  const walletAccount = useCurrentAccount();
  const dAppKit = useDAppKit();
  const agent = agents.find((a) => a.id === selectedAgentId);
  const [editing, setEditing] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);

  const isConnected = !!walletAccount;
  const address = walletAccount?.address ?? null;
  const addrLabel = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  const hasTriggers = nodes.some((n) =>
    ["webhook_trigger", "schedule_trigger", "event_trigger", "form_trigger", "discord_trigger"].includes(n.type)
  );

  const handleDeploy = async () => {
    if (!workflowId) {
      await saveWorkflow();
    }
    const id = workflowId;
    if (id) {
      await api.deployWorkflow(id);
      dispatch({ type: "set_deployed", deployed: true });
      notify.success('Workflow deployed');
    }
  };

  const handleUndeploy = async () => {
    if (workflowId) {
      await api.undeployWorkflow(workflowId);
      dispatch({ type: "set_deployed", deployed: false });
      notify.info('Workflow stopped');
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-primary">
          <span className="text-sm font-bold">M</span>
        </div>
        <span className="font-display text-base font-semibold tracking-tight">M2A Studio</span>
      </div>

      <span className="mx-2 h-5 w-px bg-border" />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Active:</span>
        {editing ? (
          <input
            autoFocus
            value={workflowName}
            onChange={(e) => dispatch({ type: "rename", name: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            className="rounded-sm border border-input bg-background px-2 py-0.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <button onClick={() => setEditing(true)} className="font-mono text-sm font-medium text-foreground hover:text-primary">
            {workflowName}
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={saveWorkflow}
          className="hidden items-center gap-1.5 rounded-md border border-border bg-surface-container px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground md:inline-flex"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>

        {hasTriggers && (
          deployed ? (
            <button
              onClick={handleUndeploy}
              className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition hover:bg-success/20"
            >
              <Power className="h-3.5 w-3.5" />
              Live
            </button>
          ) : (
            <button
              onClick={handleDeploy}
              className="hidden items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 md:inline-flex"
            >
              <Rocket className="h-3.5 w-3.5" />
              Deploy
            </button>
          )
        )}

        <Link
          to="/dashboard"
          className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:bg-accent hover:text-foreground md:inline-flex"
        >
          <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
        </Link>

        {agent && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-surface-container px-3 py-1.5 text-xs font-medium hover:bg-accent">
              <span className={`h-1.5 w-1.5 rounded-full ${agent.status === "active" ? "bg-success" : "bg-danger"}`} />
              {agent.name}
              <span className="text-muted-foreground">
                {agent.budgetUsed}/{agent.budgetCap} SUI
              </span>
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {agents.map((a) => (
                <DropdownMenuItem key={a.id}>
                  <span className={`mr-2 h-1.5 w-1.5 rounded-full ${a.status === "active" ? "bg-success" : "bg-danger"}`} />
                  {a.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onTopUp}>Top up agent</DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateAgent}>+ Create new agent</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <button
          onClick={onCreateAgent}
          className="hidden items-center gap-1.5 rounded-md border border-border bg-surface-container px-3 py-1.5 text-sm font-medium hover:bg-accent md:inline-flex"
        >
          <Plus className="h-4 w-4" /> Create Agent
        </button>

        <button
          onClick={runWorkflow}
          disabled={running}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
          {running ? "Running…" : "Run"}
        </button>

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface-container hover:bg-accent"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface-container hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onTemplates}>Templates…</DropdownMenuItem>
            <DropdownMenuItem>Export MCP</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard">Admin Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateAgent}>Create Agent</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isConnected ? (
          <div className="relative">
            <button
              onClick={() => setWalletMenuOpen(!walletMenuOpen)}
              className="inline-flex items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-medium text-success"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <Wallet className="h-3.5 w-3.5" />
              {addrLabel}
              <ChevronDown className="h-3 w-3" />
            </button>
            {walletMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setWalletMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 origin-top-right rounded-xl border border-border bg-popover p-1.5 shadow-2xl">
                  <div className="px-3 py-2 text-[11px] text-muted-foreground">
                    Connected via Sui Wallet
                  </div>
                  <div className="break-all px-3 py-1 font-mono text-[11px] text-foreground">{address}</div>
                  <div className="my-1 h-px bg-border" />
                  <button
                    onClick={() => { dAppKit.disconnectWallet(); setWalletMenuOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[11px] text-danger hover:bg-accent"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onConnectWallet}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-container px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <Wallet className="h-3.5 w-3.5" />
            Connect
          </button>
        )}
      </div>
    </header>
  );
}