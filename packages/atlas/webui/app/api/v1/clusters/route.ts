import { jsonResponse, options } from "@/lib/api-helpers";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return options();
}

export async function GET() {
  const { index } = await getCurrentAtlasView();
  const out = Object.entries(index.clusters).map(([id, c]) => ({
    id,
    nodeKinds: c.nodeKinds,
    recordCount: c.recordCount,
  }));
  return jsonResponse(out);
}
