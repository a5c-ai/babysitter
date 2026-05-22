"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";

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
  const tocKinds = kindCounts.slice(0, 8);

  const submit = (newQ: string, newKind?: string) => {
    const u = new URLSearchParams();
    if (newQ) u.set("q", newQ);
    if (newKind) u.set("kind", newKind);
    router.replace(`/search${u.toString() ? `?${u}` : ""}`);
  };

  return (
    <AtlasDocsScaffold
      runningLeft={<><span className="folio">vi</span><span>Search</span></>}
      runningTitle={<>Agentic AI Atlas · <em>search</em></>}
      runningRight={<><span>{corpus ? `${corpus.length.toLocaleString()} indexed` : "loading"}</span><span>a5c.ai</span></>}
      tocSearchLabel="Search the atlas"
      tocBookLabel="Atlas · search"
      tocTitle="Query and kind filters"
      chapters={[
        {
          num: "VI.",
          title: "Current query",
          pages: "pp. 1 - 1",
          current: true,
          items: [
            { label: q.trim() ? `q: ${q}` : "Ready for a query", current: true },
            { label: "All kinds", href: q ? `/search?q=${encodeURIComponent(q)}` : "/search" },
            ...tocKinds.map(([k]) => ({
              label: k,
              href: q ? `/search?q=${encodeURIComponent(q)}&kind=${encodeURIComponent(k)}` : `/search?kind=${encodeURIComponent(k)}`,
            })),
          ],
        },
      ]}
      chapterMark={{ num: "VI.", subtitle: "Atlas search", context: kind || "All node kinds", readingTime: q.trim() ? `Results · ${top.length}` : "Index · live" }}
      articleTitle={<>Search <em>records</em></>}
      lead={q.trim() ? `Results for "${q}" across atlas records, titles, descriptions, and node kinds.` : "Query the atlas index by id, display name, description, or kind."}
      meta={<><span>Query · {q.trim() || "none"}</span><span>Kind · {kind || "all"}</span><span>Visible · {top.length}</span></>}
      marginSections={[
        {
          title: "Status",
          items: error
            ? [<p key="error" className="atlas-docs-note">Failed to load index: {error}</p>]
            : !corpus
              ? [<p key="loading" className="atlas-docs-note">Loading search index…</p>]
              : [
                  <p key="indexed" className="atlas-docs-note">Indexed · {corpus.length.toLocaleString()} records</p>,
                  <p key="matches" className="atlas-docs-note">Matches · {filtered.length.toLocaleString()}</p>,
                ],
        },
        {
          title: "Quick routes",
          items: [
            <Link key="home" href="/">Atlas overview</Link>,
            <Link key="graph" href="/graph">Graph explorer</Link>,
          ],
        },
      ]}
    >
      <div className="atlas-docs-body">
        <form
          className="atlas-docs-panel atlas-docs-full"
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
          />
        </form>

        {kind && (
          <div className="atlas-docs-pillrow atlas-docs-full">
            <Badge variant="outline">{kind}</Badge>
            <Link href={q ? `/search?q=${encodeURIComponent(q)}` : "/search"}>clear kind filter</Link>
          </div>
        )}

        {corpus && (
          q.trim() === "" ? (
            <div className="atlas-docs-panel atlas-docs-full">
              <p className="atlas-docs-note">Type a query above. {corpus.length.toLocaleString()} records are indexed.</p>
            </div>
          ) : top.length === 0 ? (
            <div className="atlas-docs-panel atlas-docs-full">
              <p className="atlas-docs-note">No results for &quot;{q}&quot;.</p>
            </div>
          ) : (
            <ul className="atlas-docs-ledger atlas-docs-full">
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
          )
        )}
      </div>
    </AtlasDocsScaffold>
  );
}
