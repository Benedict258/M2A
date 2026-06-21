export default function ProblemSection() {
  return (
    <section className="border-b border-border bg-surface-low">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-headline-lg">Automation platforms today run workflows. <span className="text-primary">Then the value disappears.</span></h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            No verifiable record. No reusable data. Nothing compounds. Every run starts from zero.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-danger via-danger to-transparent" />
            <p className="text-label-bold text-danger">Without M2A</p>
            <h3 className="mt-6 text-headline-md text-slate-300">Workflow runs. Value disappears.</h3>
            <div className="mt-6 space-y-4">
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger text-xs">1</span>
                <p className="text-sm text-slate-400">Execution produces no permanent output</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger text-xs">2</span>
                <p className="text-sm text-slate-400">No way to inspect or verify results</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger text-xs">3</span>
                <p className="text-sm text-slate-400">Data evaporates — nothing compounds</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger text-xs">4</span>
                <p className="text-sm text-slate-400">Every run starts from zero</p>
              </div>
            </div>
            <div className="mt-8 rounded-lg border border-border bg-surface px-4 py-3">
              <p className="text-mono text-slate-500">
                <span className="text-danger">{'>'} Run complete.</span> All output<br />
                <span className="text-danger">{'>'} discarded.</span> No dataset saved.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-success via-success to-transparent" />
            <p className="text-label-bold text-success">With M2A</p>
            <h3 className="mt-6 text-headline-md text-slate-300">Every run. A dataset.</h3>
            <div className="mt-6 space-y-4">
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success text-xs">1</span>
                <p className="text-sm text-slate-400">Execution automatically generates a dataset</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success text-xs">2</span>
                <p className="text-sm text-slate-400">Verifiable output stored on Walrus</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success text-xs">3</span>
                <p className="text-sm text-slate-400">Privacy-safe: PII redacted before storage</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success text-xs">4</span>
                <p className="text-sm text-slate-400">Data compounds across runs — smarter over time</p>
              </div>
            </div>
            <div className="mt-8 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
              <p className="text-mono text-slate-400">
                <span className="text-success">{'>'} Run complete.</span> Dataset<br />
                <span className="text-success">{'>'} verified.</span> Privacy score: 100.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
