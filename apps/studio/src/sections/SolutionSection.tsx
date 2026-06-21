export default function SolutionSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-headline-lg">An automation engine that gets smarter every time you use it.</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Three primitives. Workflow engine to build. Dataset generation to compound. Memory to make it smart.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-7 group hover:border-primary/40 transition-all hover:-translate-y-0.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <h3 className="mt-5 text-headline-md">Workflow Engine</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Visual canvas, 48 node types. Drag-connect-execute. Like n8n but on-chain.
            </p>
            <div className="mt-6 rounded-lg border border-border bg-surface px-3 py-2.5">
              <pre className="text-mono text-slate-500 text-[11px] leading-relaxed overflow-x-auto">
                <span className="text-primary">const</span> buiry = <span className="text-primary">new</span> Buiry({'{'}{'\n'}
                {"  "}namespace: <span className="text-success">"research"</span>,{'\n'}
                {"  "}signer: keypair.getKeypair(){'\n'}
                {'}'});
              </pre>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-7 group hover:border-primary/40 transition-all hover:-translate-y-0.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <h3 className="mt-5 text-headline-md">Dataset Generation</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Every automation run produces a verifiable, privacy-safe dataset — automatically. This is what n8n doesn't do.
            </p>
            <div className="mt-6 rounded-lg border border-border bg-surface px-3 py-2.5">
              <pre className="text-mono text-slate-500 text-[11px] leading-relaxed overflow-x-auto">
                <span className="text-primary">const</span> dataset = buiry.dataset({'\n'}
                {"  "}privacy: <span className="text-success">"redact"</span>,{'\n'}
                {"  "}compress: <span className="text-primary">true</span>{'\n'}
                );
              </pre>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-7 group hover:border-primary/40 transition-all hover:-translate-y-0.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <path d="M21 3v5h-5" />
                <path d="M12 8v4l3 3" />
              </svg>
            </span>
            <h3 className="mt-5 text-headline-md">Persistent Memory</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              The mechanism that makes automations smarter across runs and datasets more valuable.
            </p>
            <div className="mt-6 rounded-lg border border-border bg-surface px-3 py-2.5">
              <pre className="text-mono text-slate-500 text-[11px] leading-relaxed overflow-x-auto">
                <span className="text-primary">const</span> memory = buiry.memory(<span className="text-warning">"agent-7"</span>);{'\n'}
                <span className="text-primary">await</span> memory.remember({'\n'}
                {"  "}key: <span className="text-success">"research/topic"</span>,{'\n'}
                {"  "}value: summary,{'\n'}
                {"  "}proof: txDigest{'\n'}
                );
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
