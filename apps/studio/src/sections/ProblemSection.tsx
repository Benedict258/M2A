export default function ProblemSection() {
  return (
    <section className="border-b border-border bg-surface-low">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-headline-lg">AI agents are <span className="text-primary">stateless by default.</span></h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Every new session starts from zero. Context, preferences, decisions — all lost. Until now.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-danger via-danger to-transparent" />
            <p className="text-label-bold text-danger">Without M2A</p>
            <h3 className="mt-6 text-headline-md text-slate-300">Session resets. Context lost.</h3>
            <div className="mt-6 space-y-4">
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger text-xs">1</span>
                <p className="text-sm text-slate-400">Agent starts with empty context window</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger text-xs">2</span>
                <p className="text-sm text-slate-400">Repeats reasoning work from scratch</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger text-xs">3</span>
                <p className="text-sm text-slate-400">No traceability for decisions or sources</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger text-xs">4</span>
                <p className="text-sm text-slate-400">Token waste re-processing identical queries</p>
              </div>
            </div>
            <div className="mt-8 rounded-lg border border-border bg-surface px-4 py-3">
              <p className="text-mono text-slate-500">
                <span className="text-danger">{'>'} Session ended.</span> All context<br />
                <span className="text-danger">{'>'} discarded.</span> 42,847 tokens burned.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-success via-success to-transparent" />
            <p className="text-label-bold text-success">With M2A</p>
            <h3 className="mt-6 text-headline-md text-slate-300">Memory persists. Verifiably.</h3>
            <div className="mt-6 space-y-4">
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success text-xs">1</span>
                <p className="text-sm text-slate-400">Memory loaded from Walrus on agent start</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success text-xs">2</span>
                <p className="text-sm text-slate-400">Resume exactly where you left off</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success text-xs">3</span>
                <p className="text-sm text-slate-400">Every write is a Sui transaction — immutable proof</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success text-xs">4</span>
                <p className="text-sm text-slate-400">Token savings compound across sessions</p>
              </div>
            </div>
            <div className="mt-8 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
              <p className="text-mono text-slate-400">
                <span className="text-success">{'>'} Session resumed.</span> Memory<br />
                <span className="text-success">{'>'} loaded.</span> 1,247 tokens used.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
