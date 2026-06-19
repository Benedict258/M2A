import { Component, output, signal, inject, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ActionPaletteItem {
  type: string;
  label: string;
  category: string;
  icon: string;
  color: string;
}

const ITEMS: ActionPaletteItem[] = [
  { type: 'input', label: 'Input Trigger', category: 'Essentials', icon: 'arrow-in', color: '#22c55e' },
  { type: 'agent', label: 'M2A Agent', category: 'Essentials', icon: 'hexagon', color: '#8b5cf6' },
  { type: 'output', label: 'Final Output', category: 'Essentials', icon: 'arrow-out', color: '#f87171' },
  { type: 'walrus', label: 'Walrus Storage', category: 'Decentralized Stack', icon: 'database', color: '#3b82f6' },
  { type: 'sui', label: 'Sui Network', category: 'Decentralized Stack', icon: 'blocks', color: '#f59e0b' },
];

@Component({
  selector: 'app-action-palette',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      (click)="close.emit()"
    >
      <div
        class="w-full max-w-lg animate-slide-up rounded-2xl border border-harbor-border bg-harbor-card-bg shadow-2xl"
        (click)="$event.stopPropagation()"
      >
        <div class="p-3">
          <input
            [(ngModel)]="query"
            (keydown)="onKeydown($event)"
            #searchInput
            placeholder="Search nodes..."
            class="w-full rounded-xl border border-harbor-border-input bg-harbor-surface px-4 py-2.5 text-sm text-harbor-text-heading outline-none placeholder:text-harbor-text-muted focus:border-walrus-400"
          />
        </div>

        <div class="max-h-80 overflow-y-auto px-3 pb-3">
          @for (item of filtered(); track item.type) {
            <button
              (click)="select(item)"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-harbor-control-hover"
              [class.bg-harbor-control-active]="selectedIndex() === $index"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg"
                [style.background]="item.color + '20'"
                [style.color]="item.color"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  @switch (item.icon) {
                    @case ('arrow-in') { <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/> }
                    @case ('hexagon') { <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/> }
                    @case ('arrow-out') { <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 19 19 12 12 5"/> }
                    @case ('database') { <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/> }
                    @case ('blocks') { <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/> }
                  }
                </svg>
              </div>
              <div>
                <div class="text-sm font-medium text-harbor-text-heading">{{ item.label }}</div>
                <div class="text-xs text-harbor-text-muted">{{ item.category }}</div>
              </div>
            </button>
          } @empty {
            <div class="py-8 text-center text-sm text-harbor-text-muted">No nodes found</div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ActionPaletteComponent {
  close = output();
  selectNode = output<string>();

  query = signal('');
  selectedIndex = signal(0);
  items = ITEMS;

  filtered = () => {
    const q = this.query().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(
      i => i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  };

  select(item: ActionPaletteItem) {
    this.selectNode.emit(item.type);
  }

  onKeydown(event: KeyboardEvent) {
    const filtered = this.filtered();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.update(i => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.update(i => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filtered[this.selectedIndex()]) {
        this.select(filtered[this.selectedIndex()]);
      }
    } else if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}
