import { NextResponse } from "next/server";
import path from "path";
import { findRunDir } from "@/lib/path-resolver";
import { parseJournalDir } from "@/lib/parser";
import { normalizeError } from "@/lib/error-handler";

export const dynamic = "force-dynamic";

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_\-]+$/.test(id);
}

export async function GET(
  request: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;
    if (!isValidId(runId)) {
      return NextResponse.json({ error: "Invalid run ID" }, { status: 400 });
    }

    const found = await findRunDir(runId);
    if (!found) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const journalPath = path.join(found.runDir, "journal");

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    if (isNaN(limit) || isNaN(offset) || limit < 0 || offset < 0) {
      return NextResponse.json(
        { error: "Invalid pagination parameters", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const allEvents = await parseJournalDir(journalPath);
    const total = allEvents.length;
    const events = allEvents.slice(offset, offset + limit);

    return NextResponse.json({ events, total }, {
      headers: { "Cache-Control": "no-cache, no-store" },
    });
  } catch (error) {
    console.error("Failed to read events:", error);
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status }
    );
  }
}
