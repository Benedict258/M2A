export default function DatasetsSection() {
  return (
    <section id="datasets" className="bg-surface-low">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-36">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-black dark:text-white leading-tight">
            Every automation you run<br />
            <span className="text-primary">produces a verifiable dataset.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Privacy-preserving pipeline: capture, redact, verify, and publish to Walrus, automatically, on every run.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-[#111318] p-10 md:p-12 flex flex-col justify-between min-h-[320px]">
            <div>
              <svg className="w-10 h-10 text-slate-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
                Before: Raw Output
              </h3>
              <p className="mt-6 text-slate-400 text-base leading-relaxed max-w-sm">
                Agent responses contain PII, wallet addresses, personal data:all exposed, all unverifiable.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#111318] p-10 md:p-12 flex flex-col justify-between min-h-[320px]">
            <div>
              <svg className="w-10 h-10 text-primary mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.135-.832 2.136-2.035 2.14a25.998 25.998 0 01-4.654 0 2.003 2.003 0 01-2.035-2.14m0 0V5.25A2.25 2.25 0 0115.75 3h2.25A2.25 2.25 0 0121 5.25v6.75a2.25 2.25 0 01-2.035 2.14 25.998 25.998 0 01-4.654 0 2.003 2.003 0 01-2.035-2.14V5.25A2.25 2.25 0 0113.5 3h2.25A2.25 2.25 0 0118 5.25v6.75a2.003 2.003 0 01-2.035 2.14 25.998 25.998 0 01-4.654 0c-1.203-.004-2.337.508-2.835 1.372m0 0V5.25A2.25 2.25 0 0113.5 3h2.25A2.25 2.25 0 0118 5.25v6.75" />
              </svg>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-primary leading-tight">
                After: Clean Dataset
              </h3>
              <p className="mt-6 text-slate-400 text-base leading-relaxed max-w-sm">
                Every run produces a verifiable, privacy-safe dataset stored on Walrus. Data compounds across runs, smarter over time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
