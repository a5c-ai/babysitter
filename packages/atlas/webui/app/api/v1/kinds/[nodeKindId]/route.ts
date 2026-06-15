import { NextRequest } from "next/server";
import { jsonResponse, notFound, options, paginate } from "@/lib/api-helpers";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return options();
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ nodeKindId: string }> },
) {
  const { nodeKindId } = await ctx.params;
  const { graph, index } = await getCurrentAtlasView();
  const kinds = index.nodeKinds;
  const def = kinds[nodeKindId];
  if (!def) return notFound(`NodeKind '${nodeKindId}' not found`);

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(
    Math.max(parseInt(sp.get("limit") ?? "50", 10) || 50, 1),
    500,
  );
  const cursor = sp.get("cursor");

  const records = Object.values(index.records).filter((record) => record._kind === nodeKindId).sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const { page, nextCursor } = paginate(records, cursor, limit, (r) => r.id);

  return jsonResponse({
    id: def.name,
    displayName: def.name,
    cluster: def.cluster ?? null,
    schema: def,
    instanceCount: def.count ?? records.length,
    instances: page.map((r) => ({ id: r.id, displayName: graph.getDisplayName(r) })),
    nextCursor,
  });
}
