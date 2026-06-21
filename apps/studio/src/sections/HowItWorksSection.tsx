import { useState } from 'react';

const TABS = [
  { id: 'setup', label: '1. Build', code: (
    <span>
      <span className="text-slate-500">// Drag</span> <span className="text-primary">48 node types</span> <span className="text-slate-500">onto a visual canvas</span>{'\n'}
      <span className="text-slate-500">// Connect nodes to define your</span> <span className="text-primary">automation</span>{'\n'}
      <span className="text-slate-500">// Configure each node: inputs, transforms, LLM calls</span>{'\n\n'}
      <span className="text-slate-400">No orchestration code required.</span>{'\n'}
      <span className="text-slate-400">Just nodes and edges.</span>
    </span>
  ) },
  { id: 'remember', label: '2. Run', code: (
    <span>
      <span className="text-slate-500">//</span> <span className="text-primary">Execute</span> <span className="text-slate-500">the workflow</span>{'\n'}
      <span className="text-slate-500">// SSE streaming: watch every step in real-time</span>{'\n'}
      <span className="text-slate-500">// Parallel agent dispatch across node branches</span>{'\n'}
      <span className="text-slate-500">// Every node writes to shared</span> <span className="text-primary">memory via Walrus</span>{'\n'}
      <span className="text-slate-500">// Memory</span> <span className="text-primary">persists</span> <span className="text-slate-500">across runs, agents, and sessions</span>{'\n\n'}
      <span className="text-primary">Run complete.</span> <span className="text-slate-400">Output generated.</span>{'\n'}
      <span className="text-slate-400">Automatically creating dataset...</span>
    </span>
  ) },
  { id: 'recall', label: '3. Dataset', code: (
    <span>
      <span className="text-slate-500">// Every run produces a</span> <span className="text-primary">verifiable dataset</span>{'\n'}
      <span className="text-slate-500">//</span> <span className="text-primary">PII</span> <span className="text-slate-500">auto-redacted.</span> <span className="text-primary">Privacy score</span> <span className="text-slate-500">calculated.</span>{'\n'}
      <span className="text-slate-500">// Published to</span> <span className="text-primary">Walrus</span> <span className="text-slate-500">as a blob with</span> <span className="text-primary">Sui proof</span>{'\n\n'}
      <span className="text-primary">Dataset verified.</span> <span className="text-slate-400">Privacy score: 100</span>{'\n'}
      <span className="text-slate-400">Blob ID: walrus://3BxGhz...f8Kp</span>{'\n'}
      <span className="text-primary">Sui tx:</span> <span className="text-slate-400">0xabc123...def456</span>
    </span>
  ) },
];

export default function HowItWorksSection() {
  const [active, setActive] = useState(TABS[0].id);

  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <section id="how-it-works" className="border-b border-border bg-surface-low">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="mt-10 flex justify-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={
                'px-4 py-2 text-sm font-semibold rounded-t-md transition-colors ' +
                (active === tab.id
                  ? 'bg-card border border-border border-b-0 text-primary'
                  : 'text-slate-500 hover:text-slate-300')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-lg rounded-tl-none border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface">
            <span className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500/60" />
            </span>
          </div>
          <div className="p-5 overflow-x-auto">
            <pre className="text-mono text-[13px] leading-relaxed">
              <code>{activeTab.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
