import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Loader2, Check, X, Plus } from "lucide-react";
import { getNodeDef } from "@/lib/nodes";
import { useWorkflow, type CanvasNode } from "@/lib/workflow-context";

const NODE_W = 220;
const NODE_H = 84;

export function EditorCanvas({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { nodes, connections, selectedId, dispatch, addNodeOfType } = useWorkflow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const screenToCanvas = useCallback(
    (sx: number, sy: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: sx, y: sy };
      return { x: (sx - rect.left - view.x) / view.k, y: (sy - rect.top - view.y) / view.k };
    },
    [view],
  );

  const isDragging = useRef(false);

  const onCanvasPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (isDragging.current) return;
    setPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    (e.target as Element).setPointerCapture(e.pointerId);
    dispatch({ type: "select", id: null });
    setPendingFrom(null);
  };
  const onCanvasPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (panning && panStart.current) {
      setView((v) => ({ ...v, x: panStart.current!.vx + (e.clientX - panStart.current!.x), y: panStart.current!.vy + (e.clientY - panStart.current!.y) }));
    }
    if (pendingFrom) {
      const p = screenToCanvas(e.clientX, e.clientY);
      setCursor(p);
    }
    if (draggingNode) {
      const p = screenToCanvas(e.clientX, e.clientY);
      dispatch({ type: "move_node", id: draggingNode, x: p.x - dragOffset.current.x, y: p.y - dragOffset.current.y });
    }
  };
  const onCanvasPointerUp = () => {
    setPanning(false);
    panStart.current = null;
    setDraggingNode(null);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setView((v) => {
      const k = Math.min(2, Math.max(0.4, v.k + delta));
      return { ...v, k };
    });
  };
  // suppress browser scroll on canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, []);

  const startConnect = (id: string) => {
    setPendingFrom(id);
  };
  const finishConnect = (id: string) => {
    if (pendingFrom && pendingFrom !== id) {
      dispatch({ type: "connect", from: pendingFrom, to: id });
    }
    setPendingFrom(null);
    setCursor(null);
  };

  const onDropNode = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/node-type");
    if (!type) return;
    const p = screenToCanvas(e.clientX, e.clientY);
    addNodeOfType(type, p.x - NODE_W / 2, p.y - NODE_H / 2);
  };

  const startDragNode = (e: ReactPointerEvent, n: CanvasNode) => {
    e.stopPropagation();
    dispatch({ type: "select", id: n.id });
    const p = screenToCanvas(e.clientX, e.clientY);
    dragOffset.current = { x: p.x - n.x, y: p.y - n.y };
    setDraggingNode(n.id);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const isEmpty = nodes.length === 0;

  return (
    <div
      ref={containerRef}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
      onPointerLeave={onCanvasPointerUp}
      onWheel={onWheel}
      onDragOver={(e) => { e.preventDefault(); isDragging.current = true; }}
      onDrop={(e) => { isDragging.current = false; onDropNode(e); }}
      onDragLeave={() => { isDragging.current = false; }}
      className="canvas-grid relative flex-1 overflow-hidden bg-surface-dim"
      style={{ cursor: panning ? "grabbing" : "default" }}
    >
      {/* zoom level badge */}
      <div className="pointer-events-none absolute right-4 top-4 z-20 flex items-center gap-2 rounded-md border border-border bg-surface-container/80 px-2 py-1 text-[10px] font-mono text-muted-foreground backdrop-blur">
        {(view.k * 100).toFixed(0)}%
      </div>

      {/* Cmd+K hint */}
      <button
        onClick={onOpenPalette}
        className="absolute bottom-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-container/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur hover:text-foreground"
      >
        <kbd className="rounded bg-surface-high px-1 font-mono text-[10px]">⌘K</kbd>
        Add nodes
      </button>

      {/* World transform */}
      <div
        className="absolute inset-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
      >
        {/* Wires */}
        <svg className="pointer-events-none absolute" style={{ overflow: "visible", width: 1, height: 1 }}>
          {connections.map((c) => {
            const from = nodes.find((n) => n.id === c.from);
            const to = nodes.find((n) => n.id === c.to);
            if (!from || !to) return null;
            const x1 = from.x + NODE_W;
            const y1 = from.y + NODE_H / 2;
            const x2 = to.x;
            const y2 = to.y + NODE_H / 2;
            return <Wire key={c.id} x1={x1} y1={y1} x2={x2} y2={y2} animated={from.status === "running" || from.status === "success"} />;
          })}
          {pendingFrom && cursor && (() => {
            const from = nodes.find((n) => n.id === pendingFrom);
            if (!from) return null;
            return <Wire x1={from.x + NODE_W} y1={from.y + NODE_H / 2} x2={cursor.x} y2={cursor.y} dashed />;
          })()}
        </svg>

        {/* Nodes */}
        {nodes.map((n) => (
          <NodeView
            key={n.id}
            node={n}
            selected={selectedId === n.id}
            pendingFrom={pendingFrom}
            onPointerDown={(e) => startDragNode(e, n)}
            onStartConnect={() => startConnect(n.id)}
            onFinishConnect={() => finishConnect(n.id)}
            onDelete={() => dispatch({ type: "remove_node", id: n.id })}
          />
        ))}
      </div>

      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="pointer-events-auto text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Plus className="h-7 w-7" />
            </div>
            <h2 className="font-display text-lg font-semibold">Build Your Workflow</h2>
            <p className="mt-1 text-sm text-muted-foreground">Drag nodes from the sidebar, or press ⌘K to add nodes.</p>
            <button
              onClick={onOpenPalette}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add First Node
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NodeView({
  node,
  selected,
  pendingFrom,
  onPointerDown,
  onStartConnect,
  onFinishConnect,
  onDelete,
}: {
  node: CanvasNode;
  selected: boolean;
  pendingFrom: string | null;
  onPointerDown: (e: ReactPointerEvent) => void;
  onStartConnect: () => void;
  onFinishConnect: () => void;
  onDelete: () => void;
}) {
  const def = getNodeDef(node.type);
  if (!def) return null;
  const Icon = def.icon;
  const isConnecting = pendingFrom && pendingFrom !== node.id;

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        left: node.x,
        top: node.y,
        width: NODE_W,
        boxShadow: selected
          ? "var(--shadow-selected)"
          : node.status === "running"
            ? "var(--shadow-running)"
            : "var(--shadow-card)",
      }}
      className={`group absolute select-none rounded-lg border bg-card transition ${
        selected ? "border-primary" : node.status === "error" ? "border-danger/60" : node.status === "success" ? "border-success/50" : "border-border"
      }`}
    >
      {/* category color stripe */}
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-lg" style={{ background: def.color }} />

      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded" style={{ background: `${def.color}26`, color: def.color }}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="truncate text-[13px] font-semibold">{def.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {node.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          {node.status === "success" && <Check className="h-3.5 w-3.5 text-success" />}
          {node.status === "error" && <X className="h-3.5 w-3.5 text-danger" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="hidden h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-danger/10 hover:text-danger group-hover:flex"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="px-3 pb-2.5 pt-1.5">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ background: `${def.color}1f`, color: def.color }}
        >
          {def.badge}
        </span>
        <span className="ml-2 font-mono text-[10px] text-muted-foreground">{node.type}</span>
      </div>

      {/* sockets */}
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          if (pendingFrom) onFinishConnect();
        }}
        className={`absolute -left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-card transition ${
          isConnecting ? "bg-success" : "bg-muted-foreground"
        }`}
        title="Input"
      />
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartConnect();
        }}
        className="absolute -right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-card bg-primary transition hover:scale-110"
        title="Output"
      />
    </div>
  );
}

function Wire({ x1, y1, x2, y2, animated, dashed }: { x1: number; y1: number; x2: number; y2: number; animated?: boolean; dashed?: boolean }) {
  const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
  const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={dashed ? "var(--muted-foreground)" : animated ? "var(--success)" : "var(--primary)"}
      strokeWidth={2}
      strokeDasharray={dashed ? "6 4" : animated ? "8 4" : undefined}
      style={animated ? { animation: "wire-flow 0.6s linear infinite" } : undefined}
    />
  );
}