import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-memory-tier-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-3">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Read Channels</label>
        <div class="flex flex-wrap gap-1.5 mb-2">
          @for (ch of readChannels(); track ch) {
            <span class="inline-flex items-center gap-1 rounded-lg bg-harbor-control-bg px-2 py-1 text-xs text-harbor-text-body">
              {{ ch }}
              <button (click)="removeReadChannel(ch)" class="text-harbor-text-muted hover:text-harbor-text-heading">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </span>
          }
        </div>
        <div class="flex gap-2">
          <input
            #readInput
            (keydown.enter)="addReadChannel(readInput.value); readInput.value = ''"
            placeholder="pool::name"
            class="flex-1 rounded-lg border border-harbor-border-input bg-harbor-surface px-3 py-1.5 text-xs text-harbor-text-body outline-none placeholder:text-harbor-text-muted focus:border-walrus-400"
          />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Write Destinations</label>
        <div class="flex flex-wrap gap-1.5 mb-2">
          @for (ch of writeChannels(); track ch) {
            <span class="inline-flex items-center gap-1 rounded-lg bg-harbor-control-bg px-2 py-1 text-xs text-harbor-text-body">
              {{ ch }}
              <button (click)="removeWriteChannel(ch)" class="text-harbor-text-muted hover:text-harbor-text-heading">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </span>
          }
        </div>
        <div class="flex gap-2">
          <input
            #writeInput
            (keydown.enter)="addWriteChannel(writeInput.value); writeInput.value = ''"
            placeholder="private::namespace"
            class="flex-1 rounded-lg border border-harbor-border-input bg-harbor-surface px-3 py-1.5 text-xs text-harbor-text-body outline-none placeholder:text-harbor-text-muted focus:border-walrus-400"
          />
        </div>
      </div>
    </div>
  `,
})
export class MemoryTierSelectorComponent {
  readChannels = signal<string[]>(['pool::general']);
  writeChannels = signal<string[]>(['private::run-artifacts']);

  addReadChannel(ch: string) {
    if (ch.trim()) {
      this.readChannels.update(v => [...v, ch.trim()]);
    }
  }

  removeReadChannel(ch: string) {
    this.readChannels.update(v => v.filter(c => c !== ch));
  }

  addWriteChannel(ch: string) {
    if (ch.trim()) {
      this.writeChannels.update(v => [...v, ch.trim()]);
    }
  }

  removeWriteChannel(ch: string) {
    this.writeChannels.update(v => v.filter(c => c !== ch));
  }
}
