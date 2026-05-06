import Link from "next/link";
import { notFound } from "next/navigation";
import { getEdgeKinds, getIndex, getRecord, getDisplayName } from "@a5c-ai/atlas";
import { Breadcrumbs } from "@/components/Breadcrumbs";

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
  const def = getEdgeKinds()[edgeKind];
  if (!def) notFound();

  const all = getIndex().edges.filter((e) => e.kind === edgeKind);
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const slice = all.slice(start, start + PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "EdgeKinds", href: "/edges" },
          { label: edgeKind },
        ]}
      />
      <h1 className="text-xl font-semibold mt-2 mb-1 font-mono" style={{ color: 'var(--fg)' }}>{edgeKind}</h1>
      {def.description && (
        <p className="text-xs mb-3 max-w-3xl" style={{ color: 'var(--fg-2)' }}>
          {String(def.description).slice(0, 400)}
        </p>
      )}
      <div className="text-xs mb-4" style={{ color: 'var(--fg-3)' }}>
        {all.length.toLocaleString()} wired pair{all.length === 1 ? "" : "s"}
        {def.cardinality ? ` · cardinality ${def.cardinality}` : ""}
      </div>

      <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--rule)' }}>
        <table className="w-full text-xs">
          <thead className="text-left" style={{ background: 'var(--bg-2)', color: 'var(--fg-2)' }}>
            <tr>
              <th className="px-3 py-2.5 font-medium">from</th>
              <th className="px-3 py-2.5 font-medium">to</th>
              <th className="px-3 py-2.5 font-medium">to kind</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((e, i) => {
              const fromRec = getRecord(e.from);
              const toRec = getRecord(e.to);
              return (
                <tr key={i} className="cpd-row-hover transition-colors" style={{ borderTop: '1px solid var(--rule)' }}>
                  <td className="px-3 py-2 font-mono">
                    <Link
                      href={`/n/${encodeURIComponent(e.from)}`}
                      className="hover:underline"
                      style={{ color: 'var(--fg)' }}
                      title={fromRec ? getDisplayName(fromRec) : ""}
                    >
                      {e.from}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono">
                    <Link
                      href={`/n/${encodeURIComponent(e.to)}`}
                      className="hover:underline"
                      style={{ color: 'var(--fg)' }}
                      title={toRec ? getDisplayName(toRec) : ""}
                    >
                      {e.to}
                    </Link>
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--fg-3)' }}>{toRec?._kind ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs">
          <div style={{ color: 'var(--fg-3)' }}>
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/edges/${encodeURIComponent(edgeKind)}?page=${page - 1}`}
                className="px-2 py-1 rounded cpd-hover transition-colors"
                style={{ border: '1px solid var(--rule)', color: 'var(--fg)' }}
              >
                Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/edges/${encodeURIComponent(edgeKind)}?page=${page + 1}`}
                className="px-2 py-1 rounded cpd-hover transition-colors"
                style={{ border: '1px solid var(--rule)', color: 'var(--fg)' }}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
