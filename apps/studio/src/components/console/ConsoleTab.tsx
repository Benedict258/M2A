import { useState } from "react";
import { Plus, Edit3, Check } from "lucide-react";
import { useWorkflow } from "@/lib/workflow-context";
import { PanelGrid } from "./PanelGrid";
import { PanelConfigModal } from "./PanelConfigModal";

interface PanelConfig {
  id: string; type: "markdown" | "table" | "chart" | "number" | "node" | "keynodes";
  title: string; dataSource: { type: "memory" | "executions" | "runs"; workflowId?: string; namespace?: string };
  config: Record<string, any>;
}

export function ConsoleTab() {
  const { nodes } = useWorkflow();
  const [editing, setEditing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [panels, setPanels] = useState<PanelConfig[]>([
    { id: "p1", type: "number", title: "Total Executions", dataSource: { type: "executions" }, config: {} },
    { id: "p2", type: "number", title: "Active Nodes", dataSource: { type: "runs" }, config: {} },
    { id: "p3", type: "keynodes", title: "Agent Status", dataSource: { type: "runs" }, config: {} },
    { id: "p4", type: "table", title: "Recent Runs", dataSource: { type: "executions" }, config: {} },
  ]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h2 className="text-sm font-semibold">Console</h2>
        <div className="flex items-center gap-2">
          {editing && (
            <button onClick={() => setShowConfig(true)} className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20">
              <Plus className="h-3 w-3" /> Add Panel
            </button>
          )}
          <button onClick={() => setEditing(e => !e)} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition ${editing ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {editing ? <Check className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <PanelGrid panels={panels} editing={editing} onRemove={(id: string) => setPanels(p => p.filter(px => px.id !== id))} />
      </div>
      {showConfig && (
        <PanelConfigModal
          onSave={(c: PanelConfig) => { setPanels(p => [...p, { ...c, id: `p_${Date.now()}` }]); setShowConfig(false); }}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}
