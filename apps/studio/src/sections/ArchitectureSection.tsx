const STATS = [
  { value: '48', label: 'Node Types', desc: 'Orchestrate any workflow' },
  { value: '6', label: 'Move Modules', desc: 'On-chain memory contracts' },
  { value: '14', label: 'Protocol Integrations', desc: 'Sui ecosystem primitives' },
  { value: '4', label: 'LLM Providers', desc: 'Groq, Llama, OpenAI, Anthropic' },
];

const TECH = [
  { category: 'Core', items: ['Sui Network'] },
  { category: 'Storage', items: ['Walrus', 'MemWal', 'SEAL'] },
  { category: 'AI', items: ['Groq', 'Llama 3'] },
  { category: 'Frontend', items: ['React 19', 'Vite 8', 'Tailwind CSS 4'] },
  { category: 'Runtime', items: ['Express', 'TypeScript'] },
  { category: 'Packages', items: ['buiry', '@m2a/sdk', '@m2a/client'] },
];

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

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TECH.map((row) => (
            <div key={row.category} className="rounded-lg border border-border bg-card p-5">
              <p className="text-label-bold text-slate-500">{row.category}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {row.items.map((item) => (
                  <span key={item} className="inline-flex items-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-slate-400">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
