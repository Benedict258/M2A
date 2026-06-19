import { Injectable, signal, inject, Injector } from '@angular/core';
import type { NodeDefinition } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class EditorService {
  private reteEditor: any = null;
  private reteArea: any = null;
  private injector = inject(Injector);

  isReady = signal(false);

  get editor() { return this.reteEditor; }
  get area() { return this.reteArea; }

  async createEditor(container: HTMLElement): Promise<void> {
    try {
      const { NodeEditor } = await import('rete');
      const { AreaPlugin } = await import('rete-area-plugin');
      const { ConnectionPlugin, Presets: ConnectionPresets } = await import('rete-connection-plugin');
      const { AngularPlugin, Presets: AngularPresets } = await import('rete-angular-plugin/19');

      const editor = new NodeEditor();
      const area = new AreaPlugin<{ Node: any; Connection: any }, any>(container);
      const connection = new ConnectionPlugin();
      const angular = new AngularPlugin({ injector: this.injector });

      editor.use(area);
      editor.use(connection as any);
      editor.use(angular as any);

      (connection as any).addPreset(ConnectionPresets.classic.setup());
      (angular as any).addPreset(AngularPresets.classic.setup());

      this.reteEditor = editor;
      this.reteArea = area;
      this.isReady.set(true);

      this.tryAddMinimap();
      this.tryAddContextMenu();
    } catch (err) {
      console.error('Failed to initialize Rete editor:', err);
      this.isReady.set(true);
    }
  }

  private async tryAddContextMenu() {
    try {
      const { ContextMenuPlugin } = await import('rete-context-menu-plugin');
      const cm = new ContextMenuPlugin({
        items: (nodeId?: string) => {
          const items: any[] = [
            { label: 'Input Trigger', handler: () => this.addNode('input') },
            { label: 'M2A Agent', handler: () => this.addNode('agent') },
            { label: 'Final Output', handler: () => this.addNode('output') },
            { label: 'Walrus Storage', handler: () => this.addNode('walrus') },
            { label: 'Sui Network', handler: () => this.addNode('sui') },
          ];
          if (nodeId) {
            items.push({ type: 'divider' }, { label: 'Delete', handler: () => this.removeNode(nodeId) });
          }
          return items;
        },
        searchBar: true,
      } as any);
      this.reteEditor.use(cm);
    } catch {
      // context menu not available
    }
  }

  private async tryAddMinimap() {
    try {
      const { MinimapPlugin } = await import('rete-minimap-plugin');
      const minimap = new MinimapPlugin();
      this.reteArea?.use(minimap);
    } catch {
      // minimap not available
    }
  }

  async autoArrange() {
    if (!this.reteEditor) return;
    try {
      const { AutoArrangePlugin } = await import('rete-auto-arrange-plugin');
      const arrange = new AutoArrangePlugin();
      this.reteEditor.use(arrange);
      await (arrange as any).layout();
    } catch {
      // auto-arrange not available
    }
  }

  addNode(type: string): NodeDefinition | null {
    if (!this.reteEditor) return null;
    const container = this.reteArea?.container;
    const pos = container
      ? { x: container.clientWidth / 2 - 120, y: container.clientHeight / 2 - 60 }
      : { x: 200, y: 200 };

    const id = `${type}_${Date.now()}`;
    return {
      id,
      type,
      position: pos,
      data: { label: type.charAt(0).toUpperCase() + type.slice(1), type, status: 'idle' },
    };
  }

  removeNode(nodeId: string) {
    if (!this.reteEditor) return;
    try {
      const node = this.reteEditor.getNode(nodeId);
      if (node) this.reteEditor.removeNode(node);
    } catch {}
  }

  destroy() {
    if (this.reteEditor) {
      try { this.reteEditor.destroy(); } catch {}
    }
    this.reteEditor = null;
    this.reteArea = null;
    this.isReady.set(false);
  }
}
