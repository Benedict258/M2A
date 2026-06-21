export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="mx-auto max-w-[1400px] px-6 pt-32 pb-20 md:pt-40 md:pb-28 text-center relative z-10">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
          Sui Overflow 2026
        </span>

        <h1 className="mt-6 text-display-lg md:text-[64px] md:leading-[68px] tracking-tight">
          Your agents forget everything<br />
          between sessions. <span className="text-primary">M2A remembers.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
          Persistent, verifiable memory for AI agents — powered by Walrus, anchored on Sui.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href="http://152.67.149.134:5177"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-white transition-all hover:brightness-110 active:opacity-80"
          >
            Start Building
          </a>
          <a
            href="#how-it-works"
            className="inline-flex h-11 items-center rounded-md border border-border bg-transparent px-6 text-sm font-semibold text-slate-300 transition-all hover:border-primary/60 hover:text-white"
          >
            See how it works
          </a>
        </div>

        <p className="mt-8 text-mono text-slate-500">
          npm install buiry
        </p>

        <div className="mt-16 mx-auto max-w-2xl">
          <svg viewBox="0 0 600 200" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <line x1="30" y1="100" x2="100" y2="100" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

            <circle cx="100" cy="100" r="16" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" filter="url(#glow)" />
            <text x="100" y="104" textAnchor="middle" fill="#8b5cf6" fontSize="10" fontFamily="JetBrains Mono">A</text>
            <text x="100" y="130" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">agent node</text>

            <line x1="116" y1="100" x2="210" y2="100" stroke="#334155" strokeWidth="2" />
            <text x="163" y="92" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="JetBrains Mono">write</text>

            <rect x="210" y="84" width="50" height="32" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="1.5" filter="url(#glow)" />
            <text x="235" y="104" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="JetBrains Mono">M</text>
            <text x="235" y="130" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">memory</text>

            <line x1="260" y1="100" x2="340" y2="100" stroke="#334155" strokeWidth="2" strokeDasharray="6 3" />
            <text x="300" y="88" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="JetBrains Mono">session fades</text>

            <circle cx="380" cy="100" r="16" fill="#0f172a" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />
            <text x="380" y="104" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="JetBrains Mono">···</text>

            <line x1="396" y1="100" x2="480" y2="100" stroke="#334155" strokeWidth="2" />

            <circle cx="510" cy="100" r="16" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" filter="url(#glow)" />
            <text x="510" y="104" textAnchor="middle" fill="#8b5cf6" fontSize="10" fontFamily="JetBrains Mono">A</text>
            <text x="510" y="130" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">recall</text>

            <line x1="510" y1="116" x2="510" y2="155" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="480" y="155" width="60" height="20" rx="3" fill="#0f172a" stroke="#8b5cf6" strokeWidth="1" />
            <text x="510" y="169" textAnchor="middle" fill="#8b5cf6" fontSize="7" fontFamily="JetBrains Mono">Sui tx</text>
          </svg>
          <p className="mt-4 text-label-bold text-slate-600">Every write is a Sui transaction.</p>
        </div>
      </div>
    </section>
  );
}
