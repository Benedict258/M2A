import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout, Monitor, Database, GitBranch } from "lucide-react";
import { EditorHeader } from "@/components/editor/Header";
import { EditorSidebar } from "@/components/editor/Sidebar";
import { EditorCanvas } from "@/components/editor/Canvas";
import { SidePanel } from "@/components/editor/SidePanel";
import { BottomPanel } from "@/components/editor/BottomPanel";
import { ActionPalette } from "@/components/editor/ActionPalette";
import { TemplateMarketplace, CreateAgentDialog, TopUpDialog, WalletDialog } from "@/components/editor/Modals";
import { ConsoleTab } from "@/components/console/ConsoleTab";
import { MemoryTabView } from "@/components/memory/MemoryTabView";
import { VersionsTabView } from "@/components/editor/VersionsTabView";
import { useWorkflow } from "@/lib/workflow-context";

type EditorTab = "canvas" | "console" | "memory" | "versions";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Workflow Editor — Buiry M2A Studio" },
      { name: "description", content: "Build AI agent and DeFi automation workflows visually on Sui." },
    ],
  }),
  component: WorkflowEditor,
});

function WorkflowEditor() {
  const [activeTab, setActiveTab] = useState<EditorTab>("canvas");
  const { selectedId, dispatch } = useWorkflow();
  const [palette, setPalette] = useState(false);
  const [templates, setTemplates] = useState(false);
  const [createAgent, setCreateAgent] = useState(false);
  const [topUp, setTopUp] = useState(false);
  const [wallet, setWallet] = useState(false);

  const tabs: { key: EditorTab; label: string; icon: any }[] = [
    { key: "canvas", label: "Canvas", icon: Layout },
    { key: "console", label: "Console", icon: Monitor },
    { key: "memory", label: "Memory", icon: Database },
    { key: "versions", label: "Versions", icon: GitBranch },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <EditorHeader
        onCreateAgent={() => setCreateAgent(true)}
        onTopUp={() => setTopUp(true)}
        onTemplates={() => setTemplates(true)}
        onConnectWallet={() => setWallet(true)}
      />
      <div className="flex border-b border-border bg-surface-container/50 px-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition border-b-2 -mb-px ${
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {activeTab === "canvas" && (
          <>
            <EditorSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <EditorCanvas onOpenPalette={() => setPalette(true)} />
              <BottomPanel />
            </div>
            {selectedId && <SidePanel onClose={() => dispatch({ type: "select", id: null })} />}
          </>
        )}
        {activeTab === "console" && <ConsoleTab />}
        {activeTab === "memory" && <MemoryTabView />}
        {activeTab === "versions" && <VersionsTabView />}
      </div>

      <ActionPalette open={palette} onClose={() => setPalette(false)} />
      <TemplateMarketplace open={templates} onClose={() => setTemplates(false)} />
      <CreateAgentDialog open={createAgent} onClose={() => setCreateAgent(false)} />
      <TopUpDialog open={topUp} onClose={() => setTopUp(false)} />
      <WalletDialog open={wallet} onClose={() => setWallet(false)} />
    </div>
  );
}
