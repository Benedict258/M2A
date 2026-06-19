import { Component, output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../shared/api.service';
import { type WorkflowDefinition } from '../shared/types';

const BUILTIN_TEMPLATES: (WorkflowDefinition & { description: string; category: string })[] = [
  {
    id: 'code-review', name: 'Code Review Agent', version: '1.0.0', description: 'Multi-reviewer code analysis pipeline', category: 'Development',
    nodes: [
      { id: 'input_1', type: 'input', position: { x: 50, y: 200 }, data: { label: 'Input', type: 'input' } },
      { id: 'agent_1', type: 'agent', position: { x: 350, y: 120 }, data: { label: 'Senior Reviewer', type: 'agent', model: 'gemini-1.5-pro', directives: 'Review code for bugs, style, and security issues.' } },
      { id: 'agent_2', type: 'agent', position: { x: 350, y: 320 }, data: { label: 'Junior Reviewer', type: 'agent', model: 'gemini-1.5-flash', directives: 'Check for common mistakes and suggest improvements.' } },
      { id: 'output_1', type: 'output', position: { x: 650, y: 200 }, data: { label: 'Output', type: 'output' } },
    ],
    edges: [
      { id: 'e1', source: 'input_1', target: 'agent_1' },
      { id: 'e2', source: 'input_1', target: 'agent_2' },
      { id: 'e3', source: 'agent_1', target: 'output_1' },
      { id: 'e4', source: 'agent_2', target: 'output_1' },
    ],
  },
  {
    id: 'market-research', name: 'Market Research Agent', version: '1.0.0', description: 'Automated market research and analysis', category: 'Research',
    nodes: [
      { id: 'input_1', type: 'input', position: { x: 50, y: 200 }, data: { label: 'Input', type: 'input' } },
      { id: 'agent_1', type: 'agent', position: { x: 350, y: 200 }, data: { label: 'Researcher', type: 'agent', directives: 'Research market trends and competitors.' } },
      { id: 'output_1', type: 'output', position: { x: 650, y: 200 }, data: { label: 'Output', type: 'output' } },
    ],
    edges: [
      { id: 'e1', source: 'input_1', target: 'agent_1' },
      { id: 'e2', source: 'agent_1', target: 'output_1' },
    ],
  },
  {
    id: 'customer-support', name: 'Customer Support Bot', version: '1.0.0', description: 'AI-powered customer support with knowledge base', category: 'Support',
    nodes: [
      { id: 'input_1', type: 'input', position: { x: 50, y: 200 }, data: { label: 'Input', type: 'input' } },
      { id: 'agent_1', type: 'agent', position: { x: 350, y: 120 }, data: { label: 'Support Agent', type: 'agent', directives: 'Provide helpful customer support.' } },
      { id: 'walrus_1', type: 'walrus', position: { x: 350, y: 320 }, data: { label: 'KB Storage', type: 'walrus' } },
      { id: 'output_1', type: 'output', position: { x: 650, y: 200 }, data: { label: 'Output', type: 'output' } },
    ],
    edges: [
      { id: 'e1', source: 'input_1', target: 'agent_1' },
      { id: 'e2', source: 'walrus_1', target: 'agent_1' },
      { id: 'e3', source: 'agent_1', target: 'output_1' },
    ],
  },
  {
    id: 'defi-trading', name: 'DeFi Trading Agent', version: '1.0.0', description: 'Automated DeFi trading and analysis', category: 'DeFi',
    nodes: [
      { id: 'input_1', type: 'input', position: { x: 50, y: 200 }, data: { label: 'Input', type: 'input' } },
      { id: 'sui_1', type: 'sui', position: { x: 50, y: 350 }, data: { label: 'Price Feed', type: 'sui' } },
      { id: 'agent_1', type: 'agent', position: { x: 350, y: 200 }, data: { label: 'Trading Agent', type: 'agent', directives: 'Analyze market data and execute trades.' } },
      { id: 'output_1', type: 'output', position: { x: 650, y: 200 }, data: { label: 'Output', type: 'output' } },
    ],
    edges: [
      { id: 'e1', source: 'input_1', target: 'agent_1' },
      { id: 'e2', source: 'sui_1', target: 'agent_1' },
      { id: 'e3', source: 'agent_1', target: 'output_1' },
    ],
  },
];

@Component({
  selector: 'app-template-marketplace',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" (click)="close.emit()">
      <div class="h-[80vh] w-full max-w-3xl animate-slide-up rounded-2xl border border-harbor-border bg-harbor-card-bg shadow-2xl flex flex-col" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-harbor-border px-6 py-4">
          <h2 class="text-lg font-semibold text-harbor-text-heading">Template Marketplace</h2>
          <button (click)="close.emit()" class="text-harbor-text-muted hover:text-harbor-text-heading">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="p-4">
          <input
            [(ngModel)]="search"
            placeholder="Search templates..."
            class="w-full rounded-xl border border-harbor-border-input bg-harbor-surface px-4 py-2.5 text-sm text-harbor-text-heading outline-none placeholder:text-harbor-text-muted focus:border-walrus-400"
          />
        </div>

        <div class="flex gap-2 px-4 pb-4">
          @for (cat of categories; track cat) {
            <button
              (click)="selectedCategory.set(cat)"
              class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              [class.bg-walrus-500]="selectedCategory() === cat"
              [class.text-white]="selectedCategory() === cat"
              [class.bg-harbor-control-bg]="selectedCategory() !== cat"
              [class.text-harbor-text-body]="selectedCategory() !== cat"
              [class.hover:bg-harbor-control-hover]="selectedCategory() !== cat"
            >
              {{ cat }}
            </button>
          }
        </div>

        <div class="flex-1 overflow-y-auto px-4 pb-4">
          <div class="grid grid-cols-2 gap-3">
            @for (tmpl of filteredTemplates(); track tmpl.id) {
              <div class="rounded-xl border border-harbor-border bg-harbor-surface p-4 transition-all hover:border-harbor-border-input">
                <div class="mb-2 flex items-center justify-between">
                  <span class="rounded-full bg-walrus-500/20 px-2 py-0.5 text-[10px] font-medium text-walrus-400 uppercase">{{ tmpl.category || 'General' }}</span>
                  <span class="text-xs text-harbor-text-muted">{{ tmpl.nodeCount || 0 }} nodes</span>
                </div>
                <h3 class="text-sm font-medium text-harbor-text-heading">{{ tmpl.name }}</h3>
                <p class="mt-1 text-xs text-harbor-text-secondary">{{ tmpl.description || '' }}</p>
                <button
                  (click)="useTemplate(tmpl)"
                  class="mt-3 w-full rounded-lg bg-walrus-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-walrus-600"
                >
                  Use Template
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TemplateMarketplaceComponent {
  private api = inject(ApiService);

  close = output();
  selectTemplate = output<WorkflowDefinition>();

  search = signal('');
  selectedCategory = signal('All');
  remoteTemplates = signal<WorkflowDefinition[]>([]);

  categories = ['All', 'Development', 'Research', 'Support', 'Data', 'DeFi'];

  builtinTemplates = BUILTIN_TEMPLATES;

  useTemplate(tmpl: WorkflowDefinition) {
    this.selectTemplate.emit(tmpl);
  }

  filteredTemplates = () => {
    const q = this.search().toLowerCase();
    const cat = this.selectedCategory();
    const all = [...this.builtinTemplates, ...this.remoteTemplates()];
    return all.filter(t => {
      const nameMatch = t.name.toLowerCase().includes(q);
      const catMatch = cat === 'All' || (t.category === cat);
      return nameMatch && catMatch;
    }).map(t => ({
      ...t,
      nodeCount: t.nodes.length,
    }));
  };
}
