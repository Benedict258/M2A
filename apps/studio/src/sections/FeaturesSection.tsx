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

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-surface-low overflow-hidden">
      <div className="py-24 md:py-36">
        <div className="text-center mb-16 px-6">
          <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-black dark:text-white leading-tight">
            <span className="text-primary">48</span> node types. One canvas.<br />
            Build any automation.
          </h2>
        </div>

        <div className="flex gap-5 overflow-x-auto px-6 pb-4 snap-x snap-mandatory scrollbar-none -mx-6 px-6">
          {NODE_CATEGORIES.map((cat) => (
            <div
              key={cat.label}
              className="snap-start shrink-0 w-[300px] md:w-[340px] rounded-3xl p-8 flex flex-col justify-between min-h-[340px]"
              style={{
                background: 'linear-gradient(135deg, #111318 0%, #1a1d25 50%, #111318 100%)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
              }}
            >
              <div>
                <h3 className="font-display text-3xl font-bold text-white mb-6">
                  {cat.label}
                </h3>
                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <p key={item} className="text-sm text-slate-400">{item}</p>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {cat.count} nodes
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
