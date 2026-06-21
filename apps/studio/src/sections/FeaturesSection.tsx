const NODE_CATEGORIES = [
  { label: 'DeFi', count: 12, items: ['Cetus', 'DeepBook', 'Aftermath', 'Navi', 'Suilend', 'Haedal', 'Volo', 'Bucket', 'Bluefin', 'AlphaFi', 'Price Alert'] },
  { label: 'Web2', count: 7, items: ['Email', 'Slack', 'Discord', 'Telegram', 'Twitter', 'Google Sheets', 'Airtable', 'Notion'] },
  { label: 'Triggers', count: 6, items: ['Input', 'Webhook', 'Schedule', 'On-Chain Event', 'Form', 'Discord Bot'] },
  { label: 'Blockchain', count: 5, items: ['Sui RPC', 'Walrus', 'SuiNS', 'Balance Monitor', 'File I/O'] },
  { label: 'AI Agents', count: 4, items: ['M2A Agent', 'Spawn Agent', 'Code Node', 'Loop'] },
  { label: 'Logic/Data', count: 7, items: ['HTTP Request', 'JSON Parser', 'CSV Parser', 'RSS Reader', 'Conditional', 'Merge', 'Wait', 'Counter'] },
  { label: 'Oracles', count: 2, items: ['Pyth', 'Switchboard'] },
  { label: 'Bridge', count: 2, items: ['Wormhole', 'Sui Bridge'] },
  { label: 'NFT', count: 3, items: ['NFT Mint', 'TradePort', 'Floor Alert'] },
  { label: 'Storage', count: 1, items: ['IPFS Upload'] },
];

const WORKFLOW = [
  { label: 'Trigger', node: 'Schedule', desc: 'Runs every hour, on-chain' },
  { label: 'Oracle', node: 'Pyth Feed', desc: 'Fetches SUI/USD price' },
  { label: 'Decision', node: 'Conditional', desc: 'If SUI &gt; $5, proceed' },
  { label: 'DEX', node: 'Aftermath Swap', desc: 'SUI → USDC at best rate' },
  { label: 'Lending', node: 'Navi Supply', desc: 'Deposit USDC for yield' },
  { label: 'Storage', node: 'Walrus Blob', desc: 'Log tx, generate dataset' },
  { label: 'Output', node: 'Telegram', desc: 'Send confirmation alert' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-headline-lg">
            <span className="text-primary">48</span> node types. One canvas. Build any automation.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Drag, connect, configure. No orchestration code. Just nodes and edges.
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
          <p className="text-label-bold text-slate-600 text-center mb-6">Reference workflow: DeFi Yield Automation on Sui</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {WORKFLOW.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border border-border bg-card px-4 py-3 text-center min-w-[110px]">
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
