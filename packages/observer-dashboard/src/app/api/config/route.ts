import { NextResponse } from "next/server";
import { getConfig, invalidateConfigCache, writeConfig } from "@/lib/config-loader";
import { invalidateAll, discoverAndCacheAll } from "@/lib/run-cache";
import { normalizeError } from "@/lib/error-handler";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config);
  } catch (err) {
    const normalized = normalizeError(err);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate sources
    if (!Array.isArray(body.sources)) {
      return NextResponse.json(
        { error: "sources must be an array" },
        { status: 400 }
      );
    }

    for (let i = 0; i < body.sources.length; i++) {
      const s = body.sources[i];
      if (!s || typeof s.path !== "string" || !s.path.trim()) {
        return NextResponse.json(
          { error: `sources[${i}].path must be a non-empty string` },
          { status: 400 }
        );
      }
      if (typeof s.depth !== "number" || s.depth < 0 || s.depth > 10) {
        return NextResponse.json(
          { error: `sources[${i}].depth must be a number between 0 and 10` },
          { status: 400 }
        );
      }
    }

    // Validate pollInterval
    if (body.pollInterval !== undefined) {
      if (typeof body.pollInterval !== "number" || body.pollInterval < 500) {
        return NextResponse.json(
          { error: "pollInterval must be a number >= 500" },
          { status: 400 }
        );
      }
    }

    // Validate theme
    if (body.theme !== undefined) {
      if (body.theme !== "dark" && body.theme !== "light") {
        return NextResponse.json(
          { error: "theme must be 'dark' or 'light'" },
          { status: 400 }
        );
      }
    }

    // Validate staleThresholdMs
    if (body.staleThresholdMs !== undefined) {
      if (typeof body.staleThresholdMs !== "number" || body.staleThresholdMs < 0) {
        return NextResponse.json(
          { error: "staleThresholdMs must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    // Validate retentionDays
    if (body.retentionDays !== undefined) {
      if (typeof body.retentionDays !== "number" || body.retentionDays < 1 || body.retentionDays > 365) {
        return NextResponse.json(
          { error: "retentionDays must be a number between 1 and 365" },
          { status: 400 }
        );
      }
    }

    // Validate hiddenProjects
    if (body.hiddenProjects !== undefined) {
      if (!Array.isArray(body.hiddenProjects) || body.hiddenProjects.some((p: unknown) => typeof p !== "string")) {
        return NextResponse.json(
          { error: "hiddenProjects must be an array of strings" },
          { status: 400 }
        );
      }
    }

    // Build config to save
    const configToSave = {
      sources: body.sources.map((s: { path: string; depth: number; label?: string }) => ({
        path: s.path.trim(),
        depth: s.depth,
        ...(s.label ? { label: s.label.trim() } : {}),
      })),
      ...(body.pollInterval !== undefined ? { pollInterval: body.pollInterval } : {}),
      ...(body.theme !== undefined ? { theme: body.theme } : {}),
      ...(body.staleThresholdMs !== undefined ? { staleThresholdMs: body.staleThresholdMs } : {}),
      ...(body.retentionDays !== undefined ? { retentionDays: body.retentionDays } : {}),
      ...(body.hiddenProjects !== undefined ? { hiddenProjects: body.hiddenProjects } : {}),
    };

    // Write to disk
    await writeConfig(configToSave);

    // Invalidate caches so next request reads fresh
    invalidateConfigCache();
    invalidateAll(); // Clear run cache so re-discovery uses new sources

    // Read back the full merged config
    const savedConfig = await getConfig();

    // Re-discover all runs with new sources (fire and forget)
    discoverAndCacheAll().catch((err) =>
      console.error("Failed to re-discover runs after config change:", err)
    );

    return NextResponse.json(savedConfig);
  } catch (err) {
    console.error("Failed to save config:", err);
    const normalized = normalizeError(err);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status }
    );
  }
}
