import { useState } from 'react';

const TABS = [
  { id: 'setup', label: '1. Setup', code: `import { Buiry } from "buiry";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

const keypair = Ed25519Keypair.fromSecretKey(
  process.env.SUI_PRIVATE_KEY!
);

const buiry = new Buiry({
  namespace: "agent-memory-store",
  signer: keypair.getKeypair(),
  network: "testnet",
  wallet: new AgentWallet({ keypair }),
});` },
  { id: 'remember', label: '2. Remember', code: `const memory = buiry.memory("deep-research-42");

const entry = await memory.remember({
  key: "findings/defi-yield-2026",
  value: {
    topic: "DeFi yield optimization",
    sources: researcherTool.citations,
    confidence: 0.94,
    timestamp: Date.now(),
  },
  tags: ["defi", "research", "yield"],
  ttl: 90 * 24 * 60 * 60, // 90 days
});

console.log(entry.blobId);
// walrus://3BxGhz...f8Kp` },
  { id: 'recall', label: '3. Recall', code: `const memory = buiry.memory("deep-research-42");

const results = await memory.recall({
  key: "findings/defi-yield-2026",
  verify: true, // check Sui transaction proof
});

if (results.verified) {
  console.log(\`Recalled: \${results.data.topic}\`);
  console.log(\`Confidence: \${results.data.confidence}\`);
  console.log(\`Blob: \${results.blobId}\`);
  console.log(\`Sui tx: \${results.proof}\`);
}` },
];

export default function HowItWorksSection() {
  const [active, setActive] = useState(TABS[0].id);

  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <section id="how-it-works" className="border-b border-border bg-surface-low">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-headline-lg">Zero to persistent agent memory in under 5 minutes.</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Three API calls. One SDK. Your agents now have memory that survives any session.
          </p>
        </div>

        <div className="mt-10 flex justify-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={
                'px-4 py-2 text-sm font-semibold rounded-t-md transition-colors ' +
                (active === tab.id
                  ? 'bg-card border border-border border-b-0 text-primary'
                  : 'text-slate-500 hover:text-slate-300')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-lg rounded-tl-none border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface">
            <span className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
            </span>
            <span className="ml-2 text-mono text-slate-600">buiry.ts</span>
          </div>
          <div className="p-5 overflow-x-auto">
            <pre className="text-mono text-[13px] leading-relaxed text-slate-300">
              <code>{activeTab.code}</code>
            </pre>
          </div>
        </div>

        <div className="mt-10 text-center">
          <a
            href="http://152.67.149.134:5177"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-white transition-all hover:brightness-110 active:opacity-80"
          >
            Start Building
          </a>
        </div>
      </div>
    </section>
  );
}
