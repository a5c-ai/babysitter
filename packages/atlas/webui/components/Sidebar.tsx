import Link from "next/link";
import { getPublicAtlasGraph } from "@/lib/server/atlas-local";

export function Sidebar() {
  const graph = getPublicAtlasGraph();
  const clusters = graph.getClusters();
  const nodeKinds = graph.getNodeKinds();
  const sortedClusters = Object.entries(clusters).sort(
    (a, b) => b[1].recordCount - a[1].recordCount
  );

  return (
    <aside className="mk-dashboard__rail atlas-sidebar">
      <div className="mk-dashboard__brand atlas-sidebar__brand">
        <strong>a·5·c·ai</strong>
        <span>atlas catalogue</span>
      </div>
      <div className="atlas-sidebar__sections">
        <div className="mk-dashboard__nav-section">
          <small>Core routes</small>
          <Link href="/" className="atlas-rail__link">
            Overview
          </Link>
          <Link href="/wiki" className="atlas-rail__link">
            Wiki folios
          </Link>
          <Link href="/graph" className="atlas-rail__link">
            Graph canvas
          </Link>
          <Link href="/edges" className="atlas-rail__link">
            Edge ledger
          </Link>
        </div>

        <div className="atlas-sidebar__cluster-label">Clusters</div>
        <div className="space-y-4">
          {sortedClusters.map(([cluster, def]) => (
            <div key={cluster}>
              <div
                className="atlas-sidebar__cluster-head"
              >
                <span className="truncate">{cluster}</span>
                <span className="tabular-nums atlas-sidebar__cluster-count">{def.recordCount}</span>
              </div>
              <ul className="space-y-0.5">
                {def.nodeKinds.map((nk) => {
                  const c = nodeKinds[nk]?.count ?? 0;
                  return (
                    <li key={nk}>
                      <Link
                        href={`/kind/${encodeURIComponent(nk)}`}
                        className="atlas-rail__link atlas-rail__link--kind"
                      >
                        <span className="truncate">{nk}</span>
                        <span className="tabular-nums atlas-sidebar__kind-count">{c}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <footer className="atlas-sidebar__footer">
        <strong>{sortedClusters.length.toLocaleString()} clusters</strong>
        <small>Browse Atlas through record ledgers, docs folios, and graph edges.</small>
      </footer>
    </aside>
  );
}
