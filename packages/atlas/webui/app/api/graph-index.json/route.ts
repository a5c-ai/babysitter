import { NextResponse } from "next/server";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";

export const dynamic = "force-dynamic";

export async function GET() {
  const { graph, index } = await getCurrentAtlasView();
  const records: Record<string, { _kind: string; displayName: string }> = {};
  for (const r of graph.getAllRecords()) {
    records[r.id] = { _kind: r._kind, displayName: graph.getDisplayName(r) };
  }
  return NextResponse.json({
    records,
    edges: index.edges,
  });
}
