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
