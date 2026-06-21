import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { getNodeDef } from "./nodes";
import { api } from "./api";
import { notify } from "./toast";

export type CanvasNode = {
  id: string;
  type: string;
  x: number;
  y: number;
  status?: "idle" | "running" | "success" | "error";
  config?: Record<string, unknown>;
};

export type Connection = { id: string; from: string; to: string; branch?: "true" | "false" };

export type LogEntry = {
  id: string;
  level: "info" | "error" | "llm" | "success" | "debug";
  message: string;
  ts: string;
  nodeId?: string;
};

export type Agent = {
  id: string;
  name: string;
  status: "active" | "inactive";
  budgetUsed: number;
  budgetCap: number;
  address: string;
};

type State = {
  workflowName: string;
  workflowId: string | null;
  deployed: boolean;
  nodes: CanvasNode[];
  connections: Connection[];
  selectedId: string | null;
  logs: LogEntry[];
  running: boolean;
  agents: Agent[];
  selectedAgentId: string | null;
  undoStack: { nodes: CanvasNode[]; connections: Connection[] }[];
  redoStack: { nodes: CanvasNode[]; connections: Connection[] }[];
};

type Action =
  | { type: "rename"; name: string }
  | { type: "add_node"; node: CanvasNode }
  | { type: "move_node"; id: string; x: number; y: number }
  | { type: "remove_node"; id: string }
  | { type: "select"; id: string | null }
  | { type: "connect"; from: string; to: string }
  | { type: "disconnect"; id: string }
  | { type: "set_status"; id: string; status: CanvasNode["status"] }
  | { type: "log"; entry: LogEntry }
  | { type: "clear_logs" }
  | { type: "set_running"; running: boolean }
  | { type: "add_agent"; agent: Agent }
  | { type: "select_agent"; id: string | null }
  | { type: "load_template"; nodes: CanvasNode[]; connections: Connection[]; name: string }
  | { type: "set_workflow_id"; id: string | null }
  | { type: "set_node_output"; id: string; output: string }
  | { type: "set_deployed"; deployed: boolean }
  | { type: "update_node_config"; id: string; config: Record<string, unknown> }
  | { type: "undo" }
  | { type: "redo" };

const initialState: State = {
  workflowName: "New Workflow",
  workflowId: null,
  deployed: false,
  nodes: [],
  connections: [],
  selectedId: null,
  logs: [],
  running: false,
  agents: [],
  selectedAgentId: null,
  undoStack: [],
  redoStack: [],
};

function isAgent(value: any): value is Agent {
  return value && typeof value.id === "string" && typeof value.name === "string" && typeof value.address === "string";
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "rename":
      return { ...state, workflowName: action.name };
    case "add_node": {
      const snapshot = { nodes: state.nodes, connections: state.connections };
      return { ...state, nodes: [...state.nodes, action.node], selectedId: action.node.id, undoStack: [...state.undoStack.slice(-49), snapshot], redoStack: [] };
    }
    case "move_node": {
      const snapshot = { nodes: state.nodes, connections: state.connections };
      return { ...state, nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, x: action.x, y: action.y } : n)), undoStack: [...state.undoStack.slice(-49), snapshot], redoStack: [] };
    }
    case "remove_node": {
      const snapshot = { nodes: state.nodes, connections: state.connections };
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== action.id),
        connections: state.connections.filter((c) => c.from !== action.id && c.to !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        undoStack: [...state.undoStack.slice(-49), snapshot],
        redoStack: [],
      };
    }
    case "select":
      return { ...state, selectedId: action.id };
    case "connect": {
      if (action.from === action.to) return state;
      if (state.connections.some((c) => c.from === action.from && c.to === action.to)) return state;
      const snapshot = { nodes: state.nodes, connections: state.connections };
      return {
        ...state,
        connections: [...state.connections, { id: `c_${Date.now()}`, from: action.from, to: action.to }],
        undoStack: [...state.undoStack.slice(-49), snapshot],
        redoStack: [],
      };
    }
    case "disconnect": {
      const snapshot = { nodes: state.nodes, connections: state.connections };
      return { ...state, connections: state.connections.filter((c) => c.id !== action.id), undoStack: [...state.undoStack.slice(-49), snapshot], redoStack: [] };
    }
    case "set_status":
      return { ...state, nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, status: action.status } : n)) };
    case "log":
      return { ...state, logs: [...state.logs, action.entry].slice(-200) };
    case "clear_logs":
      return { ...state, logs: [] };
    case "set_running":
      return { ...state, running: action.running };
    case "add_agent":
      return { ...state, agents: [...state.agents, action.agent], selectedAgentId: action.agent.id };
    case "select_agent":
      return { ...state, selectedAgentId: action.id };
    case "load_template": {
      const snapshot = { nodes: state.nodes, connections: state.connections };
      return { ...state, nodes: action.nodes, connections: action.connections, workflowName: action.name, selectedId: null, undoStack: [...state.undoStack.slice(-49), snapshot], redoStack: [] };
    }
    case "set_workflow_id":
      return { ...state, workflowId: action.id };
    case "set_node_output":
      return { ...state, nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, config: { ...n.config, output: action.output } } : n)) };
    case "set_deployed":
      return { ...state, deployed: action.deployed };
    case "update_node_config": {
      const snapshot = { nodes: state.nodes, connections: state.connections };
      return { ...state, nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, config: { ...n.config, ...action.config } } : n)), undoStack: [...state.undoStack.slice(-49), snapshot], redoStack: [] };
    }
    case "undo": {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        nodes: prev.nodes,
        connections: prev.connections,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, { nodes: state.nodes, connections: state.connections }],
      };
    }
    case "redo": {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        nodes: next.nodes,
        connections: next.connections,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, { nodes: state.nodes, connections: state.connections }],
      };
    }
    default:
      return state;
  }
}

