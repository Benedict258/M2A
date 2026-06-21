import { useState, useEffect, useCallback } from "react";
import { FolderTree, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { MemoryTable } from "./MemoryTable";

export function MemoryTabView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNs, setSelectedNs] = useState("");
  const [customNs, setCustomNs] = useState("");

  const namespaces = ["pool::code-review", "pool::research", "pool::trading", "pool::general"];

  const search = useCallback(async (poolName: string) => {
    if (!poolName) return;
    setLoading(true);
    try {
      const res = await api.searchMemory(poolName);
      setEntries([{ id: Date.now().toString(), namespace: poolName, content: res.context || JSON.stringify(res), agent: "system", timestamp: new Date().toISOString() }]);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (selectedNs) search(selectedNs); }, [selectedNs, search]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-56 shrink-0 border-r border-border bg-sidebar p-3">
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Namespaces</h3>
        <div className="space-y-0.5">
          {namespaces.map(ns => (
            <button key={ns} onClick={() => setSelectedNs(ns)} className={`w-full rounded px-2 py-1.5 text-left text-[11px] transition ${selectedNs === ns ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface-container'}`}>{ns}</button>
          ))}
        </div>
        <div className="mt-3">
          <input value={customNs} onChange={e => setCustomNs(e.target.value)} placeholder="Custom namespace..." className="h-7 w-full rounded border border-border bg-surface-container px-2 text-[10px] outline-none" onKeyDown={e => { if (e.key === 'Enter' && customNs) { setSelectedNs(customNs); setCustomNs(''); } }} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">{selectedNs ? `Memory: ${selectedNs}` : 'Memory Explorer'}</h2>
          <button onClick={() => search(selectedNs)} className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-[10px] text-primary"><RefreshCw className="h-3 w-3" /> Refresh</button>
        </div>
        {selectedNs ? <MemoryTable entries={entries} loading={loading} /> : (
          <div className="py-16 text-center text-sm text-muted-foreground"><FolderTree className="mx-auto mb-2 h-8 w-8 opacity-30" />Select a namespace from the sidebar to explore memory</div>
        )}
      </div>
    </div>
  );
}
