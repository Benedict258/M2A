import { Link } from '@tanstack/react-router';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="mx-auto max-w-[1400px] px-6 pt-32 pb-20 md:pt-40 md:pb-28 text-center relative z-10">
        <h1 className="mt-6 text-display-lg md:text-[64px] md:leading-[68px] tracking-tight">
          Build <span className="text-primary">Automations</span> on the Sui stack<br />and its protocols. <span className="text-primary">Every node remembers.</span><br />Every run generates <span className="text-primary">Verifiable data</span>.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
          Visual workflow builder powered by Walrus and MemWal. Drag, connect, and compose Sui protocols: DeFi, bridges, oracles, NFTs. Every execution leaves a permanent, privacy-safe dataset you can verify on-chain.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/studio"
            className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-white transition-all hover:brightness-110 active:opacity-80"
          >
            Start Building
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-11 items-center rounded-md border border-border bg-transparent px-6 text-sm font-semibold text-slate-300 transition-all hover:border-primary/60 hover:text-white"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
