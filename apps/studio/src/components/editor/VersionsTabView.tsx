import { useState, useEffect } from "react";
import { Send, History, ExternalLink, Clock, CheckCircle } from "lucide-react";
import { useWorkflow } from "@/lib/workflow-context";
import { notify } from "@/lib/toast";

interface VersionEntry { versionId: string; version: number; publishedAt: string; }

export function VersionsTabView() {
  const { workflowId, workflowName, nodes, connections } = useWorkflow();
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved] = useState<Date>(new Date());
  const hasChanges = nodes.length > 0 || connections.length > 0;

  const handlePublish = async () => {
    if (!workflowId) { notify.error('Save the workflow first before publishing'); return; }
    setPublishing(true);
    try {
      const res = await fetch(`/api/v1/workflows/${workflowId}/publish`, { method: 'POST' });
      const result = await res.json();
      if (result.published) {
        setVersions(v => [...v, { versionId: result.versionId, version: result.version, publishedAt: new Date().toISOString() }]);
        notify.success(`Published version ${result.version}`);
      }
    } catch (e: any) { notify.error('Publish failed: ' + e.message); }
    finally { setPublishing(false); }
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-surface-container p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{workflowName || 'New Workflow'}</h3>
              <p className="text-[11px] text-muted-foreground">{hasChanges ? 'Draft — unsaved changes' : 'No changes'} · {nodes.length} nodes · {connections.length} connections</p>
            </div>
            <button onClick={handlePublish} disabled={publishing || !workflowId} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              <Send className="h-3.5 w-3.5" />{publishing ? 'Publishing...' : 'Publish Version'}
            </button>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3"><History className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-semibold">Version History</h3></div>
          {versions.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface-container p-8 text-center"><Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground opacity-40" /><p className="text-sm text-muted-foreground">No versions published yet</p><p className="text-[11px] text-muted-foreground mt-1">Publish this workflow to create version 1</p></div>
          ) : (
            <div className="space-y-2">{versions.map((v, i) => (
              <div key={v.versionId} className={`flex items-center justify-between rounded-lg border bg-surface-container p-4 ${i === 0 ? 'border-primary/30' : 'border-border'}`}>
                <div className="flex items-center gap-3">{i === 0 && <CheckCircle className="h-4 w-4 text-success" />}<div><span className="text-sm font-semibold">v{v.version}</span>{i === 0 && <span className="ml-2 text-[10px] text-success font-medium">Current</span>}<p className="text-[10px] text-muted-foreground">{new Date(v.publishedAt).toLocaleString()}</p></div></div>
                <div className="flex items-center gap-2"><a href="#" className="text-[10px] text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-2.5 w-2.5" /> Walrus</a><a href="#" className="text-[10px] text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-2.5 w-2.5" /> Sui</a></div>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}
