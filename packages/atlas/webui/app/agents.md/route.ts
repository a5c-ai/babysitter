import { NextResponse } from "next/server";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";
import { buildAgentsMarkdown } from "@/lib/server/agent-docs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const { index } = await getCurrentAtlasView();
  return new NextResponse(buildAgentsMarkdown(index, origin), {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
