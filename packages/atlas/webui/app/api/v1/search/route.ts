import { NextRequest } from "next/server";
import Fuse from "fuse.js";
import { badRequest, jsonResponse, options } from "@/lib/api-helpers";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export const dynamic = "force-dynamic";

type Doc = {
  id: string;
  _kind: string;
  _cluster: string;
  displayName: string;
  description: string;
};

function fuse(docs: Doc[]): Fuse<Doc> {
  return new Fuse(docs, {
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
}

function snippetOf(doc: Doc, q: string): string {
  const text = doc.description || doc.displayName || doc.id;
  if (!text) return "";
  const lower = text.toLowerCase();
  const needle = q.toLowerCase().split(/\s+/)[0] ?? "";
  const idx = needle ? lower.indexOf(needle) : -1;
  if (idx < 0) return text.slice(0, 160);
  const start = Math.max(0, idx - 60);
  return (start > 0 ? "…" : "") + text.slice(start, start + 160);
}

export async function OPTIONS() {
  return options();
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  if (!q) return badRequest("query parameter 'q' is required");
  const { graph } = await getCurrentAtlasView();
  const docs: Doc[] = graph.getAllRecords().map((r) => {
    const desc = (r as Record<string, unknown>).description;
    return {
      id: r.id,
      _kind: r._kind,
      _cluster: r._cluster,
      displayName: graph.getDisplayName(r),
      description: typeof desc === "string" ? desc : "",
    };
  });

  const kind = sp.get("kind");
  const cluster = sp.get("cluster");
  const limit = Math.min(
    Math.max(parseInt(sp.get("limit") ?? "25", 10) || 25, 1),
    200,
  );
  const offset = Math.max(parseInt(sp.get("offset") ?? "0", 10) || 0, 0);

  const all = fuse(docs).search(q);
  const filtered = all.filter((r) => {
    if (kind && r.item._kind !== kind) return false;
    if (cluster && r.item._cluster !== cluster) return false;
    return true;
  });

  const page = filtered.slice(offset, offset + limit).map((r) => ({
    id: r.item.id,
    nodeKind: r.item._kind,
    displayName: r.item.displayName,
    cluster: r.item._cluster,
    score: r.score ?? 0,
    snippet: snippetOf(r.item, q),
  }));

  return jsonResponse({ total: filtered.length, hits: page });
}
