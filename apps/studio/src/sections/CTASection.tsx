export default function CTASection() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-low p-8 md:p-12 text-center">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="relative z-10">
          <h2 className="text-headline-lg">Your agents deserve a memory.</h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Stop burning tokens on repetition. Give your agents the persistent, verifiable memory they were born to have.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="http://152.67.149.134:5177"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-white transition-all hover:brightness-110 active:opacity-80"
            >
              Start Building Free
            </a>
            <a
              href="#"
              className="inline-flex h-11 items-center rounded-md border border-border bg-transparent px-6 text-sm font-semibold text-slate-300 transition-all hover:border-primary/60 hover:text-white"
            >
              Read the Docs
            </a>
          </div>

          <p className="mt-8 text-mono text-slate-600">
            npm install buiry
          </p>
        </div>
      </div>
    </section>
  );
}
