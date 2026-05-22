import Link from "next/link";
import type { AtlasRecord, Edge } from "@a5c-ai/atlas";
import { Badge } from "@/components/ui/badge";

export function EdgeList({
  edges,
  direction,
  recordsById,
}: {
  edges: Edge[];
  direction: "outgoing" | "incoming";
  recordsById?: Record<string, AtlasRecord>;
}) {
  const getDisplayName = (record: AtlasRecord) => String(record.displayName ?? record.title ?? record.id);
  if (edges.length === 0) {
    return <div className="text-xs italic" style={{ color: 'var(--fg-3)' }}>None.</div>;
  }
  const grouped = new Map<string, Edge[]>();
  for (const e of edges) {
    const arr = grouped.get(e.kind) ?? [];
    arr.push(e);
    grouped.set(e.kind, arr);
  }
  return (
    <div className="space-y-3">
      {Array.from(grouped.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([kind, items]) => (
          <div key={kind} className="rounded-md" style={{ border: '1px solid var(--rule)' }}>
            <div
              className="px-3 py-1.5 flex items-center justify-between"
              style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--rule)' }}
            >
              <Badge variant="outline" className="font-mono">{kind}</Badge>
              <span className="text-xs tabular-nums" style={{ color: 'var(--fg-3)' }}>{items.length}</span>
            </div>
            <ul>
              {items.map((e, i) => {
                const otherId = direction === "outgoing" ? e.to : e.from;
                const other = recordsById?.[otherId];
                return (
                  <li
                    key={i}
                    className="px-3 py-1.5 text-xs flex items-center gap-2 cpd-row-hover transition-colors"
                    style={i > 0 ? { borderTop: '1px solid var(--rule)' } : undefined}
                  >
                    <Link
                      href={`/n/${encodeURIComponent(otherId)}`}
                      className="font-mono hover:underline truncate"
                      style={{ color: 'var(--brass)' }}
                    >
                      {otherId}
                    </Link>
                    {other && (
                      <>
                        <span style={{ color: 'var(--fg-3)' }}>·</span>
                        <span className="truncate" style={{ color: 'var(--fg-3)' }}>{other._kind}</span>
                        {getDisplayName(other) !== other.id && (
                          <span className="truncate" style={{ color: 'var(--fg-2)' }}>{getDisplayName(other)}</span>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
    </div>
  );
}
