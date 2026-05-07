import { NextRequest } from "next/server";
import { badRequest, jsonResponse, notFound, options } from "@/lib/api-helpers";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return options();
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const decoded = decodeURIComponent(id);
  const { graph } = await getCurrentAtlasView();
  if (!graph.getRecord(decoded)) return notFound(`record '${decoded}' not found`);

  const sp = req.nextUrl.searchParams;
  const depth = Math.min(
    Math.max(parseInt(sp.get("depth") ?? "1", 10) || 1, 1),
    3,
  );
  const kindFilter = (sp.get("kinds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const edgeFilter = (sp.get("edges") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (Number.isNaN(depth)) return badRequest("invalid depth");

  const visited = new Set<string>([decoded]);
  const edgesOut: { from: string; to: string; kind: string }[] = [];
  const edgesSeen = new Set<string>();
  let frontier = [decoded];

  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const n of frontier) {
      const all = [
        ...graph.getOutgoing(n).map((e) => ({ ...e })),
        ...graph.getIncoming(n).map((e) => ({ ...e })),
      ];
      for (const e of all) {
        if (edgeFilter.length && !edgeFilter.includes(e.kind)) continue;
        const key = `${e.from}|${e.to}|${e.kind}`;
        if (edgesSeen.has(key)) continue;

        const otherId = e.from === n ? e.to : e.from;
        const otherRec = graph.getRecord(otherId);
        if (
          kindFilter.length &&
          otherRec &&
          !kindFilter.includes(otherRec._kind)
        ) {
          continue;
        }
        edgesSeen.add(key);
        edgesOut.push({ from: e.from, to: e.to, kind: e.kind });
        if (!visited.has(otherId)) {
          visited.add(otherId);
          next.push(otherId);
        }
      }
    }
    frontier = next;
  }

  const nodes = Array.from(visited).map((nid) => {
    const r = graph.getRecord(nid);
    return r
      ? {
          id: r.id,
          nodeKind: r._kind,
          displayName: graph.getDisplayName(r),
          cluster: r._cluster,
        }
      : { id: nid, missing: true };
  });

  return jsonResponse({ nodes, edges: edgesOut });
}
