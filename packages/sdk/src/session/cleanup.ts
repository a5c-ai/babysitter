import { readdirSync, readFileSync, unlinkSync } from "node:fs";
import * as path from "node:path";
import { getGlobalStateDir, getReadableRunsDirs, resolveRunsDir } from "../config";
import { isProcessAlive } from "../utils/processLiveness";
import { readSessionFile, writeSessionFile } from "./index";

const STATE_STALE_MS = 24 * 60 * 60 * 1000;

export interface SessionCleanupArgs {
  harness?: string;
  dryRun?: boolean;
  stateDir?: string;
  runsDir?: string;
}

export interface SessionCleanupResult {
  markersRemoved: string[];
  statesDeactivated: string[];
  dryRun: boolean;
}

interface MarkerInfo {
  file: string;
  absPath: string;
  harness: string;
  pid: number;
  alive: boolean;
  sessionId?: string;
}

function sanitizeHarnessSlug(harness: string): string {
  return harness
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseMarkerFilename(
  name: string,
): { harness: string; pid: number } | undefined {
  const prefix = "current-session-";
  if (!name.startsWith(prefix)) return undefined;
  const rest = name.slice(prefix.length);
  const match = rest.match(/^(.+)-pid-(\d+)$/);
  if (!match) return undefined;
  const harness = match[1];
  const pid = parseInt(match[2], 10);
  if (!Number.isFinite(pid) || pid <= 0) return undefined;
  return { harness, pid };
}

function listMarkerFiles(stateDir: string, harnessFilter?: string): MarkerInfo[] {
  let entries: string[];
  try {
    entries = readdirSync(stateDir);
  } catch {
    return [];
  }
  const slugFilter = harnessFilter ? sanitizeHarnessSlug(harnessFilter) : undefined;
  const out: MarkerInfo[] = [];
  for (const name of entries) {
    const parsed = parseMarkerFilename(name);
    if (!parsed) continue;
    if (slugFilter && parsed.harness !== slugFilter) continue;
    const absPath = path.join(stateDir, name);
    let sessionId: string | undefined;
    try {
      const raw = readFileSync(absPath, "utf8").trim();
      sessionId = raw || undefined;
    } catch {
      // Best effort.
    }
    out.push({
      file: name,
      absPath,
      harness: parsed.harness,
      pid: parsed.pid,
      alive: isProcessAlive(parsed.pid),
      sessionId,
    });
  }
  return out;
}

function isRunTerminal(runsDirs: string[], runId: string): boolean | undefined {
  for (const runsDir of runsDirs) {
    const journalDir = path.join(runsDir, runId, "journal");
    let files: string[];
    try {
      files = readdirSync(journalDir);
    } catch {
      continue;
    }
    const jsonFiles = files.filter((file) => file.endsWith(".json")).sort();
    const last = jsonFiles.at(-1);
    if (!last) {
      return false;
    }
    try {
      const parsed = JSON.parse(
        readFileSync(path.join(journalDir, last), "utf8"),
      ) as { type?: string };
      return parsed.type === "RUN_COMPLETED" || parsed.type === "RUN_FAILED";
    } catch {
      return false;
    }
  }
  return undefined;
}

function isStaleByTime(lastIterationAt: string): boolean {
  if (!lastIterationAt) return true;
  const time = Date.parse(lastIterationAt);
  if (!Number.isFinite(time)) return true;
  return Date.now() - time > STATE_STALE_MS;
}

export async function runSessionCleanup(
  args: SessionCleanupArgs,
): Promise<SessionCleanupResult> {
  const dryRun = Boolean(args.dryRun);
  const stateDir = args.stateDir ?? getGlobalStateDir();
  const runsDir = args.runsDir ?? resolveRunsDir();
  const readableRunsDirs = getReadableRunsDirs({ override: runsDir });

  const markers = listMarkerFiles(stateDir, args.harness);
  const deadMarkers = markers.filter((marker) => !marker.alive);
  const liveSessionIds = new Set<string>(
    markers.filter((marker) => marker.alive && marker.sessionId).map((marker) => marker.sessionId as string),
  );

  const markersRemoved: string[] = [];
  if (!dryRun) {
    for (const marker of deadMarkers) {
      try {
        unlinkSync(marker.absPath);
        markersRemoved.push(marker.file);
      } catch {
        // Best effort.
      }
    }
  } else {
    for (const marker of deadMarkers) {
      markersRemoved.push(marker.file);
    }
  }

  let mdEntries: string[] = [];
  try {
    mdEntries = readdirSync(stateDir);
  } catch {
    mdEntries = [];
  }

  const statesDeactivated: string[] = [];
  for (const name of mdEntries) {
    if (!name.endsWith(".md")) continue;
    const sessionId = name.slice(0, -3);
    if (liveSessionIds.has(sessionId)) continue;
    const filePath = path.join(stateDir, name);
    let state;
    let prompt: string;
    try {
      const parsed = await readSessionFile(filePath);
      state = parsed.state;
      prompt = parsed.prompt;
    } catch {
      continue;
    }
    if (!state.active) continue;

    let qualifies = false;
    let terminal: boolean | undefined;
    if (state.runId) {
      terminal = isRunTerminal(readableRunsDirs, state.runId);
    }
    if (terminal === true) {
      qualifies = true;
    } else if (isStaleByTime(state.lastIterationAt)) {
      qualifies = true;
    }
    if (!qualifies) continue;

    if (!dryRun) {
      try {
        await writeSessionFile(filePath, { ...state, active: false }, prompt);
        statesDeactivated.push(sessionId);
      } catch {
        // Best effort.
      }
    } else {
      statesDeactivated.push(sessionId);
    }
  }

  return { markersRemoved, statesDeactivated, dryRun };
}
