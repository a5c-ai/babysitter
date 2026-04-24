import { NextResponse } from "next/server";

import { normalizeError } from "@/lib/error-handler";
import { ReviewService, type ReviewActionInput } from "@/lib/review-service";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = { "Cache-Control": "no-cache, no-store" };
const service = new ReviewService();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const targetType = url.searchParams.get("targetType");
    const targetId = url.searchParams.get("targetId");

    const snapshot = await service.listReviews({
      targetType: targetType === "issue" || targetType === "workspace" ? targetType : undefined,
      targetId: targetId?.trim() || undefined,
    });
    return NextResponse.json(snapshot, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message, code: normalized.code }, { status: normalized.status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviewActionInput;
    const snapshot = await service.applyAction(body);
    return NextResponse.json(snapshot, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message, code: normalized.code }, { status: normalized.status });
  }
}
