import { useState } from 'react';

const TABS = [
  { id: 'setup', label: '1. Build', code: `// Drag 48 node types onto a visual canvas
// Connect nodes to define your automation
// Configure each node: inputs, transforms, LLM calls

No orchestration code required.
Just nodes and edges.` },
  { id: 'remember', label: '2. Run', code: `// Execute the workflow
// SSE streaming: watch every step in real-time
// Parallel agent dispatch across node branches
// Every node writes to shared memory via Walrus
// Memory persists across runs, agents, and sessions

Run complete. Output generated.
Automatically creating dataset...` },
  { id: 'recall', label: '3. Dataset', code: `// Every run produces a verifiable dataset
// PII auto-redacted. Privacy score calculated.
// Published to Walrus as a blob with Sui proof

Dataset verified. Privacy score: 100
Blob ID: walrus://3BxGhz...f8Kp
Sui tx: 0xabc123...def456` },
];

export default function HowItWorksSection() {
  const [active, setActive] = useState(TABS[0].id);

  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <section id="how-it-works" className="border-b border-border bg-surface-low">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-headline-lg">1. Build. 2. Run. 3. Dataset. <span className="text-primary">Persistent memory at every step.</span></h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Every node remembers its actions. Every run learns from the last. Three steps from canvas to verifiable data.
          </p>
        </div>

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
              <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
            </span>
            <span className="ml-2 text-mono text-slate-600">buiry.ts</span>
          </div>
          <div className="p-5 overflow-x-auto">
            <pre className="text-mono text-[13px] leading-relaxed text-slate-300">
              <code>{activeTab.code}</code>
            </pre>
          </div>
        </div>

        <div className="mt-10 text-center">
          <a
            href="http://152.67.149.134:5177"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-white transition-all hover:brightness-110 active:opacity-80"
          >
            Start Building
          </a>
        </div>
      </div>
    </section>
  );
}
