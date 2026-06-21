import { Link } from "@tanstack/react-router";

const COMPARE_LEFT = [
  "Stateless:every run starts from zero",
  "Centralized:one server, one point of failure",
  "No verification:you trust the platform's word",
  "Off-chain only:no real connection to Web3",
];

const COMPARE_RIGHT = [
  "Persistent memory:every node remembers across runs",
  "Built on Sui, Walrus, and MemWal:decentralized by default",
  "Verifiable:every execution is a Sui transaction",
  "Native protocol access:connect directly to the Sui stack",
];

export default function AutomationSection() {
  return (
    <section id="automation" className="bg-surface-low">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-36">
        <div className="text-center mb-16">
          <p className="text-label-bold text-muted-foreground uppercase tracking-widest mb-6">
            ON-CHAIN AUTOMATION, REIMAGINED
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-black dark:text-white leading-tight">
            Build on Sui and its protocols.<br />
            <span className="text-primary">As easily as dragging a node.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            M2A is the on-chain automation builder:connect AI agents, Sui protocols, and data sources visually, without writing a single line of Move or wrangling an SDK directly. You already know how to use M2A. The difference is everything you build remembers, and everything that happens is verifiable on-chain.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <div className="rounded-3xl bg-[#111318] p-8 md:p-10">
            <h3 className="text-lg font-bold text-slate-500 mb-6">Other automation tools</h3>
            <div className="space-y-4">
              {COMPARE_LEFT.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-600" />
                  <p className="text-sm text-slate-500">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#111318] p-8 md:p-10" style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <h3 className="text-lg font-bold text-primary mb-6">M2A</h3>
            <div className="space-y-4">
              {COMPARE_RIGHT.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="text-center md:text-left">
            <span className="inline-block text-3xl font-bold text-black dark:text-white mb-2">1</span>
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Drag</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drop a node onto the canvas:an AI agent, a Sui protocol connector, a trigger, a data source.
            </p>
          </div>
          <div className="text-center md:text-left">
            <span className="inline-block text-3xl font-bold text-primary mb-2">2</span>
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Connect</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Draw a line between nodes. That's it:they now share memory and pass data automatically.
            </p>
          </div>
          <div className="text-center md:text-left">
            <span className="inline-block text-3xl font-bold text-primary mb-2">3</span>
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Run</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Execute. Every action becomes a verifiable on-chain transaction. No manual wiring, no protocol-specific code.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500">
          This is what on-chain automation should have looked like from the start.
        </p>
      </div>
    </section>
  );
}
