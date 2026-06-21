import { useState } from "react";
import { Settings2 } from "lucide-react";
import { getNodeDef, type ConfigField } from "@/lib/nodes";
import { useWorkflow } from "@/lib/workflow-context";
import { ErrorBoundary } from "@/lib/error-boundary";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Inspector() {
  const { selectedId, nodes, dispatch } = useWorkflow();
  const node = nodes.find((n) => n.id === selectedId);

  if (!node) {
    return (
      <ErrorBoundary>
      <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-surface lg:flex">
        <Header subtitle="No selection" />
        <div className="grid flex-1 place-items-center px-6 text-center text-xs text-muted-foreground">
          Select a node on the canvas to view its inspector.
        </div>
      </aside>
      </ErrorBoundary>
    );
  }

  const def = getNodeDef(node.type);
  if (!def) {
    return (
      <ErrorBoundary>
      <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-surface lg:flex">
        <Header subtitle="Unknown" />
        <div className="grid flex-1 place-items-center px-6 text-center text-xs text-muted-foreground">
          Unknown node type.
        </div>
      </aside>
      </ErrorBoundary>
    );
  }

  if (def.fields && def.fields.length > 0) {
    return (
      <ErrorBoundary>
      <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-surface lg:flex">
        <Header subtitle={def.label} />
        <ConfigForm
          fields={def.fields}
          node={node}
          onApply={(data) => dispatch({ type: "update_node_config", id: node.id, config: data })}
        />
      </aside>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-surface lg:flex">
      <Header subtitle={def.label} />
      <div className="grid flex-1 place-items-center px-6 text-center text-xs text-muted-foreground">
        No configuration for this node type.
      </div>
    </aside>
    </ErrorBoundary>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
      <Settings2 className="h-4 w-4 text-primary" />
      <span className="text-sm font-semibold">Inspector</span>
      <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
        {subtitle}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

type FormData = Record<string, string | boolean>;

function resolveValue(config: Record<string, unknown> | undefined, field: ConfigField): string | boolean {
  const raw = config?.[field.key];
  if (field.type === "checkbox") {
    return raw === true || raw === "true";
  }
  if (raw !== undefined && raw !== null) {
    return String(raw);
  }
  return field.defaultValue ?? "";
}

function renderField(
  field: ConfigField,
  value: string | boolean,
  onChange: (value: string | boolean) => void,
) {
  switch (field.type) {
    case "text":
    case "number":
    case "password":
      return (
        <Input
          name={field.key}
          type={field.type}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    case "textarea":
      return (
        <Textarea
          name={field.key}
          rows={4}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    case "select":
      return (
        <Select
          value={String(value)}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "checkbox":
      return (
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id={`f_${field.key}`}
            checked={value === true}
            onCheckedChange={(v) => onChange(!!v)}
          />
          <label
            htmlFor={`f_${field.key}`}
            className="cursor-pointer text-sm text-foreground"
          >
            {field.placeholder || field.label}
          </label>
        </div>
      );
  }
}

function ConfigForm({
  fields,
  node,
  onApply,
}: {
  fields: ConfigField[];
  node: { id: string; config?: Record<string, unknown> };
  onApply: (data: Record<string, unknown>) => void;
}) {
  const [data, setData] = useState<FormData>(() => {
    const initial: FormData = {};
    for (const f of fields) {
      initial[f.key] = resolveValue(node.config, f);
    }
    return initial;
  });

  const [dirty, setDirty] = useState(false);

  const update = (key: string, value: string | boolean) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleApply = () => {
    const config: Record<string, unknown> = {};
    for (const f of fields) {
      const val = data[f.key];
      if (f.type === "checkbox") {
        if (val === true) config[f.key] = true;
      } else if (f.type === "number") {
        const str = String(val).trim();
        if (str !== "") config[f.key] = Number(str);
      } else {
        const str = String(val).trim();
        if (str !== "") config[f.key] = str;
      }
    }
    if (Object.keys(config).length > 0) {
      onApply(config);
    }
    setDirty(false);
  };

  return (
    <>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {node.id}
        </div>
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            {renderField(f, data[f.key], (v) => update(f.key, v))}
          </Field>
        ))}
      </div>
      <div className="border-t border-border bg-surface-container/50 px-4 py-3">
        <button
          onClick={handleApply}
          disabled={!dirty}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply Changes
        </button>
      </div>
    </>
  );
}
