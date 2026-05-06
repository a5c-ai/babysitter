import Link from "next/link";
import {
  getClusters,
  getNodeKinds,
  getRecordsByKind,
  getStats,
} from "@a5c-ai/atlas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const stats = getStats();
  const clusters = getClusters();
  const nodeKinds = getNodeKinds();
  const pageCount = nodeKinds.Page?.count ?? 0;

  const sortedClusters = Object.entries(clusters).sort(
    (a, b) => b[1].recordCount - a[1].recordCount
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--fg)' }}>Atlas Graph Explorer</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-2)' }}>
          Browse the Atlas catalog: {stats.totalRecords.toLocaleString()} records across{" "}
          {stats.totalNodeKinds} NodeKinds and {stats.totalEdgeKinds} EdgeKinds.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Records" value={stats.totalRecords} />
        <StatCard label="NodeKinds" value={stats.totalNodeKinds} />
        <StatCard label="EdgeKinds" value={stats.totalEdgeKinds} />
        <StatCard label="Clusters" value={stats.totalClusters} />
        <StatCard label="Wiki Pages" value={pageCount} />
      </div>

      <div className="space-y-6">
        {sortedClusters.map(([cluster, def]) => (
          <section key={cluster}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--fg-3)' }}>
              {cluster}
              <span className="ml-2 text-xs font-normal normal-case tracking-normal">
                ({def.recordCount.toLocaleString()} records)
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {def.nodeKinds.map((nk) => {
                const def_ = nodeKinds[nk];
                const samples = getRecordsByKind(nk).slice(0, 3);
                return (
                  <Card key={nk} className="transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
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
      </div>

      <footer className="text-xs pt-4" style={{ borderTop: '1px solid var(--rule)', color: 'var(--fg-3)' }}>
        Read-only. Graph data, SDK, CLI, and wiki pages are served from{" "}
        <code className="font-mono px-1 py-0.5 rounded" style={{ background: 'var(--bg-2)' }}>@a5c-ai/atlas</code>.
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--fg-3)' }}>{label}</div>
        <div className="text-2xl font-semibold tabular-nums mt-1" style={{ color: 'var(--brass)' }}>{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

