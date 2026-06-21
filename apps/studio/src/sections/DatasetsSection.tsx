export default function DatasetsSection() {
  return (
    <section id="datasets" className="border-b border-border">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-headline-lg">Every automation you run produces a verifiable dataset.</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Privacy-preserving pipeline: capture, redact, verify, and publish to Walrus, automatically, on every run.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-500 via-slate-500 to-transparent" />
            <p className="text-label-bold text-slate-400">Before: Raw Output</p>
            <div className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 space-y-2">
              <p className="text-mono text-[11px] text-slate-400 leading-relaxed">
                {'{'}
                <br />
                <span className="text-slate-500">&nbsp;&nbsp;"user": "alice@example.com",</span>
                <br />
                <span className="text-slate-500">&nbsp;&nbsp;"ssn": "123-45-6789",</span>
                <br />
                <span className="text-slate-500">&nbsp;&nbsp;"wallet": "0xabc...def",</span>
                <br />
                &nbsp;&nbsp;"query": "best yield strategies",<br />
                &nbsp;&nbsp;"response": "Based on analysis..."<br />
                {'}'}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400">PII Detected</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400">3 fields</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary to-transparent" />
            <p className="text-label-bold text-primary">After: Clean Dataset</p>
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 space-y-2">
              <p className="text-mono text-[11px] text-slate-400 leading-relaxed">
                {'{'}
                <br />
                &nbsp;&nbsp;"user": <span className="text-primary">"[REDACTED]"</span>,<br />
                &nbsp;&nbsp;"query": "best yield strategies",<br />
                &nbsp;&nbsp;"response": "Based on analysis...",<br />
                &nbsp;&nbsp;"aggregate": {'{'}<br />
                &nbsp;&nbsp;&nbsp;&nbsp;"topic": "DeFi yield",<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">"privacy_score": 100</span><br />
                &nbsp;&nbsp;{'}'}<br />
                {'}'}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Privacy Score: 100</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Walrus Blob</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-6 rounded-lg border border-border bg-card px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-slate-400">Privacy Engine Active</span>
            </div>
            <span className="text-sm text-slate-600">|</span>
            <span className="text-label-bold text-primary">100% PII Detection Rate</span>
          </div>
        </div>
      </div>
    </section>
  );
}
