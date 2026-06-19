import { Component, input, signal } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import type { LogEntry, WorkflowExecutionResult } from '../shared/types';

@Component({
  selector: 'app-bottom-panel',
  standalone: true,
  imports: [NgClass, DatePipe],
  template: `
    <div
      class="flex flex-col border-t border-harbor-border bg-harbor-surface transition-all"
      [class.h-48]="expanded()"
      [class.h-8]="!expanded()"
    >
      <button
        (click)="toggleExpanded()"
        class="flex h-8 items-center gap-2 border-b border-harbor-border px-4 text-xs font-medium text-harbor-text-muted transition-colors hover:text-harbor-text-heading"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="transition-transform"
          [class.rotate-180]="expanded()"
        >
          <polyline points="18 15 12 9 6 15"/>
        </svg>
        {{ expanded() ? 'Hide' : 'Show' }} Panel
      </button>

      @if (expanded()) {
        <div class="flex border-b border-harbor-border">
          @for (tab of tabs; track tab.key) {
            <button
              (click)="activeTab.set(tab.key)"
              class="px-4 py-1.5 text-xs font-medium transition-colors"
              [class.text-harbor-text-heading]="activeTab() === tab.key"
              [class.border-b-2]="activeTab() === tab.key"
              [class.border-walrus-400]="activeTab() === tab.key"
              [class.text-harbor-text-muted]="activeTab() !== tab.key"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <div class="flex-1 overflow-y-auto p-3">
          @if (activeTab() === 'logs') {
            <div class="space-y-1">
              @for (log of executionLogs(); track log.timestamp) {
                <div
                  class="flex items-start gap-3 rounded-lg border-l-2 px-3 py-2 text-xs"
                  [class.border-blue-500]="log.type === 'info'"
                  [class.border-red-500]="log.type === 'error'"
                  [class.border-amber-500]="log.type === 'llm'"
                  [class.border-indigo-500]="log.type === 'recall'"
                  [class.border-green-500]="log.type === 'remember'"
                >
                  <div class="flex-1">
                    <div class="text-harbor-text-body">{{ log.message }}</div>
                    <div class="mt-0.5 text-harbor-text-muted">{{ log.nodeLabel }} &middot; {{ log.timestamp | date:'HH:mm:ss' }}</div>
                  </div>
                </div>
              } @empty {
                <div class="py-8 text-center text-sm text-harbor-text-muted">No logs yet. Run a workflow to see execution logs.</div>
              }
            </div>
          }

          @if (activeTab() === 'results') {
            <div class="space-y-2">
              @for (result of executionResults(); track result.timestamp) {
                <div class="rounded-lg border border-harbor-border bg-harbor-card-bg p-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase"
                      [ngClass]="{
                        'bg-green-500/20 text-green-400': result.status === 'success',
                        'bg-red-500/20 text-red-400': result.status === 'error'
                      }"
                    >
                      {{ result.status }}
                    </span>
                    <span class="text-xs font-medium text-harbor-text-heading">{{ result.nodeLabel }}</span>
                  </div>
                  <div class="mt-1 text-xs text-harbor-text-secondary">{{ result.output }}</div>
                </div>
              } @empty {
                <div class="py-8 text-center text-sm text-harbor-text-muted">No results yet.</div>
              }
            </div>
          }

          @if (activeTab() === 'memory') {
            <div class="py-8 text-center text-sm text-harbor-text-muted">
              Memory Explorer coming soon
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BottomPanelComponent {
  executionLogs = input<LogEntry[]>([]);
  executionResults = input<WorkflowExecutionResult[]>([]);
  nodeStates = input<Record<string, string>>({});
  expanded = signal(false);
  activeTab = signal<'logs' | 'results' | 'memory'>('logs');

  toggleExpanded() {
    this.expanded.update(v => !v);
  }

  tabs = [
    { key: 'logs' as const, label: 'Execution Logs' },
    { key: 'results' as const, label: 'Results' },
    { key: 'memory' as const, label: 'Memory Explorer' },
  ];
}
