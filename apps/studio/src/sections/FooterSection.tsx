const PRODUCT = [
  { label: 'Features', href: '#features' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Community', href: '#community' },
];

const DEVELOPERS = [
  { label: 'GitHub', href: 'https://github.com/anomalyco/m2a' },
  { label: 'Documentation', href: '#' },
  { label: 'npm: buiry', href: '#' },
  { label: 'Sui Testnet', href: '#' },
];

const COMPANY = [
  { label: 'M2A', href: '#' },
  { label: 'GPL v3 License', href: 'https://github.com/anomalyco/m2a' },
  { label: 'Sui Overflow 2026', href: '#' },
  { label: 'Contact', href: '#' },
];

export default function FooterSection() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href="#" className="inline-flex items-center gap-2">
              <span className="font-display text-xl font-bold tracking-tight text-white">
                M2<span className="text-primary">A</span>
              </span>
            </a>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs">
              Persistent, verifiable memory for AI agents. Powered by Walrus, anchored on Sui.
            </p>
          </div>

          <div>
            <p className="text-label-bold text-slate-500 mb-3">Product</p>
            <ul className="space-y-2">
              {PRODUCT.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-label-bold text-slate-500 mb-3">Developers</p>
            <ul className="space-y-2">
              {DEVELOPERS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-label-bold text-slate-500 mb-3">Company</p>
            <ul className="space-y-2">
              {COMPANY.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; 2026 M2A. Built on Sui. Stored on Walrus. GPL v3.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/anomalyco/m2a" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-400 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <span className="text-xs text-slate-600">Live: 152.67.149.134:5177</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
