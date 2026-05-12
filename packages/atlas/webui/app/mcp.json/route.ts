import { NextResponse } from "next/server";
import { buildAtlasMcpManifest } from "@/lib/server/agent-docs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json(buildAtlasMcpManifest(origin), {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}

