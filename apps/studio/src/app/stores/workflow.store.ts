import { Injectable, signal, computed } from '@angular/core';
import type { NodeDefinition, EdgeDefinition, LogEntry, WorkflowExecutionResult } from '../shared/types';

export interface WorkflowState {
  id: string | null;
  name: string;
  nodes: NodeDefinition[];
  edges: EdgeDefinition[];
  selectedNodeId: string | null;
  isExecuting: boolean;
  executionLogs: LogEntry[];
  executionResults: WorkflowExecutionResult[];
  nodeStates: Record<string, 'idle' | 'running' | 'success' | 'error'>;
  past: Array<{ nodes: NodeDefinition[]; edges: EdgeDefinition[] }>;
  future: Array<{ nodes: NodeDefinition[]; edges: EdgeDefinition[] }>;
}

let nodeCounter = 0;

@Injectable({ providedIn: 'root' })
export class WorkflowStore {
  private state = signal<WorkflowState>({
    id: null,
    name: 'New Workflow',
    nodes: [],
    edges: [],
    selectedNodeId: null,
    isExecuting: false,
    executionLogs: [],
    executionResults: [],
    nodeStates: {},
    past: [],
    future: [],
  });

  id = computed(() => this.state().id);
  name = computed(() => this.state().name);
  nodes = computed(() => this.state().nodes);
  edges = computed(() => this.state().edges);
  selectedNodeId = computed(() => this.state().selectedNodeId);
  isExecuting = computed(() => this.state().isExecuting);
  executionLogs = computed(() => this.state().executionLogs);
  executionResults = computed(() => this.state().executionResults);
  nodeStates = computed(() => this.state().nodeStates);

  private takeSnapshot() {
    const s = this.state();
    const snapshot = { nodes: [...s.nodes], edges: [...s.edges] };
    const past = [...s.past.slice(-49), snapshot];
    this.state.update(v => ({ ...v, past, future: [] }));
  }

  addNode(type: string, position: { x: number; y: number }) {
    this.takeSnapshot();
    nodeCounter++;
    const id = `${type}_${nodeCounter}`;
    const node: NodeDefinition = {
      id,
      type,
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        type,
        status: 'idle',
      },
    };
    this.state.update(v => ({ ...v, nodes: [...v.nodes, node] }));
  }

  updateNodeData(nodeId: string, updates: Record<string, unknown>) {
    this.state.update(v => ({
      ...v,
      nodes: v.nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
      ),
    }));
  }

  setNodes(nodes: NodeDefinition[] | ((prev: NodeDefinition[]) => NodeDefinition[])) {
    this.state.update(v => ({
      ...v,
      nodes: typeof nodes === 'function' ? nodes(v.nodes) : nodes,
    }));
  }

  setEdges(edges: EdgeDefinition[] | ((prev: EdgeDefinition[]) => EdgeDefinition[])) {
    this.state.update(v => ({
      ...v,
      edges: typeof edges === 'function' ? edges(v.edges) : edges,
    }));
  }

  loadWorkflow(def: { id?: string; name?: string; nodes: NodeDefinition[]; edges: EdgeDefinition[] }) {
    this.state.update(v => ({
      ...v,
      id: def.id ?? null,
      name: def.name ?? 'Imported Workflow',
      nodes: def.nodes,
      edges: def.edges,
      selectedNodeId: null,
      past: [],
      future: [],
      executionLogs: [],
      executionResults: [],
    }));
  }

  setName(name: string) {
    this.state.update(v => ({ ...v, name }));
  }

  setSelectedNodeId(id: string | null) {
    this.state.update(v => ({ ...v, selectedNodeId: id }));
  }

  setExecuting(val: boolean) {
    this.state.update(v => ({ ...v, isExecuting: val }));
  }

  addLog(log: Omit<LogEntry, 'timestamp'>) {
    const entry: LogEntry = { ...log, timestamp: Date.now() };
    this.state.update(v => ({ ...v, executionLogs: [...v.executionLogs, entry] }));
  }

  clearLogs() {
    this.state.update(v => ({ ...v, executionLogs: [] }));
  }

  setNodeState(nodeId: string, status: 'idle' | 'running' | 'success' | 'error') {
    this.state.update(v => ({
      ...v,
      nodeStates: { ...v.nodeStates, [nodeId]: status },
    }));
  }

  clearNodeStates() {
    this.state.update(v => ({ ...v, nodeStates: {} }));
  }

  addExecutionResult(result: WorkflowExecutionResult) {
    this.state.update(v => ({
      ...v,
      executionResults: [...v.executionResults, result],
    }));
  }

  clearExecutionResults() {
    this.state.update(v => ({ ...v, executionResults: [] }));
  }

  undo() {
    const s = this.state();
    if (s.past.length === 0) return;
    const prev = s.past[s.past.length - 1];
    const newPast = s.past.slice(0, -1);
    const newFuture = [{ nodes: s.nodes, edges: s.edges }, ...s.future];
    this.state.update(v => ({
      ...v,
      nodes: prev.nodes,
      edges: prev.edges,
      past: newPast,
      future: newFuture,
    }));
  }

  redo() {
    const s = this.state();
    if (s.future.length === 0) return;
    const next = s.future[0];
    const newFuture = s.future.slice(1);
    const newPast = [...s.past, { nodes: s.nodes, edges: s.edges }];
    this.state.update(v => ({
      ...v,
      nodes: next.nodes,
      edges: next.edges,
      past: newPast,
      future: newFuture,
    }));
  }
}
