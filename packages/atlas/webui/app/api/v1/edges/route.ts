import { jsonResponse, options } from "@/lib/api-helpers";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return options();
}

export async function GET() {
  const { index } = await getCurrentAtlasView();
  const ek = index.edgeKinds;
  const counts = new Map<string, number>();
  for (const e of index.edges) {
    counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
  }
  const toArr = (s: string | string[] | undefined): string[] =>
    !s ? [] : Array.isArray(s) ? s : [s];
  const out = Object.values(ek).map((k) => ({
    id: k.name,
    sourceKinds: toArr(k.source),
    targetKinds: toArr(k.target),
    wiredPairCount: counts.get(k.name) ?? k.count ?? 0,
  }));
  return jsonResponse(out);
}
