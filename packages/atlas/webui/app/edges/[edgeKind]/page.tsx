import Link from "next/link";
import { notFound } from "next/navigation";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

const PAGE_SIZE = 100;

export const dynamicParams = true;

export default async function EdgeKindPage({
  params,
  searchParams,
}: {
  params: Promise<{ edgeKind: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { edgeKind: rawKind } = await params;
  const sp = await searchParams;
  const edgeKind = decodeURIComponent(rawKind);
  const { graph, index } = await getCurrentAtlasView();
  const def = index.edgeKinds[edgeKind];
  if (!def) notFound();

  const all = Array.from(
    new Map(
      index.edges
        .filter((e) => e.kind === edgeKind)
        .map((e) => [`${e.from}|${e.to}|${e.kind}`, e] as const)
    ).values()
  );
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const slice = all.slice(start, start + PAGE_SIZE);
  const sourceKinds = Array.isArray(def.source) ? def.source.join(", ") : def.source ?? "—";
  const targetKinds = Array.isArray(def.target) ? def.target.join(", ") : def.target ?? "—";

  return (
    <AtlasDocsScaffold
      runningLeft={<><span className="folio">iv</span><span>Edge detail</span></>}
      runningTitle={<>Agentic AI Atlas · <em>{edgeKind}</em></>}
      runningRight={<><span>{all.length.toLocaleString()} pairs</span><span>a5c.ai</span></>}
      tocSearchLabel="Search edge kinds"
      tocBookLabel="Atlas · edge detail"
      tocTitle="Current ledger and paging"
      chapters={[
        {
          num: "IV.",
          title: "Current edge kind",
          pages: `pp. ${page} - ${page}`,
          current: true,
          items: [
            { label: edgeKind, current: true },
            ...(page > 1 ? [{ label: "Prev page", href: `/edges/${encodeURIComponent(edgeKind)}?page=${page - 1}` }] : []),
            ...(page < totalPages ? [{ label: "Next page", href: `/edges/${encodeURIComponent(edgeKind)}?page=${page + 1}` }] : []),
          ],
        },
      ]}
      chapterMark={{ num: "IV.", subtitle: "Edge detail", context: edgeKind, readingTime: `Page ${page} of ${totalPages}` }}
      articleTitle={<><span className="font-mono">{edgeKind}</span> <em>ledger</em></>}
      lead={def.description ? String(def.description).slice(0, 220) : `Inspect every wired pair currently using ${edgeKind}.`}
      meta={<><span>Pairs · {all.length.toLocaleString()}</span>{def.cardinality ? <span>Cardinality · {def.cardinality}</span> : null}</>}
      marginSections={[
        {
          title: "Definition",
          items: [
            <p key="source" className="atlas-docs-note">Source · {sourceKinds}</p>,
            <p key="target" className="atlas-docs-note">Target · {targetKinds}</p>,
            <p key="cardinality" className="atlas-docs-note">Cardinality · {def.cardinality ?? "—"}</p>,
          ],
        },
        {
          title: "Navigate",
          items: [
            <Link key="all-edges" href="/edges">Back to edge kinds</Link>,
            <Link key="graph" href={`/graph?edgeKinds=${encodeURIComponent(edgeKind)}`}>Open filtered graph</Link>,
          ],
        },
      ]}
    >
      <div className="atlas-docs-body">
        <div className="atlas-docs-ledger atlas-docs-full">
          <table>
            <thead>
              <tr>
                <th>from</th>
                <th>to</th>
                <th>to kind</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((e, i) => {
                const fromRec = graph.getRecord(e.from);
                const toRec = graph.getRecord(e.to);
                return (
                  <tr key={i}>
                    <td className="font-mono">
                      <Link
                        href={`/n/${encodeURIComponent(e.from)}`}
                        className="font-mono"
                        title={fromRec ? graph.getDisplayName(fromRec) : ""}
                      >
                        {e.from}
                      </Link>
                    </td>
                    <td className="font-mono">
                      <Link
                        href={`/n/${encodeURIComponent(e.to)}`}
                        className="font-mono"
                        title={toRec ? graph.getDisplayName(toRec) : ""}
                      >
                        {e.to}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--fg-3)' }}>{toRec?._kind ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="atlas-docs-toolbar atlas-docs-full">
            {page > 1 && (
              <Link href={`/edges/${encodeURIComponent(edgeKind)}?page=${page - 1}`}>Prev</Link>
            )}
            <span className="atlas-docs-note">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link href={`/edges/${encodeURIComponent(edgeKind)}?page=${page + 1}`}>Next</Link>
            )}
          </div>
        )}
      </div>
    </AtlasDocsScaffold>
  );
}
