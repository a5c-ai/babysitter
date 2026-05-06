"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type SlimRecord = {
  id: string;
  _kind: string;
  _cluster: string;
  displayName: string;
  description: string;
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm" style={{ color: 'var(--fg-3)' }}>Loading...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const initialQ = sp.get("q") ?? "";
  const initialKind = sp.get("kind") ?? "";

  const [q, setQ] = React.useState(initialQ);
  const [kind, setKind] = React.useState(initialKind);
  const [corpus, setCorpus] = React.useState<SlimRecord[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/search-index.json")
      .then((r) => r.json())
      .then((data: SlimRecord[]) => setCorpus(data))
      .catch((e) => setError(String(e)));
  }, []);

  const fuse = React.useMemo(() => {
    if (!corpus) return null;
    return new Fuse(corpus, {
      keys: [
        { name: "id", weight: 0.4 },
        { name: "displayName", weight: 0.3 },
        { name: "description", weight: 0.2 },
        { name: "_kind", weight: 0.1 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
    });
  }, [corpus]);

  const allResults = React.useMemo(() => {
    if (!fuse || !q.trim()) return [];
    return fuse.search(q.trim(), { limit: 200 });
  }, [fuse, q]);

  const kindCounts = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of allResults) {
      m.set(r.item._kind, (m.get(r.item._kind) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [allResults]);

  const filtered = kind ? allResults.filter((r) => r.item._kind === kind) : allResults;
  const top = filtered.slice(0, 100);

  const submit = (newQ: string, newKind?: string) => {
    const u = new URLSearchParams();
    if (newQ) u.set("q", newQ);
    if (newKind) u.set("kind", newKind);
    router.replace(`/search${u.toString() ? `?${u}` : ""}`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>Search</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q, kind);
        }}
      >
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search records by id, name, description, or kind..."
          className="mb-4"
        />
      </form>

      {error && <div className="text-xs" style={{ color: 'var(--accent-cinnabar)' }}>Failed to load index: {error}</div>}
      {!corpus && !error && <div className="text-xs" style={{ color: 'var(--fg-3)' }}>Loading index...</div>}

      {corpus && (
        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 md:col-span-3 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg-3)' }}>
              Filter by NodeKind
            </div>
            <ul className="space-y-px">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setKind("");
                    submit(q, "");
                  }}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded cpd-hover flex justify-between transition-colors ${
                    kind === "" ? "cpd-filter-active" : ""
                  }`}
                  style={kind === "" ? undefined : { color: 'var(--fg)' }}
                >
                  <span>All</span>
                  <span className="tabular-nums" style={{ color: kind === "" ? 'var(--glyph-bone)' : 'var(--fg-3)' }}>{allResults.length}</span>
                </button>
              </li>
              {kindCounts.map(([k, c]) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => {
                      setKind(k);
                      submit(q, k);
                    }}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded cpd-hover flex justify-between transition-colors ${
                      kind === k ? "cpd-filter-active" : ""
                    }`}
                    style={kind === k ? undefined : { color: 'var(--fg)' }}
                  >
                    <span className="truncate">{k}</span>
                    <span className="tabular-nums" style={{ color: kind === k ? 'var(--glyph-bone)' : 'var(--fg-3)' }}>{c}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="col-span-12 md:col-span-9">
            {q.trim() === "" ? (
              <div className="text-sm" style={{ color: 'var(--fg-2)' }}>
                Type a query above. {corpus.length.toLocaleString()} records indexed.
              </div>
            ) : top.length === 0 ? (
              <div className="text-sm italic" style={{ color: 'var(--fg-2)' }}>
                No results for &quot;{q}&quot;.
              </div>
            ) : (
              <ul className="rounded-md" style={{ border: '1px solid var(--rule)' }}>
                {top.map((r, idx) => (
                  <li
                    key={r.item.id}
                    className="px-3 py-2.5 cpd-row-hover transition-colors"
                    style={idx > 0 ? { borderTop: '1px solid var(--rule)' } : undefined}
                  >
                    <Link href={`/n/${encodeURIComponent(r.item.id)}`}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {r.item._kind}
                        </Badge>
                        <span className="font-mono text-sm truncate hover:underline" style={{ color: 'var(--fg)' }}>
                          {r.item.id}
                        </span>
                      </div>
                      {r.item.displayName && r.item.displayName !== r.item.id && (
                        <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--fg-2)' }}>
                          {r.item.displayName}
                        </div>
                      )}
                      {r.item.description && (
                        <div className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--fg-3)' }}>
                          {r.item.description}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
