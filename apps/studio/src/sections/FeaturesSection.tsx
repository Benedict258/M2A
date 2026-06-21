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

const CARDS = [...NODE_CATEGORIES, ...NODE_CATEGORIES, ...NODE_CATEGORIES];

function CardItem({ label, items }: { label: string; items: string[] }) {
  return (
    <div
      className="shrink-0 w-[220px] h-[220px] rounded-3xl p-5 flex flex-col bg-card border border-border"
    >
      <h3 className="text-lg font-bold text-primary mb-3">{label}</h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 flex-1 overflow-hidden">
        {items.map((item) => (
          <p key={item} className="text-xs text-slate-400 dark:text-slate-400 text-black truncate">{item}</p>
        ))}
      </div>
      <span className="text-[10px] font-bold text-primary uppercase tracking-wider mt-auto">
        {label === 'DeFi' ? '12' : label === 'Web2' ? '7' : label === 'Triggers' ? '6' : label === 'Blockchain' ? '5' : label === 'AI Agents' ? '4' : label === 'Logic/Data' ? '7' : label === 'Oracles' ? '2' : label === 'Bridge' ? '2' : label === 'NFT' ? '3' : '1'} nodes
      </span>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-surface-low overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-36">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-black dark:text-white leading-tight">
            <span className="text-primary">48</span> node types. One canvas.<br />
            Build any automation.
          </h2>
        </div>

        <div className="relative">
          <div
            className="flex gap-5 animate-marquee"
            style={{ width: 'max-content' }}
          >
            {CARDS.map((cat, i) => (
              <CardItem key={`${cat.label}-${i}`} label={cat.label} items={cat.items} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
