import { NextResponse } from "next/server";
import { getVersionInfo } from "@/lib/version-info";

export const dynamic = "force-dynamic";

// QA F6: version detection + staleness-aware caching live in
// src/lib/version-info.ts so the refresh semantics are unit-testable.
export async function GET() {
  return NextResponse.json(getVersionInfo());
}
