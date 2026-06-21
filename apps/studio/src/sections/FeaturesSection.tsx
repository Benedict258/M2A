const NODE_CATEGORIES = [
  {
    label: 'Input',
    count: 4,
    items: ['Manual Input', 'API Polling', 'Webhook', 'File Watcher'],
  },
  {
    label: 'LLM',
    count: 6,
    items: ['Chat Completion', 'Prompt Template', 'Chain', 'Router', 'Tool Call', 'Structured Output'],
  },
  {
    label: 'Transform',
    count: 8,
    items: ['JSON Parser', 'Text Splitter', 'Merge', 'Filter', 'Map', 'Sort', 'Dedupe', 'Template'],
  },
  {
    label: 'Decision',
    count: 4,
    items: ['Conditional', 'Switch', 'Loop', 'Parallel Fork'],
  },
  {
    label: 'Memory',
    count: 5,
    items: ['Remember', 'Recall', 'Search', 'Delete', 'Summarize'],
  },
  {
    label: 'Integration',
    count: 10,
    items: ['Sui RPC', 'Walrus Blob', 'SEAL Encrypt', 'HTTP Client', 'Wallet Sign', 'Move Call', 'NFT Mint', 'Coin Transfer', 'Event Subscribe', 'GraphQL'],
  },
  {
    label: 'Tool',
    count: 6,
    items: ['Web Search', 'Code Execute', 'File Read', 'File Write', 'Email', 'Notification'],
  },
  {
    label: 'Output',
    count: 5,
    items: ['Response', 'Webhook', 'File Export', 'Database Write', 'Stream'],
  },
];

const WORKFLOW = [
  { label: 'Input', node: 'Query', desc: 'User question enters the pipeline' },
  { label: 'Planner', node: 'Query Planner', desc: 'Decomposes into sub-queries' },
  { label: 'Research A', node: 'Researcher A', desc: 'Web search + LLM synthesis' },
  { label: 'Research B', node: 'Researcher B', desc: 'Web search + LLM synthesis (parallel)', parallel: true },
  { label: 'Analysis', node: 'Analyst', desc: 'Merges results, scores confidence' },
  { label: 'Report', node: 'Report Writer', desc: 'Produces final structured output' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-headline-lg">
            <span className="text-primary">48</span> node types. One canvas.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Drag, connect, configure. Build agent workflows without writing orchestration code.
          </p>
        </div>

        <div className="mt-12 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {NODE_CATEGORIES.map((cat) => (
            <div key={cat.label} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-label-bold text-primary">{cat.label}</span>
                <span className="text-mono text-slate-600">{cat.count}</span>
              </div>
              <div className="mt-3 space-y-1">
                {cat.items.map((item) => (
                  <p key={item} className="text-xs text-slate-500 truncate">{item}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <p className="text-label-bold text-slate-600 text-center mb-6">Reference workflow: Deep Research</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {WORKFLOW.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className={'rounded-lg border px-4 py-3 text-center min-w-[110px] ' + (step.parallel ? 'border-warning/50 bg-warning/5' : 'border-border bg-card')}>
                    <p className="text-label-bold text-slate-500">{step.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-300">{step.node}</p>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-600">{step.desc}</p>
                </div>
                {i < WORKFLOW.length - 1 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" className="text-slate-600 shrink-0">
                    <path d="M5 12h14m-5-5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