type Ctx = State & {
  dispatch: React.Dispatch<Action>;
  addNodeOfType: (type: string, x?: number, y?: number) => void;
  runWorkflow: () => void;
  saveWorkflow: () => Promise<void>;
  loadWorkflow: (id: string) => Promise<void>;
};

const WorkflowCtx = createContext<Ctx | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const counter = useRef(0);

  useEffect(() => {
    api.listAgents()
      .then((agents: any[]) => {
        for (const a of agents) {
          if (isAgent(a)) {
            dispatch({ type: "add_agent", agent: a });
          } else {
            const agent: Agent = {
              id: a.id || `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              name: a.name || "Agent",
              status: a.status === "active" ? "active" : "inactive",
              budgetUsed: a.budgetUsed ?? a.budget_used ?? 0,
              budgetCap: a.budgetCap ?? a.budget_cap ?? 0,
              address: a.address || "",
            };
            dispatch({ type: "add_agent", agent });
          }
        }
      })
      .catch(() => {});
  }, []);

  const addNodeOfType = useCallback((type: string, x = 280, y = 180) => {
    const def = getNodeDef(type);
    if (!def) return;
    counter.current += 1;
    const id = `n_${type}_${Date.now()}_${counter.current}`;
    dispatch({ type: "add_node", node: { id, type, x, y, status: "idle" } });
  }, []);

  const runWorkflow = useCallback(() => {
    if (state.running) return;
    dispatch({ type: "set_running", running: true });
    dispatch({ type: "clear_logs" });
    notify.info('Execution started');

    const workflow = {
      id: state.workflowId || `wf_${Date.now()}`,
      name: state.workflowName,
      version: "1.0.0",
      nodes: state.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: n.x, y: n.y },
        data: { ...n.config, label: n.type, type: n.type },
      })),
      edges: state.connections.map((c) => ({
        id: c.id,
        source: c.from,
        target: c.to,
        sourceHandle: c.branch || undefined,
      })),
    };

    api.streamExecute(workflow, "Start the mission.", (event) => {
      const ts = () => new Date().toTimeString().slice(0, 8);
      switch (event.type) {
        case "node:start":
          dispatch({ type: "set_status", id: event.nodeId!, status: "running" });
          dispatch({ type: "log", entry: { id: `l_${Date.now()}`, level: "info", message: `Node started: ${event.nodeLabel}`, ts: ts(), nodeId: event.nodeId! } });
          break;
        case "node:complete":
          dispatch({ type: "set_status", id: event.nodeId!, status: "success" });
          dispatch({ type: "log", entry: { id: `l_${Date.now()}`, level: "llm", message: event.output?.slice(0, 200) || "", ts: ts(), nodeId: event.nodeId! } });
          dispatch({ type: "set_node_output", id: event.nodeId!, output: event.output || "" });
          break;
        case "node:error":
          dispatch({ type: "set_status", id: event.nodeId!, status: "error" });
          dispatch({ type: "log", entry: { id: `l_${Date.now()}`, level: "error", message: event.error || "Error", ts: ts(), nodeId: event.nodeId! } });
          notify.error('Execution failed: ' + (event.error || 'Unknown error'));
          break;
        case "workflow:complete":
          dispatch({ type: "set_running", running: false });
          dispatch({ type: "log", entry: { id: `l_${Date.now()}`, level: "success", message: "Workflow completed.", ts: ts() } });
          notify.success('Workflow completed');
          break;
      }
    });
  }, [state.nodes, state.connections, state.running, state.workflowId, state.workflowName]);

  const saveWorkflow = useCallback(async () => {
    const workflow = {
      id: state.workflowId || `wf_${Date.now()}`,
      name: state.workflowName,
      version: "1.0.0",
      nodes: state.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: n.x, y: n.y },
        data: { ...n.config, label: n.type, type: n.type },
      })),
      edges: state.connections.map((c) => ({
        id: c.id,
        source: c.from,
        target: c.to,
        sourceHandle: c.branch || undefined,
      })),
    };
    const saved = await api.saveWorkflow(workflow);
    dispatch({ type: "set_workflow_id", id: saved.id });
    dispatch({ type: "log", entry: { id: `l_${Date.now()}`, level: "success", message: "Workflow saved.", ts: new Date().toTimeString().slice(0, 8) } });
    notify.success('Workflow saved');
  }, [state.nodes, state.connections, state.workflowId, state.workflowName]);

  const loadWorkflow = useCallback(async (id: string) => {
    const wf = await api.getWorkflow(id);
    const def = wf.definition || wf;
    const nodes: CanvasNode[] = (def.nodes || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      x: n.position?.x ?? n.x ?? 280,
      y: n.position?.y ?? n.y ?? 180,
      status: "idle" as const,
      config: n.data || {},
    }));
    const connections: Connection[] = (def.edges || []).map((e: any) => ({
      id: e.id,
      from: e.source,
      to: e.target,
      branch: e.sourceHandle || undefined,
    }));
    dispatch({ type: "load_template", nodes, connections, name: def.name || "Imported Workflow" });
    dispatch({ type: "set_workflow_id", id });
  }, []);

  const value = useMemo<Ctx>(() => ({ ...state, dispatch, addNodeOfType, runWorkflow, saveWorkflow, loadWorkflow }), [state, addNodeOfType, runWorkflow, saveWorkflow, loadWorkflow]);

  return <WorkflowCtx.Provider value={value}>{children}</WorkflowCtx.Provider>;
}

export function useWorkflow() {
  const ctx = useContext(WorkflowCtx);
  if (!ctx) throw new Error("useWorkflow must be inside WorkflowProvider");
  return ctx;
}
