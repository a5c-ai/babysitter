/**
 * E2E Test Data Helpers
 *
 * Provides paths and utility functions for consuming the generated fixture data
 * in E2E and performance tests.
 *
 * Usage:
 *   import { FIXTURES_RUNS_DIR, getManifest, getRunIds } from "../fixtures/test-data";
 */

import { promises as fs } from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** Root directory containing all generated run directories */
export const FIXTURES_RUNS_DIR = path.join(__dirname, "runs");

/** Path to the generation manifest with summary statistics */
export const MANIFEST_PATH = path.join(FIXTURES_RUNS_DIR, "_manifest.json");

// ---------------------------------------------------------------------------
// Manifest types
// ---------------------------------------------------------------------------

export interface ManifestRun {
  runId: string;
  processId: string;
  projectName: string;
  status: "completed" | "failed" | "waiting" | "pending";
  taskCount: number;
  createdAt: string;
}

export interface Manifest {
  generatedAt: string;
  runCount: number;
  totalTasks: number;
  statusCounts: Record<string, number>;
  projectCounts: Record<string, number>;
  runs: ManifestRun[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let cachedManifest: Manifest | null = null;

/**
 * Load the fixture manifest (cached after first call).
 */
export async function getManifest(): Promise<Manifest> {
  if (cachedManifest) return cachedManifest;
  const content = await fs.readFile(MANIFEST_PATH, "utf-8");
  cachedManifest = JSON.parse(content) as Manifest;
  return cachedManifest;
}

/**
 * Return all run IDs in reverse chronological order (matching parser.ts behavior).
 */
export async function getRunIds(): Promise<string[]> {
  const entries = await fs.readdir(FIXTURES_RUNS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .reverse();
}

/**
 * Return the absolute path to a specific run directory.
 */
export function runDir(runId: string): string {
  return path.join(FIXTURES_RUNS_DIR, runId);
}

/**
 * Return run IDs filtered by status.
 */
export async function getRunIdsByStatus(
  status: "completed" | "failed" | "waiting" | "pending"
): Promise<string[]> {
  const manifest = await getManifest();
  return manifest.runs.filter((r) => r.status === status).map((r) => r.runId);
}

/**
 * Return run IDs filtered by project name.
 */
export async function getRunIdsByProject(projectName: string): Promise<string[]> {
  const manifest = await getManifest();
  return manifest.runs.filter((r) => r.projectName === projectName).map((r) => r.runId);
}

/**
 * Return run IDs for "heavy" runs (20+ tasks) -- useful for stress tests.
 */
export async function getHeavyRunIds(minTasks = 20): Promise<string[]> {
  const manifest = await getManifest();
  return manifest.runs.filter((r) => r.taskCount >= minTasks).map((r) => r.runId);
}

/**
 * Return all unique project names in the fixtures.
 */
export async function getProjectNames(): Promise<string[]> {
  const manifest = await getManifest();
  return Object.keys(manifest.projectCounts);
}

/**
 * Return the total number of tasks across all fixture runs.
 */
export async function getTotalTaskCount(): Promise<number> {
  const manifest = await getManifest();
  return manifest.totalTasks;
}

/**
 * §15.1 (owner gate 2026-07-06b, hidden-model A): count fixture runs that
 * classify as "scheduled" — a NON-terminal run whose NEWEST journal event is an
 * unresolved `sleep` effect (a sleeping forever-run between ticks). Such a run
 * is idle-HEALTHY, NOT active/in-progress, so the Active/"In Progress" tile
 * (which reads the single counting source) EXCLUDES it. Tests that derive an
 * expected active count from `manifest.statusCounts` (which counts run.status,
 * so a sleeping run still shows as "waiting") must subtract these to reconcile
 * with the tile — this mirrors the parser's `deriveScheduledLiveness` rule.
 */
export async function getScheduledRunIds(): Promise<string[]> {
  const manifest = await getManifest();
  const scheduled: string[] = [];
  for (const run of manifest.runs) {
    // Only non-terminal runs can be sleeping (a terminal run's newest event is
    // RUN_COMPLETED/RUN_FAILED).
    if (run.status !== "waiting" && run.status !== "pending") continue;
    const journalDir = path.join(runDir(run.runId), "journal");
    let files: string[];
    try {
      files = (await fs.readdir(journalDir)).filter((f) => f.endsWith(".json")).sort();
    } catch {
      continue;
    }
    if (files.length === 0) continue;
    // Newest journal event = highest-numbered file.
    const newestFile = files[files.length - 1];
    try {
      const raw = JSON.parse(await fs.readFile(path.join(journalDir, newestFile), "utf-8"));
      if (raw?.type === "EFFECT_REQUESTED" && raw?.data?.kind === "sleep") {
        scheduled.push(run.runId);
      }
    } catch {
      // Unreadable newest event → not classifiable as scheduled; skip.
    }
  }
  return scheduled;
}

/**
 * §15.1: the fixture Active/"In Progress" count as the tile computes it —
 * non-terminal (waiting/pending) MINUS sleeping "scheduled" runs. The single
 * source of truth for e2e assertions on the Active tile / banner active count.
 */
export async function getActiveRunCount(): Promise<number> {
  const manifest = await getManifest();
  const nonTerminal =
    (manifest.statusCounts.waiting || 0) + (manifest.statusCounts.pending || 0);
  const scheduled = (await getScheduledRunIds()).length;
  return nonTerminal - scheduled;
}

/**
 * Verify that the fixtures directory exists and contains the expected number of runs.
 * Useful as a setup check in test beforeAll hooks.
 */
export async function verifyFixtures(): Promise<{
  valid: boolean;
  runCount: number;
  error?: string;
}> {
  try {
    const ids = await getRunIds();
    const manifest = await getManifest();
    if (ids.length !== manifest.runCount) {
      return {
        valid: false,
        runCount: ids.length,
        error: `Expected ${manifest.runCount} runs but found ${ids.length}`,
      };
    }
    return { valid: true, runCount: ids.length };
  } catch (err) {
    return {
      valid: false,
      runCount: 0,
      error: `Fixtures not found. Run: npx tsx e2e/fixtures/generate-fixtures.ts\n${err}`,
    };
  }
}
