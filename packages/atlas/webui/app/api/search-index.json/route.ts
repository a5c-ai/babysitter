import { NextResponse } from "next/server";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export const dynamic = "force-dynamic";

export async function GET() {
  const { graph } = await getCurrentAtlasView();
  const records = graph.getAllRecords();
  const slim = records.map((r) => ({
    id: r.id,
    _kind: r._kind,
    _cluster: r._cluster,
    displayName: graph.getDisplayName(r),
    description: typeof (r as Record<string, unknown>).description === "string"
      ? String((r as Record<string, unknown>).description).slice(0, 280)
      : "",
  }));
  return NextResponse.json(slim);
}
