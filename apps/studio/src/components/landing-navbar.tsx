import { Link } from '@tanstack/react-router';

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Docs', href: '#' },
  { label: 'GitHub', href: 'https://github.com/CYBWithFlourish/M2A' },
] as const;

export function LandingNavbar({ scrolled }: { scrolled: boolean }) {
  return (
    <header
      className={
        'fixed top-0 z-40 w-full transition-all duration-300 ' +
        (scrolled
          ? 'border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80'
          : 'bg-transparent')
      }
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-6">
        <a href="#" className="flex items-center gap-2.5 shrink-0">
          <span className="font-display text-xl font-bold tracking-tight text-white">
            M2<span className="text-primary">A</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="relative px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white rounded-md hover:bg-white/5"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/studio"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition-all hover:brightness-110 active:opacity-80"
          >
            Open Studio
          </Link>
        </div>
      </div>
    </header>
  );
}
