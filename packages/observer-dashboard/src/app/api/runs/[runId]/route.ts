import { NextResponse } from "next/server";
import { findRunDir } from "@/lib/path-resolver";
import { ensureInitialized } from "@/lib/server-init";
import { getRunCached } from "@/lib/run-cache";
import { normalizeError } from "@/lib/error-handler";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_\-]+$/.test(id);
}

const DEFAULT_MAX_EVENTS = 50;

/**
 * Generate a lightweight ETag from run state.
 * Uses status, task count, event count, and updatedAt as a fingerprint
 * to avoid re-serializing unchanged data to the client.
 */
function generateETag(run: { status: string; updatedAt: string; tasks: unknown[]; events: unknown[] }): string {
  const fingerprint = `${run.status}:${run.tasks.length}:${run.events.length}:${run.updatedAt}`;
  const hash = createHash("md5").update(fingerprint).digest("hex").slice(0, 16);
  return `"${hash}"`;
}

export async function GET(
  request: Request,
  { params }: { params: { runId: string } }
) {
  try {
    // Ensure watcher and cache are initialized
    await ensureInitialized();

    const { runId } = params;
    if (!isValidId(runId)) {
      return NextResponse.json({ error: "Invalid run ID" }, { status: 400 });
    }

    const found = await findRunDir(runId);
    if (!found) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Use cached run for better performance
    const run = await getRunCached(found.runDir, found.source, found.projectName);

    // Limit events returned (keep most recent) to reduce payload size
    const { searchParams } = new URL(request.url);
    const maxEvents = parseInt(searchParams.get("maxEvents") || String(DEFAULT_MAX_EVENTS));
    const totalEvents = run.events.length;
    const limitedRun = totalEvents > maxEvents
      ? { ...run, events: run.events.slice(-maxEvents), totalEvents }
      : { ...run, totalEvents };

    // ETag support: if client sends If-None-Match and data hasn't changed,
    // return 304 Not Modified to save bandwidth and serialization cost.
    const etag = generateETag(limitedRun);
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "no-cache",
        },
      });
    }

    return NextResponse.json({ run: limitedRun }, {
      headers: {
        "Cache-Control": "no-cache",
        ETag: etag,
      },
    });
  } catch (error) {
    console.error("Failed to read run:", error);
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status }
    );
  }
}
