export default function TechStackSection() {
  const STACK = [
    { label: 'Sui', desc: 'Coordination Layer', logo: 'Sui' },
    { label: 'Walrus', desc: 'Verifiable Data', logo: 'Walrus' },
    { label: 'SEAL', desc: 'Data Security', logo: 'SEAL' },
    { label: 'MemWal', desc: 'Verifiable Compute', logo: 'MemWal' },
    { label: 'DeepBook', desc: 'Liquidity Management', logo: 'DeepBook' },
  ];

  return (
    <section id="architecture" className="bg-surface-low">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-36">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-black dark:text-white leading-tight">
            Built on the <span className="text-primary">Sui stack</span>.
          </h2>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="space-y-4">
            {STACK.map((item, i) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl p-6 transition-colors"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, #111318 45%, rgba(99,102,241,0.08) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                }}
              >
                <span className="text-lg font-bold text-white tracking-wide">
                  {item.label}
                </span>
                <span className="text-sm text-slate-500">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
