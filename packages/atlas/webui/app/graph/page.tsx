import Link from "next/link";
import { getAllRecords, getEdgeKinds, getNodeKinds } from "@a5c-ai/atlas";
import { GraphCanvas } from "@/components/GraphCanvas";
import { Badge } from "@/components/ui/badge";

type SearchParams = {
  seed?: string;
  depth?: string;
  edgeKinds?: string;
  nodeKinds?: string;
};

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const all = getAllRecords();
  const seed = sp.seed ? decodeURIComponent(sp.seed) : all[0]?.id ?? "";
  const depth = Math.max(1, Math.min(3, parseInt(sp.depth ?? "2", 10) || 2));
  const edgeKindFilter = sp.edgeKinds ? new Set(sp.edgeKinds.split(",").filter(Boolean)) : undefined;
  const nodeKindFilter = sp.nodeKinds ? new Set(sp.nodeKinds.split(",").filter(Boolean)) : undefined;

  const edgeKinds = Object.values(getEdgeKinds())
    .filter((k) => k.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
  const nodeKinds = Object.values(getNodeKinds())
    .filter((k) => k.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  const buildHref = (overrides: Partial<SearchParams>) => {
    const u = new URLSearchParams();
    u.set("seed", seed);
    u.set("depth", String(depth));
    if (edgeKindFilter) u.set("edgeKinds", Array.from(edgeKindFilter).join(","));
    if (nodeKindFilter) u.set("nodeKinds", Array.from(nodeKindFilter).join(","));
    for (const [k, v] of Object.entries(overrides)) {
      if (v == null || v === "") u.delete(k);
      else u.set(k, String(v));
    }
    return `/graph?${u.toString()}`;
  };

  const toggleSet = (s: Set<string> | undefined, val: string): Set<string> => {
    const out = new Set(s ?? []);
    if (out.has(val)) out.delete(val);
    else out.add(val);
    return out;
  };

  return (
    <div className="max-w-[120rem] mx-auto">
      <div className="mb-2 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--fg)' }}>Graph Explorer</h1>
        <div className="text-xs" style={{ color: 'var(--fg-3)' }}>
          Use <code className="font-mono px-1 rounded" style={{ background: 'var(--bg-2)' }}>?seed=&lt;id&gt;</code> to start anywhere.
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 md:col-span-3 space-y-4 text-xs">
          <div>
            <div className="font-semibold mb-1" style={{ color: 'var(--fg)' }}>Depth</div>
            <div className="flex gap-1">
              {[1, 2, 3].map((d) => (
                <Link
                  key={d}
                  href={buildHref({ depth: String(d) })}
                  className={`px-2 py-1 rounded cpd-hover transition-colors ${depth === d ? "cpd-filter-active" : ""}`}
                  style={depth === d ? undefined : { border: '1px solid var(--rule)', color: 'var(--fg)' }}
                >
                  {d}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: 'var(--fg)' }}>Seed</div>
            <div className="font-mono break-all p-2 rounded" style={{ border: '1px solid var(--rule)', background: 'var(--bg-2)', color: 'var(--fg)' }}>{seed}</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: 'var(--fg)' }}>EdgeKinds (top 30)</div>
            <ul className="max-h-64 overflow-y-auto space-y-px">
              {edgeKinds.map((k) => {
                const active = edgeKindFilter?.has(k.name);
                const next = toggleSet(edgeKindFilter, k.name);
                return (
                  <li key={k.name}>
                    <Link
                      href={buildHref({
                        edgeKinds: next.size ? Array.from(next).join(",") : undefined,
                      })}
                      className={`flex justify-between px-2 py-1 rounded cpd-hover transition-colors ${active ? "cpd-filter-active" : ""}`}
                    >
                      <span className="truncate">{k.name}</span>
                      <span className="tabular-nums" style={{ color: active ? 'var(--glyph-bone)' : 'var(--fg-3)' }}>{k.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: 'var(--fg)' }}>NodeKinds (top 30)</div>
            <ul className="max-h-64 overflow-y-auto space-y-px">
              {nodeKinds.map((k) => {
                const active = nodeKindFilter?.has(k.name);
                const next = toggleSet(nodeKindFilter, k.name);
                return (
                  <li key={k.name}>
                    <Link
                      href={buildHref({
                        nodeKinds: next.size ? Array.from(next).join(",") : undefined,
                      })}
                      className={`flex justify-between px-2 py-1 rounded cpd-hover transition-colors ${active ? "cpd-filter-active" : ""}`}
                    >
                      <span className="truncate">{k.name}</span>
                      <span className="tabular-nums" style={{ color: active ? 'var(--glyph-bone)' : 'var(--fg-3)' }}>{k.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex flex-wrap gap-1">
            {edgeKindFilter && Array.from(edgeKindFilter).map((k) => (
              <Badge key={`e-${k}`} variant="outline">e:{k}</Badge>
            ))}
            {nodeKindFilter && Array.from(nodeKindFilter).map((k) => (
              <Badge key={`n-${k}`} variant="outline">n:{k}</Badge>
            ))}
          </div>
          <Link href="/graph" className="text-xs underline" style={{ color: 'var(--fg-3)' }}>
            Reset
          </Link>
        </aside>

        <div className="col-span-12 md:col-span-9">
          <GraphCanvas
            seed={seed}
            depth={depth}
            edgeKindFilter={edgeKindFilter}
            nodeKindFilter={nodeKindFilter}
          />
        </div>
      </div>
    </div>
  );
}
