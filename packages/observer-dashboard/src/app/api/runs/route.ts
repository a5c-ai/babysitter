import { NextResponse } from "next/server";
import { ensureInitialized } from "@/lib/server-init";
import { normalizeError } from "@/lib/error-handler";
import { RunQueryService, type SortMode } from "@/lib/services/run-query-service";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = { "Cache-Control": "no-cache, no-store" };

const service = new RunQueryService();

export async function GET(request: Request) {
  try {
    await ensureInitialized();

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const project = searchParams.get("project");
    const limit = parseInt(searchParams.get("limit") || "0");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sort = (searchParams.get("sort") || "status") as SortMode;

    // Mode: projects - return lightweight project summaries
    if (mode === "projects") {
      const data = await service.listProjects();
      return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
    }

    // Mode: project - return paginated runs for a specific project
    if (project) {
      const data = await service.listProjectRuns({ project, limit, offset, search, status, sort });
      return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
    }

    // Default: return all runs with totalCount
    const data = await service.listAllRuns({ limit, offset, search, status, sort });
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Failed to read runs:", error);
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status }
    );
  }
}
