import Link from "next/link";
import { getEdgeKinds } from "@a5c-ai/atlas";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function EdgesIndexPage() {
  const ek = getEdgeKinds();
  const sorted = Object.values(ek).sort((a, b) => b.count - a.count);

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "EdgeKinds" }]} />
      <h1 className="text-xl font-semibold mt-2 mb-4" style={{ color: 'var(--fg)' }}>EdgeKinds ({sorted.length})</h1>
      <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--rule)' }}>
        <table className="w-full text-xs">
          <thead className="text-left" style={{ background: 'var(--bg-2)', color: 'var(--fg-2)' }}>
            <tr>
              <th className="px-3 py-2.5 font-medium">name</th>
              <th className="px-3 py-2.5 font-medium">source</th>
              <th className="px-3 py-2.5 font-medium">target</th>
              <th className="px-3 py-2.5 font-medium">cardinality</th>
              <th className="px-3 py-2.5 font-medium text-right">count</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((k) => (
              <tr key={k.name} className="cpd-row-hover transition-colors" style={{ borderTop: '1px solid var(--rule)' }}>
                <td className="px-3 py-2">
                  <Link
                    href={`/edges/${encodeURIComponent(k.name)}`}
                    className="font-mono hover:underline"
                    style={{ color: 'var(--brass)' }}
                  >
                    {k.name}
                  </Link>
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--fg-3)' }}>
                  {Array.isArray(k.source) ? k.source.join(", ") : k.source ?? "—"}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--fg-3)' }}>
                  {Array.isArray(k.target) ? k.target.join(", ") : k.target ?? "—"}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--fg-3)' }}>
                  {k.cardinality ? <Badge variant="outline">{k.cardinality}</Badge> : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--brass)' }}>{k.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
