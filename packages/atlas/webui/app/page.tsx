import Link from "next/link";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export default async function Home() {
  const { index } = await getCurrentAtlasView();
  const stats = index.stats;
  const clusters = index.clusters;
  const nodeKinds = index.nodeKinds;
  const pageCount = nodeKinds.Page?.count ?? 0;

  const sortedClusters = Object.entries(clusters).sort(
    (a, b) => b[1].recordCount - a[1].recordCount
  );
  const topClusters = sortedClusters.slice(0, 6);
  const clusterId = (cluster: string) => `cluster-${cluster.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <AtlasDocsScaffold
      runningLeft={
        <>
          <span className="folio">i</span>
          <span>Overview</span>
        </>
      }
      runningTitle={
        <>
          Agentic AI Atlas · <em>catalog</em>
        </>
      }
      runningRight={
        <>
          <span>{stats.totalRecords.toLocaleString()} records</span>
          <span>a5c.ai</span>
        </>
      }
      tocSearchLabel="Search the atlas"
      tocBookLabel="Atlas · overview"
      tocTitle="Clusters and node kinds"
      chapters={[
        {
          num: "I.",
          title: "Catalog overview",
          pages: "pp. 1 - 1",
          current: true,
          items: [
            { label: "Atlas catalog", current: true },
            ...topClusters.map(([cluster]) => ({
              label: cluster,
              href: `#${clusterId(cluster)}`,
            })),
          ],
        },
      ]}
      chapterMark={{
        num: "I.",
        subtitle: "Atlas catalog",
        context: "Overview",
        readingTime: "Index · live",
      }}
      articleTitle={
        <>
          Agentic AI Atlas <em>overview</em>
        </>
      }
      lead={`Browse ${stats.totalRecords.toLocaleString()} records across ${stats.totalNodeKinds} node kinds and ${stats.totalEdgeKinds} edge kinds.`}
      meta={
        <>
          <span>Clusters · {stats.totalClusters}</span>
          <span>Wiki pages · {pageCount}</span>
          <span>Read-only atlas index</span>
        </>
      }
      marginSections={[
        {
          title: "Quick routes",
          items: [
            <Link key="search" href="/search">Search records</Link>,
            <Link key="graph" href="/graph">Open graph explorer</Link>,
            <Link key="edges" href="/edges">Browse edge kinds</Link>,
            <Link key="wiki" href="/wiki">Open wiki</Link>,
          ],
        },
        {
          title: "Coverage",
          items: [
            <p key="records" className="atlas-docs-note">Records · {stats.totalRecords.toLocaleString()}</p>,
            <p key="kinds" className="atlas-docs-note">NodeKinds · {stats.totalNodeKinds.toLocaleString()}</p>,
            <p key="edgeKinds" className="atlas-docs-note">EdgeKinds · {stats.totalEdgeKinds.toLocaleString()}</p>,
          ],
        },
      ]}
    >
      <div className="atlas-docs-body">
        <div className="atlas-docs-kpis atlas-docs-full">
          <StatCard label="Records" value={stats.totalRecords} />
          <StatCard label="NodeKinds" value={stats.totalNodeKinds} />
          <StatCard label="EdgeKinds" value={stats.totalEdgeKinds} />
          <StatCard label="Clusters" value={stats.totalClusters} />
          <StatCard label="Wiki Pages" value={pageCount} />
        </div>

        {sortedClusters.map(([cluster, def]) => (
          <section key={cluster} id={clusterId(cluster)} className="atlas-docs-full atlas-docs-stack">
            <div>
              <h3>{cluster}</h3>
              <p className="atlas-docs-note">{def.recordCount.toLocaleString()} records across {def.nodeKinds.length} node kinds.</p>
            </div>
            <div className="atlas-docs-grid atlas-docs-grid--3">
              {def.nodeKinds.map((nk) => {
                const def_ = nodeKinds[nk];
                const samples = Object.values(index.records).filter((record) => record._kind === nk).slice(0, 3);
                return (
                  <Card key={nk} className="transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm">
                          <Link href={`/kind/${encodeURIComponent(nk)}`} className="hover:underline" style={{ color: 'var(--brass)' }}>
                            {nk}
                          </Link>
                        </CardTitle>
                        <Badge variant="secondary">{def_?.count ?? 0}</Badge>
                      </div>
                      {def_?.description ? (
                        <CardDescription className="line-clamp-2 text-xs">
                          {String(def_.description).slice(0, 140)}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-1">
                        {samples.map((r) => (
                          <li key={r.id} className="text-xs">
                            <Link
                              href={`/n/${encodeURIComponent(r.id)}`}
                              className="hover:underline truncate block transition-colors"
                              style={{ color: 'var(--fg-3)' }}
                            >
                              {r.id}
                            </Link>
                          </li>
                        ))}
                        {samples.length === 0 && (
                          <li className="text-xs italic" style={{ color: 'var(--fg-3)' }}>No records</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}

        <footer className="atlas-docs-full text-xs pt-4" style={{ borderTop: '1px solid var(--rule)', color: 'var(--fg-3)' }}>
          Read-only. Graph data, SDK, CLI, and wiki pages are served from{" "}
          <code className="font-mono px-1 py-0.5 rounded" style={{ background: 'var(--bg-2)' }}>@a5c-ai/atlas</code>.
        </footer>
      </div>
    </AtlasDocsScaffold>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="atlas-docs-kpi">
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </div>
  );
}
