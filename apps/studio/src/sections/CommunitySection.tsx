export default function CommunitySection() {
  return (
    <section className="border-b border-border bg-surface-low">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            Sui Overflow 2026
          </span>
          <h2 className="mt-6 text-headline-lg">Built for Sui Overflow 2026.</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            M2A was forged in the Sui Overflow 2026 hackathon — a full-stack attempt at fixing the hardest problem in AI: stateless agents.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="https://github.com/anomalyco/m2a"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-slate-300 transition-all hover:border-primary/60 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </a>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-slate-400">
            <span className="text-success">●</span>
            Open Source — GPL v3
          </div>
        </div>

        <div className="mt-12 mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <blockquote className="text-sm text-slate-400 italic leading-relaxed">
            "We built M2A because every AI agent framework ships with state management as an afterthought. Agents talk, think, and decide — but then forget everything. Walrus gives us permanence. Sui gives us proof. Together, they give agents a memory that actually survives."
          </blockquote>
          <p className="mt-4 text-label-bold text-primary">— M2A Core Team</p>
        </div>
      </div>
    </section>
  );
}
