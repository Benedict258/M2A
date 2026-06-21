export default function SolutionSection() {
  return (
    <section id="solution" className="bg-surface-low">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-36">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight leading-tight text-black dark:text-white">
            An automation engine that gets smarter<br />
            <span className="text-primary">every time you use it.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Three primitives. Workflow engine to build. Dataset generation to compound. Memory to make it smart.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-[#111318] p-10 md:p-12 flex flex-col justify-between min-h-[320px]">
            <div>
              <svg className="w-10 h-10 text-primary mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-black dark:text-white leading-tight">
                Workflow<br />Engine
              </h3>
              <p className="mt-6 text-slate-400 text-base leading-relaxed max-w-sm">
                Visual canvas, 48 node types. Drag-connect-execute. Like n8n but on-chain.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#111318] p-10 md:p-12 flex flex-col justify-between min-h-[320px]">
            <div>
              <svg className="w-10 h-10 text-primary mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-black dark:text-white leading-tight">
                Dataset<br />Generation
              </h3>
              <p className="mt-6 text-slate-400 text-base leading-relaxed max-w-sm">
                Every automation run produces a verifiable, privacy-safe dataset, automatically. This is what n8n doesn't do.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#111318] p-10 md:p-12 flex flex-col justify-between min-h-[320px]">
            <div>
              <svg className="w-10 h-10 text-primary mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-6.219-8.56" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v5h-5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              </svg>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-black dark:text-white leading-tight">
                Persistent<br />Memory
              </h3>
              <p className="mt-6 text-slate-400 text-base leading-relaxed max-w-sm">
                The mechanism that makes automations smarter across runs and datasets more valuable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
