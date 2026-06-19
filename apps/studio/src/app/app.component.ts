import { Component, signal, computed, viewChild, inject, HostListener, OnInit, ComponentRef, ViewContainerRef } from '@angular/core';
import { HeaderComponent } from './layout/header.component';
import { SidebarComponent } from './layout/sidebar.component';
import { EditorComponent } from './editor/editor.component';
import { NodePanelComponent } from './node-panel/node-panel.component';
import { BottomPanelComponent } from './layout/bottom-panel.component';
import { ActionPaletteComponent } from './layout/action-palette.component';
import { TemplateMarketplaceComponent } from './template-marketplace/marketplace.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';
import { CreateAgentDialogComponent } from './agent-config/create-agent-dialog.component';
import { AgentTopUpDialogComponent } from './agent-config/agent-topup-dialog.component';
import { ApiService } from './shared/api.service';
import { WorkflowStore } from './stores/workflow.store';
import { AgentStore } from './stores/agent.store';
import { AuthStore } from './stores/auth.store';
import { type WorkflowDefinition, type NodeDefinition, type EdgeDefinition, type Agent } from './shared/types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    SidebarComponent,
    EditorComponent,
    NodePanelComponent,
    BottomPanelComponent,
    ActionPaletteComponent,
    TemplateMarketplaceComponent,
    AdminDashboardComponent,
    CreateAgentDialogComponent,
    AgentTopUpDialogComponent,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  api = inject(ApiService);
  store = inject(WorkflowStore);
  agentStore = inject(AgentStore);
  auth = inject(AuthStore);

  sidebarOpen = signal(true);
  showTemplates = signal(false);
  showAdmin = signal(false);
  showCreateAgent = signal(false);
  showTopUp = signal<Agent | null>(null);
  showActionPalette = signal(false);

  workflowName = this.store.name;
  workflowNodes = this.store.nodes;
  workflowEdges = this.store.edges;
  selectedNodeId = this.store.selectedNodeId;
  isExecuting = this.store.isExecuting;
  executionLogs = this.store.executionLogs;
  executionResults = this.store.executionResults;
  nodeStates = this.store.nodeStates;

  selectedNode = computed(() =>
    this.workflowNodes().find(n => n.id === this.selectedNodeId()) ?? null
  );

  editor = viewChild<EditorComponent>('editor');

  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const salt = params.get('salt');
    const address = params.get('address');

    if (token && salt && address) {
      this.auth.completeZkLogin({ token, salt, address }).then(() => {
        window.history.replaceState(null, '', window.location.pathname);
      });
    }

    this.auth.isConnected();
    if (this.auth.isConnected()) {
      this.agentStore.fetchAgents();
    }
  }

  onSelectNode(id: string) {
    this.store.setSelectedNodeId(id);
  }

  onDeselectNode() {
    this.store.setSelectedNodeId(null);
  }

  onWorkflowNameChange(name: string) {
    this.store.setName(name);
  }

  onNodesChange(nodes: NodeDefinition[]) {
    this.store.setNodes(nodes);
  }

  onEdgesChange(edges: EdgeDefinition[]) {
    this.store.setEdges(edges);
  }

  onSidebarClose() {
    this.sidebarOpen.set(false);
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  addNodeToCanvas(type: string) {
    const center = { x: window.innerWidth / 2 - 120, y: window.innerHeight / 2 - 60 };
    const offset = this.workflowNodes().length * 30;
    this.store.addNode(type, { x: center.x + offset, y: center.y + offset });
  }

  loadWorkflow(def: WorkflowDefinition) {
    this.store.loadWorkflow(def);
  }

  updateNodeData(nodeId: string, updates: Record<string, unknown>) {
    this.store.updateNodeData(nodeId, updates);
  }

  async handleRun() {
    this.store.setExecuting(true);
    this.store.clearLogs();
    this.store.clearNodeStates();
    this.store.addLog({ type: 'info', message: 'Starting execution...', nodeId: '', nodeLabel: 'System' });

    try {
      const definition: WorkflowDefinition = {
        id: this.store.id() || 'demo',
        name: this.workflowName(),
        nodes: this.workflowNodes(),
        edges: this.workflowEdges(),
        version: '1.0.0',
      };
      await this.api.executeWorkflow(definition, {});
      this.store.addLog({ type: 'llm', message: 'AI Analysis complete.', nodeId: 'agent_1', nodeLabel: 'Agent' });
      this.store.addLog({ type: 'info', message: 'Pipeline finished.', nodeId: '', nodeLabel: 'System' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.store.addLog({ type: 'error', message: msg, nodeId: '', nodeLabel: 'System' });
    } finally {
      this.store.setExecuting(false);
    }
  }

  async handleExportMCP() {
    const definition: WorkflowDefinition = {
      id: this.store.id() || 'demo',
      name: this.workflowName(),
      nodes: this.workflowNodes(),
      edges: this.workflowEdges(),
      version: '1.0.0',
    };
    try {
      const result = await this.api.exportMCP(definition);
      const json = JSON.stringify(result, null, 2);
      await navigator.clipboard.writeText(json);
      this.store.addLog({ type: 'info', message: 'MCP config copied to clipboard!', nodeId: '', nodeLabel: 'System' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export MCP';
      this.store.addLog({ type: 'error', message: msg, nodeId: '', nodeLabel: 'System' });
    }
  }

  afterCreateAgent() {
    this.showCreateAgent.set(false);
    this.agentStore.fetchAgents();
  }

  @HostListener('document:keydown.meta.k', ['$event'])
  @HostListener('document:keydown.control.k', ['$event'])
  onKeydownK(event: Event) {
    event.preventDefault();
    this.showActionPalette.update(v => !v);
  }
}
