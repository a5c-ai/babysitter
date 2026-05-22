import Link from "next/link";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import { GraphCanvas } from "@/components/GraphCanvas";
import { Badge } from "@/components/ui/badge";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

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
  const { graph, index } = await getCurrentAtlasView();
  const all = graph.getAllRecords();
  const seed = sp.seed ? decodeURIComponent(sp.seed) : all[0]?.id ?? "";
  const depth = Math.max(1, Math.min(3, parseInt(sp.depth ?? "2", 10) || 2));
  const edgeKindFilter = sp.edgeKinds ? new Set(sp.edgeKinds.split(",").filter(Boolean)) : undefined;
  const nodeKindFilter = sp.nodeKinds ? new Set(sp.nodeKinds.split(",").filter(Boolean)) : undefined;

  const edgeKinds = Object.values(index.edgeKinds)
    .filter((k) => k.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
  const nodeKinds = Object.values(index.nodeKinds)
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
  const activeFilters = [
    ...(edgeKindFilter ? Array.from(edgeKindFilter).map((k) => `e:${k}`) : []),
    ...(nodeKindFilter ? Array.from(nodeKindFilter).map((k) => `n:${k}`) : []),
  ];

  return (
    <AtlasDocsScaffold
      runningLeft={<><span className="folio">v</span><span>Graph</span></>}
      runningTitle={<>Agentic AI Atlas · <em>graph explorer</em></>}
      runningRight={<><span>{seed}</span><span>a5c.ai</span></>}
      tocSearchLabel="Search graph filters"
      tocBookLabel="Atlas · graph"
      tocTitle="Traversal controls"
      chapters={[
        {
          num: "V.",
          title: "Current traversal",
          pages: "pp. 1 - 1",
          current: true,
          items: [
            { label: `Seed · ${seed}`, current: true },
            { label: `Depth · ${depth}`, href: buildHref({ depth: String(depth) }) },
            ...edgeKinds.slice(0, 4).map((k) => ({
              label: k.name,
              href: buildHref({ edgeKinds: k.name }),
            })),
          ],
        },
      ]}
      chapterMark={{ num: "V.", subtitle: "Graph explorer", context: "Traversal", readingTime: `Depth · ${depth}` }}
      articleTitle={<>Graph <em>explorer</em></>}
      lead="Traverse the atlas graph from any seed record, narrowing by edge kinds and node kinds when needed."
      meta={<><span>Seed · {seed}</span><span>Depth · {depth}</span><span>Filters · {activeFilters.length}</span></>}
      marginSections={[
        {
          title: "Active filters",
          items: activeFilters.length
            ? activeFilters.map((f) => <p key={f} className="atlas-docs-note">{f}</p>)
            : [<p key="none" className="atlas-docs-note">No edge or node kind filters applied.</p>],
        },
        {
          title: "Quick routes",
          items: [
            <Link key="reset" href="/graph">Reset explorer</Link>,
            <Link key="search" href="/search">Search for a new seed</Link>,
          ],
        },
      ]}
    >
      <div className="atlas-docs-body">
        <div className="atlas-docs-panel atlas-docs-full">
          <div className="atlas-docs-toolbar">
            {[1, 2, 3].map((d) => (
              <Link
                key={d}
                href={buildHref({ depth: String(d) })}
                className={depth === d ? "is-active" : undefined}
              >
                Depth {d}
              </Link>
            ))}
            <span className="atlas-docs-note">Use <code>?seed=&lt;id&gt;</code> to start anywhere.</span>
          </div>
        </div>

        <div className="atlas-docs-panel atlas-docs-full">
          <p className="atlas-docs-note">Seed</p>
          <p className="font-mono">{seed}</p>
        </div>

        <div className="atlas-docs-full">
          <GraphCanvas
            seed={seed}
            depth={depth}
            edgeKindFilter={edgeKindFilter}
            nodeKindFilter={nodeKindFilter}
          />
        </div>

        <div className="atlas-docs-grid atlas-docs-grid--2 atlas-docs-full">
          <div className="atlas-docs-panel">
            <h3>EdgeKinds</h3>
            <div className="atlas-docs-link-list">
              {edgeKinds.slice(0, 12).map((k) => {
                const active = edgeKindFilter?.has(k.name);
                const next = toggleSet(edgeKindFilter, k.name);
                return (
                  <Link
                    key={k.name}
                    href={buildHref({ edgeKinds: next.size ? Array.from(next).join(",") : undefined })}
                    style={{ color: active ? "var(--tk-cinnabar)" : undefined }}
                  >
                    {k.name} · {k.count}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="atlas-docs-panel">
            <h3>NodeKinds</h3>
            <div className="atlas-docs-link-list">
              {nodeKinds.slice(0, 12).map((k) => {
                const active = nodeKindFilter?.has(k.name);
                const next = toggleSet(nodeKindFilter, k.name);
                return (
                  <Link
                    key={k.name}
                    href={buildHref({ nodeKinds: next.size ? Array.from(next).join(",") : undefined })}
                    style={{ color: active ? "var(--tk-cinnabar)" : undefined }}
                  >
                    {k.name} · {k.count}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="atlas-docs-pillrow atlas-docs-full">
            {edgeKindFilter && Array.from(edgeKindFilter).map((k) => (
              <Badge key={`e-${k}`} variant="outline">e:{k}</Badge>
            ))}
            {nodeKindFilter && Array.from(nodeKindFilter).map((k) => (
              <Badge key={`n-${k}`} variant="outline">n:{k}</Badge>
            ))}
          </div>
        )}
      </div>
    </AtlasDocsScaffold>
  );
}
