const STATS = [
  { value: '48', label: 'Node Types', desc: 'Orchestrate any workflow' },
  { value: '14', label: 'Protocol Integrations', desc: 'Sui ecosystem primitives' },
  { value: '6', label: 'Move Modules', desc: 'On-chain memory contracts' },
  { value: '4', label: 'LLM Providers', desc: 'Groq, Llama, OpenAI, Anthropic' },
];

const TECH = ['Sui', 'Walrus', 'MemWal', 'SEAL', 'PTBs'];

export default function ArchitectureSection() {
  return (
    <section id="architecture" className="border-b border-border bg-surface-low">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-headline-lg">Blockchain isn't a feature checkbox.</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Every write is a Sui transaction. Every memory is a Walrus blob. This is real infrastructure, not a wrapper.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 divide-x divide-border md:grid-cols-4 border border-border rounded-lg overflow-hidden bg-card">
          {STATS.map((s) => (
            <div key={s.label} className="text-center px-4 py-8">
              <div className="text-display-md text-primary">{s.value}</div>
              <div className="mt-2 text-label-bold text-slate-400">{s.label}</div>
              <div className="mt-1 text-xs text-slate-600">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {TECH.map((item) => (
            <span key={item} className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-primary">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
