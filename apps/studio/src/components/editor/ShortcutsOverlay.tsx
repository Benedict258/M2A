import { X } from 'lucide-react';

const SHORTCUTS = [
  { key: '⌘K / Ctrl+K', action: 'Action palette (add nodes)' },
  { key: '⌘Z / Ctrl+Z', action: 'Undo' },
  { key: '⌘⇧Z / Ctrl+Shift+Z', action: 'Redo' },
  { key: '⌘C / Ctrl+C', action: 'Copy selected node' },
  { key: '⌘V / Ctrl+V', action: 'Paste node' },
  { key: '?', action: 'Show keyboard shortcuts' },
  { key: 'Delete', action: 'Delete selected node' },
  { key: 'Click canvas + drag', action: 'Pan canvas' },
  { key: 'Scroll wheel', action: 'Zoom in/out' },
  { key: 'Click output socket', action: 'Start connection' },
  { key: 'Click input socket', action: 'Finish connection' },
];

export function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-container p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between rounded-md bg-surface px-3 py-2">
              <span className="text-xs text-foreground">{s.action}</span>
              <kbd className="rounded bg-surface-high px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
