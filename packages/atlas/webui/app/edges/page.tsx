import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export default async function EdgesIndexPage() {
  const { index } = await getCurrentAtlasView();
  const ek = index.edgeKinds;
  const sorted = Object.values(ek).sort((a, b) => b.count - a.count);

  return (
    <AtlasDocsScaffold
      runningLeft={<><span className="folio">iv</span><span>Edges</span></>}
      runningTitle={<>Agentic AI Atlas · <em>edge kinds</em></>}
      runningRight={<><span>{sorted.length} kinds</span><span>a5c.ai</span></>}
      tocSearchLabel="Search edge kinds"
      tocBookLabel="Atlas · edge index"
      tocTitle="Most used edge kinds"
      chapters={[
        {
          num: "IV.",
          title: "Edge ledger",
          pages: "pp. 1 - 1",
          current: true,
          items: sorted.slice(0, 8).map((k, index) => ({
            label: `${k.name} · ${k.count}`,
            href: `/edges/${encodeURIComponent(k.name)}`,
            current: index === 0 ? undefined : false,
          })),
        },
      ]}
      chapterMark={{ num: "IV.", subtitle: "Edge catalog", context: "All edge kinds", readingTime: "Index · live" }}
      articleTitle={<>Edge kind <em>ledger</em></>}
      lead={`Browse ${sorted.length.toLocaleString()} edge kinds, their domains, and their observed graph counts.`}
      meta={<><span>EdgeKinds · {sorted.length}</span><span>Sorted by usage</span></>}
      marginSections={[
        {
          title: "Quick routes",
          items: [
            <Link key="home" href="/">Atlas overview</Link>,
            <Link key="graph" href="/graph">Graph explorer</Link>,
            <Link key="search" href="/search">Search records</Link>,
          ],
        },
        {
          title: "Notes",
          items: [
            <p key="note-1" className="atlas-docs-note">Counts reflect the current graph snapshot.</p>,
            <p key="note-2" className="atlas-docs-note">Open an edge kind to inspect every connected pair.</p>,
          ],
        },
      ]}
    >
      <div className="atlas-docs-body">
        <div className="atlas-docs-ledger atlas-docs-full">
          <table>
            <thead>
              <tr>
                <th>name</th>
                <th>source</th>
                <th>target</th>
                <th>cardinality</th>
                <th className="text-right">count</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((k) => (
                <tr key={k.name}>
                  <td>
                    <Link
                      href={`/edges/${encodeURIComponent(k.name)}`}
                      className="font-mono"
                    >
                      {k.name}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--fg-3)' }}>
                    {Array.isArray(k.source) ? k.source.join(", ") : k.source ?? "—"}
                  </td>
                  <td style={{ color: 'var(--fg-3)' }}>
                    {Array.isArray(k.target) ? k.target.join(", ") : k.target ?? "—"}
                  </td>
                  <td style={{ color: 'var(--fg-3)' }}>
                    {k.cardinality ? <Badge variant="outline">{k.cardinality}</Badge> : "—"}
                  </td>
                  <td className="text-right tabular-nums" style={{ color: 'var(--brass)' }}>{k.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AtlasDocsScaffold>
  );
}
