import * as React from "react";
import Link from "next/link";

function isLikelyId(v: string): boolean {
  if (typeof v !== "string") return false;
  if (v.length < 3 || v.length > 200) return false;
  return /^[a-z][a-z0-9-]*:/.test(v);
}

function renderValue(v: unknown, depth = 0): React.ReactNode {
  if (v == null) return <span className="italic" style={{ color: 'var(--fg-3)' }}>null</span>;
  if (typeof v === "boolean") return <span>{String(v)}</span>;
  if (typeof v === "number") return <span className="tabular-nums">{v}</span>;
  if (typeof v === "string") {
    if (isLikelyId(v)) {
      return (
        <Link
          href={`/n/${encodeURIComponent(v)}`}
          className="font-mono text-xs hover:underline"
          style={{ color: 'var(--brass)' }}
        >
          {v}
        </Link>
      );
    }
    return <span className="whitespace-pre-wrap break-words">{v}</span>;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="italic" style={{ color: 'var(--fg-3)' }}>[]</span>;
    return (
      <ul className="space-y-1 list-disc list-inside" style={{ color: 'var(--fg-3)' }}>
        {v.map((item, i) => (
          <li key={i} style={{ color: 'var(--fg)' }}>{renderValue(item, depth + 1)}</li>
        ))}
      </ul>
    );
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    return (
      <div className={`grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 ${depth > 0 ? "pl-3" : ""}`} style={depth > 0 ? { borderLeft: '1px solid var(--rule)' } : undefined}>
        {entries.map(([k, val]) => (
          <React.Fragment key={k}>
            <div className="text-xs font-mono py-0.5" style={{ color: 'var(--fg-3)' }}>{k}</div>
            <div className="text-xs py-0.5">{renderValue(val, depth + 1)}</div>
          </React.Fragment>
        ))}
      </div>
    );
  }
  return <span>{String(v)}</span>;
}

export function AttributeTable({ attributes }: { attributes: Record<string, unknown> }) {
  const entries = Object.entries(attributes).filter(([k]) => !k.startsWith("_") && k !== "id");
  if (entries.length === 0) {
    return <div className="text-xs italic" style={{ color: 'var(--fg-3)' }}>No attributes.</div>;
  }
  return (
    <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
      {entries.map(([k, v]) => (
        <React.Fragment key={k}>
          <div className="font-mono text-xs pt-0.5" style={{ color: 'var(--fg-3)' }}>{k}</div>
          <div className="min-w-0">{renderValue(v)}</div>
        </React.Fragment>
      ))}
    </div>
  );
}
