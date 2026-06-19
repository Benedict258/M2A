import { Component, input, output, inject, AfterViewInit, OnDestroy, ElementRef, viewChild, HostListener } from '@angular/core';
import type { NodeDefinition, EdgeDefinition } from '../shared/types';
import { EditorService } from './editor.service';
import { WorkflowStore } from '../stores/workflow.store';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [],
  host: { '[class]': '"block h-full w-full"' },
  template: `
    <div #editorContainer class="h-full w-full rete" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
      @if (!editorService.isReady()) {
        <div class="flex h-full items-center justify-center">
          <div class="text-center">
            <div class="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-walrus-400 border-t-transparent mx-auto"></div>
            <div class="text-sm text-harbor-text-muted">Loading Editor...</div>
          </div>
        </div>
      } @else if (nodes().length === 0) {
        <div class="flex h-full items-center justify-center">
          <div class="text-center max-w-sm">
            <div class="mb-4 mx-auto w-16 h-16 rounded-2xl bg-walrus-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
            <h3 class="text-lg font-semibold text-harbor-text-heading mb-1">Build Your Workflow</h3>
            <p class="text-sm text-harbor-text-muted mb-6">Drag nodes from the sidebar, or press <kbd class="rounded border border-harbor-border bg-harbor-surface px-1.5 py-0.5 text-xs">Cmd+K</kbd> to add nodes.</p>
            <button
              (click)="addSampleNode()"
              class="rounded-lg bg-walrus-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-walrus-600"
            >
              + Add First Node
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef);
  editorService = inject(EditorService);
  private store = inject(WorkflowStore);

  editorContainer = viewChild.required<ElementRef<HTMLDivElement>>('editorContainer');

  nodes = input<NodeDefinition[]>([]);
  edges = input<EdgeDefinition[]>([]);
  selectedNodeId = input<string | null>(null);

  nodesChange = output<NodeDefinition[]>();
  edgesChange = output<EdgeDefinition[]>();
  selectNode = output<string>();
  deselectNode = output();

  ngAfterViewInit() {
    const container = this.editorContainer()?.nativeElement;
    if (container) {
      this.editorService.createEditor(container);
    }
    setTimeout(() => {
      this.editorService.isReady.set(true);
    }, 10000);
  }

  addSampleNode() {
    const center = { x: window.innerWidth / 2 - 120, y: window.innerHeight / 2 - 60 };
    this.store.addNode('input', center);
  }

  @HostListener('document:keydown.control.z', ['$event'])
  @HostListener('document:keydown.meta.z', ['$event'])
  onUndo(event: Event) {
    event.preventDefault();
    this.store.undo();
  }

  @HostListener('document:keydown.control.shift.z', ['$event'])
  @HostListener('document:keydown.meta.shift.z', ['$event'])
  @HostListener('document:keydown.control.y', ['$event'])
  @HostListener('document:keydown.meta.y', ['$event'])
  onRedo(event: Event) {
    event.preventDefault();
    this.store.redo();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const type = event.dataTransfer?.getData('text/plain');
    if (type) {
      const container = this.editorContainer()?.nativeElement;
      const rect = container?.getBoundingClientRect();
      const pos = rect
        ? {
            x: event.clientX - rect.left - 120,
            y: event.clientY - rect.top - 30,
          }
        : { x: 200, y: 200 };
      const nodeDef = this.editorService.addNode(type);
      if (nodeDef) {
        nodeDef.position = pos;
        this.store.addNode(type, pos);
      }
    }
  }

  ngOnDestroy() {
    this.editorService.destroy();
  }
}
