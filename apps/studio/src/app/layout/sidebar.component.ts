import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../shared/api.service';
import { WorkflowStore } from '../stores/workflow.store';
import { type PaletteNode, type WorkflowDefinition } from '../shared/types';

const PALETTE_NODES: PaletteNode[] = [
  { type: 'input', label: 'Input', description: 'Workflow trigger / entry point', category: 'Essentials', icon: 'arrow-in', color: '#22c55e' },
  { type: 'agent', label: 'M2A Agent', description: 'LLM-powered agent with memory & tools', category: 'Essentials', icon: 'hexagon', color: '#8b5cf6' },
  { type: 'output', label: 'Final Output', description: 'Terminal node for result delivery', category: 'Essentials', icon: 'arrow-out', color: '#f87171' },
  { type: 'walrus', label: 'Walrus Storage', description: 'Decentralized blob storage', category: 'Decentralized Stack', icon: 'database', color: '#3b82f6' },
  { type: 'sui', label: 'Sui Network', description: 'Blockchain query & transaction', category: 'Decentralized Stack', icon: 'blocks', color: '#f59e0b' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <aside
      class="flex flex-col border-r border-harbor-border bg-harbor-surface transition-all duration-200"
      [class.w-72]="open()"
      [class.w-0]="!open()"
      [class.overflow-hidden]="!open()"
    >
      <div class="flex border-b border-harbor-border">
        @for (tab of tabs; track tab.key) {
          <button
            (click)="activeTab.set(tab.key)"
            class="flex-1 px-3 py-2.5 text-xs font-medium transition-colors"
            [class.text-harbor-text-heading]="activeTab() === tab.key"
            [class.bg-harbor-control-active]="activeTab() === tab.key"
            [class.text-harbor-text-muted]="activeTab() !== tab.key"
            [class.hover:text-harbor-text-body]="activeTab() !== tab.key"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      <div class="flex-1 overflow-y-auto p-3">
        @if (activeTab() === 'nodes') {
          <div class="space-y-1.5">
            @for (node of paletteNodes; track node.type) {
              <div
                draggable="true"
                (dragstart)="onDragStart($event, node)"
                (dblclick)="addNode.emit(node.type)"
                class="cursor-grab rounded-xl border border-harbor-border bg-harbor-card-bg p-3 transition-all hover:border-harbor-border-input hover:bg-harbor-control-hover active:cursor-grabbing"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg"
                    [style.background]="node.color + '20'"
                    [style.color]="node.color"
                  >
                    @switch (node.icon) {
                      @case ('arrow-in') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      }
                      @case ('hexagon') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                      }
                      @case ('arrow-out') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 19 19 12 12 5"/></svg>
                      }
                      @case ('database') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                      }
                      @case ('blocks') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                      }
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-harbor-text-heading">{{ node.label }}</div>
                    <div class="mt-0.5 text-xs text-harbor-text-muted">{{ node.description }}</div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        @if (activeTab() === 'workflows') {
          <div class="space-y-1">
            @if (loading()) {
              <div class="py-8 text-center text-sm text-harbor-text-muted">Loading...</div>
            } @else if (workflows().length === 0) {
              <div class="py-8 text-center text-sm text-harbor-text-muted">No saved workflows yet</div>
            }
            @for (wf of workflows(); track wf.id) {
              <button
                (click)="selectWorkflow.emit(wf)"
                class="w-full rounded-lg px-3 py-2 text-left text-sm text-harbor-text-body transition-colors hover:bg-harbor-control-hover hover:text-harbor-text-heading"
              >
                {{ wf.name }}
              </button>
            }
          </div>
        }

        @if (activeTab() === 'executions') {
          <div class="space-y-1">
            @for (log of logs(); track log.timestamp) {
              <div
                class="rounded-lg border-l-2 px-3 py-2 text-xs"
                [class.border-blue-500]="log.type === 'info'"
                [class.border-red-500]="log.type === 'error'"
                [class.border-amber-500]="log.type === 'llm'"
              >
                <div class="text-harbor-text-secondary">{{ log.message }}</div>
                <div class="mt-0.5 text-harbor-text-muted">{{ log.nodeLabel }}</div>
              </div>
            } @empty {
              <div class="py-8 text-center text-sm text-harbor-text-muted">No executions yet</div>
            }
          </div>
        }
      </div>
    </aside>
  `,
})
export class SidebarComponent implements OnInit {
  private api = inject(ApiService);
  private store = inject(WorkflowStore);

  open = input<boolean>(true);
  close = output();
  selectWorkflow = output<WorkflowDefinition>();
  addNode = output<string>();

  activeTab = signal<'workflows' | 'nodes' | 'executions'>('nodes');
  workflows = signal<WorkflowDefinition[]>([]);
  loading = signal(false);
  logs = this.store.executionLogs;
  paletteNodes = PALETTE_NODES;

  tabs = [
    { key: 'workflows' as const, label: 'Workflows' },
    { key: 'nodes' as const, label: 'Nodes' },
    { key: 'executions' as const, label: 'Executions' },
  ];

  async ngOnInit() {
    if (this.activeTab() === 'workflows') {
      await this.loadWorkflows();
    }
  }

  async loadWorkflows() {
    this.loading.set(true);
    try {
      this.workflows.set(await this.api.listWorkflows());
    } catch {
      // ignore
    } finally {
      this.loading.set(false);
    }
  }

  onDragStart(event: DragEvent, node: PaletteNode) {
    event.dataTransfer?.setData('text/plain', node.type);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
}
