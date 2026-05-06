import Link from "next/link";
import { getClusters, getNodeKinds } from "@a5c-ai/atlas";

export function Sidebar() {
  const clusters = getClusters();
  const nodeKinds = getNodeKinds();
  const sortedClusters = Object.entries(clusters).sort(
    (a, b) => b[1].recordCount - a[1].recordCount
  );

  return (
    <aside
      className="w-60 shrink-0 overflow-y-auto"
      style={{
        background: 'var(--ground-ink)',
        borderRight: '1px solid var(--rule)',
      }}
    >
      <div className="p-4">
        <div
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--glyph-fade)' }}
        >
          Clusters
        </div>
        <div className="space-y-4">
          {sortedClusters.map(([cluster, def]) => (
            <div key={cluster}>
              <div
                className="text-xs font-medium px-2 py-1.5 flex items-center justify-between"
                style={{ color: 'var(--glyph-bone)' }}
              >
                <span className="truncate">{cluster}</span>
                <span style={{ color: 'var(--brass)' }} className="tabular-nums">{def.recordCount}</span>
              </div>
              <ul className="space-y-0.5">
                {def.nodeKinds.map((nk) => {
                  const c = nodeKinds[nk]?.count ?? 0;
                  return (
                    <li key={nk}>
                      <Link
                        href={`/kind/${encodeURIComponent(nk)}`}
                        className="sidebar-link flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors"
                        style={{ color: 'var(--glyph-fade)' }}
                      >
                        <span className="truncate">{nk}</span>
                        <span className="tabular-nums" style={{ color: 'var(--glyph-fade)' }}>{c}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
