export default function ProblemSection() {
  return (
    <section id="problem" className="bg-surface-low">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-36">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight leading-tight text-black dark:text-white">
            Automation platforms today run workflows.<br />
            <span className="text-primary">Then the value disappears.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-[#111318] p-10 md:p-12 flex flex-col justify-between min-h-[320px]">
            <div>
              <svg className="w-10 h-10 text-slate-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <line x1="12" y1="12" x2="20" y2="20" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
                Without M2A
              </h3>
              <p className="mt-6 text-slate-400 text-base leading-relaxed max-w-sm">
                Workflow runs. Value disappears. No verifiable record. No reusable data.
                Every run starts from zero.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#111318] p-10 md:p-12 flex flex-col justify-between min-h-[320px]">
            <div>
              <svg className="w-10 h-10 text-primary mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0 3h.008" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-primary leading-tight">
                Every run.<br />A dataset.
              </h3>
              <p className="mt-6 text-slate-400 text-base leading-relaxed max-w-sm">
                Every automation run produces a verifiable, privacy-safe dataset
                stored on Walrus. Data compounds across runs, smarter over time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
