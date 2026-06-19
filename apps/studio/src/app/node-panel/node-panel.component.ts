import { Component, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MemoryTierSelectorComponent } from './memory-tier-selector.component';
import type { NodeDefinition } from '../shared/types';

@Component({
  selector: 'app-node-panel',
  standalone: true,
  imports: [FormsModule, MemoryTierSelectorComponent],
  template: `
    <aside
      class="w-80 border-l border-harbor-border bg-harbor-surface overflow-y-auto transition-all"
      [class.hidden]="!nodeId()"
    >
      @if (node(); as n) {
        <div class="p-4">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold uppercase"
                [style.background]="accentColor() + '20'"
                [style.color]="accentColor()"
              >
                {{ n.type.charAt(0) }}
              </div>
              <span class="text-sm font-medium text-harbor-text-heading capitalize">{{ n.type }} Node</span>
            </div>
            <button class="text-harbor-text-muted hover:text-harbor-text-heading">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="mb-3 text-xs text-harbor-text-muted">Node ID: {{ n.id }}</div>

          <div class="tabs flex border-b border-harbor-border mb-4">
            @for (tab of tabs; track tab.key) {
              <button
                (click)="activeTab.set(tab.key)"
                class="px-3 py-2 text-xs font-medium transition-colors"
                [class.text-harbor-text-heading]="activeTab() === tab.key"
                [class.border-b-2]="activeTab() === tab.key"
                [class.border-walrus-400]="activeTab() === tab.key"
                [class.text-harbor-text-muted]="activeTab() !== tab.key"
              >
                {{ tab.label }}
              </button>
            }
          </div>

          @if (activeTab() === 'persona') {
            <div class="space-y-4">
              @if (n.type === 'agent') {
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Role / Directives</label>
                  <textarea
                    [ngModel]="n.data['directives'] || ''"
                    (ngModelChange)="onChange('directives', $event)"
                    rows="4"
                    placeholder="Describe the agent's role and behavior..."
                    class="w-full rounded-lg border border-harbor-border-input bg-harbor-surface px-3 py-2 text-sm text-harbor-text-body outline-none placeholder:text-harbor-text-muted focus:border-walrus-400"
                  ></textarea>
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Model</label>
                  <select
                    [ngModel]="n.data['model'] || 'gemini-1.5-flash'"
                    (ngModelChange)="onChange('model', $event)"
                    class="w-full rounded-lg border border-harbor-border-input bg-harbor-surface px-3 py-2 text-sm text-harbor-text-body outline-none focus:border-walrus-400"
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="llama-3.1-70b">Llama 3.1 70B</option>
                  </select>
                </div>

                <div class="flex gap-3">
                  <div class="flex-1">
                    <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Temperature</label>
                    <input
                      type="range"
                      [ngModel]="n.data['temperature'] || 0.7"
                      (ngModelChange)="onChange('temperature', $event)"
                      min="0" max="2" step="0.1"
                      class="w-full"
                    />
                    <div class="text-xs text-harbor-text-muted">{{ n.data['temperature'] || 0.7 }}</div>
                  </div>
                  <div class="flex-1">
                    <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Max Tokens</label>
                    <input
                      type="number"
                      [ngModel]="n.data['maxTokens'] || 2048"
                      (ngModelChange)="onChange('maxTokens', $event)"
                      class="w-full rounded-lg border border-harbor-border-input bg-harbor-surface px-3 py-2 text-sm text-harbor-text-body outline-none focus:border-walrus-400"
                    />
                  </div>
                </div>
              } @else {
                <div class="py-8 text-center text-sm text-harbor-text-muted">
                  No configuration for this node type
                </div>
              }
            </div>
          }

          @if (activeTab() === 'memory') {
            <app-memory-tier-selector />
          }

          @if (activeTab() === 'tools') {
            <div class="space-y-2">
              <label class="text-xs font-medium text-harbor-text-secondary">Capabilities</label>
              @if (n.type === 'agent') {
                @for (tool of availableTools; track tool.key) {
                  <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-harbor-border bg-harbor-card-bg px-3 py-2.5 transition-colors hover:bg-harbor-control-hover">
                    <input
                      type="checkbox"
                      [checked]="isToolEnabled(tool.key)"
                      (change)="toggleTool(tool.key)"
                      class="h-4 w-4 rounded border-harbor-border text-walrus-400 focus:ring-walrus-400"
                    />
                    <div>
                      <div class="text-sm text-harbor-text-heading">{{ tool.label }}</div>
                      <div class="text-xs text-harbor-text-muted">{{ tool.desc }}</div>
                    </div>
                  </label>
                }
              } @else {
                <div class="py-8 text-center text-sm text-harbor-text-muted">No tools available</div>
              }
            </div>
          }
        </div>
      }
    </aside>
  `,
})
export class NodePanelComponent {
  nodeId = input<string | null>(null);
  node = input<NodeDefinition | null>(null);
  update = output<{ nodeId: string; updates: Record<string, unknown> }>();

  activeTab = signal<'persona' | 'memory' | 'tools'>('persona');

  tabs = [
    { key: 'persona' as const, label: 'Persona' },
    { key: 'memory' as const, label: 'Memory' },
    { key: 'tools' as const, label: 'Tools' },
  ];

  availableTools = [
    { key: 'store_to_walrus', label: 'Store Blob', desc: 'Store data to Walrus decentralized storage' },
    { key: 'fetch_from_walrus', label: 'Fetch Blob', desc: 'Retrieve stored data from Walrus' },
    { key: 'sui_query', label: 'Sui RPC', desc: 'Query on-chain state via Sui RPC' },
  ];

  accentColor = computed(() => {
    const type = this.node()?.type;
    switch (type) {
      case 'agent': return '#8b5cf6';
      case 'input': return '#22c55e';
      case 'output': return '#f87171';
      case 'walrus': return '#3b82f6';
      case 'sui': return '#f59e0b';
      default: return '#6b7280';
    }
  });

  getNodeData() {
    return this.node()?.data || {};
  }

  isToolEnabled(key: string): boolean {
    const tools = this.node()?.data?.['tools'] as string[] | undefined;
    return tools?.includes(key) || false;
  }

  private emitUpdate(data: Record<string, unknown>) {
    const n = this.node();
    if (n) {
      this.update.emit({ nodeId: n.id, updates: data });
    }
  }

  onChange(key: string, value: unknown) {
    this.emitUpdate({ [key]: value });
  }

  toggleTool(key: string) {
    const tools = new Set<string>(this.node()?.data?.['tools'] as string[] || []);
    if (tools.has(key)) {
      tools.delete(key);
    } else {
      tools.add(key);
    }
    this.emitUpdate({ tools: [...tools] });
  }
}
