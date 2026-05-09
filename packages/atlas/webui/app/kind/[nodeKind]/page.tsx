import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import type { AtlasRecord } from "@a5c-ai/atlas";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

type SearchParams = {
  page?: string;
  sort?: string;
  q?: string;
  [key: string]: string | string[] | undefined;
};

const PAGE_SIZE = 50;

export const dynamicParams = true;

export default async function KindPage({
  params,
  searchParams,
}: {
  params: Promise<{ nodeKind: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { nodeKind: rawKind } = await params;
  const sp = await searchParams;
  const nodeKind = decodeURIComponent(rawKind);
  const { graph, index } = await getCurrentAtlasView();
  const getDisplayName = (record: AtlasRecord) => graph.getDisplayName(record);
  const def = index.nodeKinds[nodeKind];
  if (!def) notFound();

  const all = Object.values(index.records).filter((record) => record._kind === nodeKind);

  // Build facets from populated string/array attributes
  const facetCandidates = new Map<string, Map<string, number>>();
  for (const r of all) {
    for (const [k, v] of Object.entries(r)) {
      if (k.startsWith("_") || k === "id") continue;
      const ingest = (val: unknown) => {
        if (val == null) return;
        if (typeof val === "string" && val.length < 80) {
          const m = facetCandidates.get(k) ?? new Map<string, number>();
          m.set(val, (m.get(val) ?? 0) + 1);
          facetCandidates.set(k, m);
        }
      };
      if (Array.isArray(v)) v.forEach(ingest);
      else if (typeof v === "string") ingest(v);
      else if (typeof v === "boolean") ingest(String(v));
    }
  }
  const facets = Array.from(facetCandidates.entries())
    .filter(([, m]) => m.size > 1 && m.size < all.length)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 8)
    .map(([key, m]) => ({
      key,
      values: Array.from(m.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12),
    }));

  // Apply filters from searchParams (?attr.X=Y)
  const activeFilters: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(sp)) {
    if (k.startsWith("attr.") && typeof v === "string") {
      activeFilters.push([k.slice(5), v]);
    }
  }
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";

  let filtered = all;
  for (const [fk, fv] of activeFilters) {
    filtered = filtered.filter((r) => {
      const v = (r as Record<string, unknown>)[fk];
      if (typeof v === "string") return v === fv;
      if (Array.isArray(v)) return v.includes(fv);
      if (typeof v === "boolean") return String(v) === fv;
      return false;
    });
  }
  if (q) {
    filtered = filtered.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        getDisplayName(r).toLowerCase().includes(q)
    );
  }

  // Sort
  const sort = sp.sort || "id-asc";
  const sortFn: Record<string, (a: AtlasRecord, b: AtlasRecord) => number> = {
    "id-asc": (a, b) => a.id.localeCompare(b.id),
    "id-desc": (a, b) => b.id.localeCompare(a.id),
    "name-asc": (a, b) => getDisplayName(a).localeCompare(getDisplayName(b)),
    "name-desc": (a, b) => getDisplayName(b).localeCompare(getDisplayName(a)),
  };
  filtered = filtered.slice().sort(sortFn[sort] ?? sortFn["id-asc"]);

  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageRecords = filtered.slice(start, start + PAGE_SIZE);

  // Build URL helpers
  const baseQuery = new URLSearchParams();
  for (const [fk, fv] of activeFilters) baseQuery.set(`attr.${fk}`, fv);
  if (q) baseQuery.set("q", q);
  if (sort) baseQuery.set("sort", sort);
  const buildHref = (overrides: Record<string, string | undefined>) => {
    const u = new URLSearchParams(baseQuery);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) u.delete(k);
      else u.set(k, v);
    }
    const s = u.toString();
    return `/kind/${encodeURIComponent(nodeKind)}${s ? `?${s}` : ""}`;
  };

  const cluster = all[0]?._cluster;
  const facetLinks = facets.slice(0, 4).flatMap((f) =>
    f.values.slice(0, 2).map(([val]) => ({
      label: `${f.key}: ${val}`,
      href: buildHref({ [`attr.${f.key}`]: val, page: undefined }),
    }))
  );

  return (
    <AtlasDocsScaffold
      runningLeft={<><span className="folio">iii</span><span>Node kind</span></>}
      runningTitle={<>Agentic AI Atlas · <em>{nodeKind}</em></>}
      runningRight={<><span>{filtered.length.toLocaleString()} records</span><span>a5c.ai</span></>}
      tocSearchLabel="Search kind facets"
      tocBookLabel="Atlas · node kind"
      tocTitle="Current kind and facets"
      chapters={[
        {
          num: "III.",
          title: nodeKind,
          pages: `pp. ${page} - ${page}`,
          current: true,
          items: [
            { label: `${filtered.length.toLocaleString()} visible`, current: true },
            ...facetLinks,
          ],
        },
      ]}
      chapterMark={{ num: "III.", subtitle: "Node kind ledger", context: nodeKind, readingTime: `Page ${page} of ${totalPages}` }}
      articleTitle={<>{nodeKind} <em>records</em></>}
      lead={def.description ? String(def.description).slice(0, 220) : `Browse all ${nodeKind} records in the current atlas snapshot.`}
      meta={<><span>Cluster · {cluster ?? "—"}</span><span>Total · {all.length.toLocaleString()}</span><span>Visible · {filtered.length.toLocaleString()}</span></>}
      marginSections={[
        {
          title: "Active filters",
          items: activeFilters.length
            ? activeFilters.map(([k, v]) => (
                <Link key={`${k}=${v}`} href={buildHref({ [`attr.${k}`]: undefined, page: undefined })}>
                  {k}: {v}
                </Link>
              ))
            : [<p key="no-filters" className="atlas-docs-note">No active facet filters.</p>],
        },
        {
          title: "Sort",
          items: (["id-asc", "id-desc", "name-asc", "name-desc"] as const).map((s) => (
            <Link key={s} href={buildHref({ sort: s, page: undefined })}>
              {s}
            </Link>
          )),
        },
      ]}
    >
      <div className="atlas-docs-body">
        {activeFilters.length > 0 && (
          <div className="atlas-docs-pillrow atlas-docs-full">
            {activeFilters.map(([k, v]) => (
              <Link key={`${k}=${v}`} href={buildHref({ [`attr.${k}`]: undefined, page: undefined })}>
                <Badge variant="outline">{k}: {v} x</Badge>
              </Link>
            ))}
            <Link href={`/kind/${encodeURIComponent(nodeKind)}`}>clear all</Link>
          </div>
        )}

        {facets.length > 0 && (
          <details
            className="atlas-docs-panel atlas-docs-full"
            open={activeFilters.length > 0}
          >
            <summary
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                fontWeight: 600,
                listStyle: "none",
              }}
            >
              <span>Filters & facets</span>
              <span className="atlas-docs-note">
                {activeFilters.length > 0
                  ? `${activeFilters.length} active · ${facets.length} groups`
                  : `${facets.length} groups`}
              </span>
            </summary>
            <div
              className="atlas-docs-grid atlas-docs-grid--2"
              style={{ marginTop: "1rem" }}
            >
              {facets.map((f) => (
                <div key={f.key} className="atlas-docs-panel">
                  <h3>{f.key}</h3>
                  <div className="atlas-docs-link-list">
                    {f.values.map(([val, count]) => {
                      const active = activeFilters.some(([k, v]) => k === f.key && v === val);
                      return (
                        <Link
                          key={val}
                          href={buildHref({
                            [`attr.${f.key}`]: active ? undefined : val,
                            page: undefined,
                          })}
                          style={{ color: active ? "var(--tk-cinnabar)" : undefined }}
                        >
                          {val} · {count}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="atlas-docs-toolbar atlas-docs-full">
          {( ["id-asc", "id-desc", "name-asc", "name-desc"] as const).map((s) => (
            <Link
              key={s}
              href={buildHref({ sort: s, page: undefined })}
              className={sort === s ? "is-active" : undefined}
            >
              {s}
            </Link>
          ))}
        </div>

        <div className="atlas-docs-ledger atlas-docs-full">
          <table>
            <thead>
              <tr>
                <th>id</th>
                <th>displayName</th>
                <th>cluster</th>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono">
                    <Link
                      href={`/n/${encodeURIComponent(r.id)}`}
                      className="font-mono"
                    >
                      {r.id}
                    </Link>
                  </td>
                  <td className="truncate max-w-[24rem]" style={{ color: 'var(--fg-2)' }}>{getDisplayName(r)}</td>
                  <td style={{ color: 'var(--fg-3)' }}>{r._cluster}</td>
                </tr>
              ))}
              {pageRecords.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center italic" style={{ color: 'var(--fg-3)' }}>
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="atlas-docs-toolbar atlas-docs-full">
            {page > 1 && <Link href={buildHref({ page: String(page - 1) })}>Prev</Link>}
            <span className="atlas-docs-note">Page {page} of {totalPages}</span>
            {page < totalPages && <Link href={buildHref({ page: String(page + 1) })}>Next</Link>}
          </div>
        )}
      </div>
    </AtlasDocsScaffold>
  );
}
