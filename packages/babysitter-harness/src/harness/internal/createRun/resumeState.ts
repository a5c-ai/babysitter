import { promises as fs } from "node:fs";
import * as path from "node:path";
import { loadJournal, readRunMetadata, readStateCache } from "@a5c-ai/babysitter-sdk";

export interface RunSummary {
  runId: string;
  runDir: string;
  processId: string;
  prompt?: string;
  createdAt: string;
  status: string;
  pendingEffects: Record<string, number>;
  totalEffects: number;
  resolvedEffects: number;
  entrypoint: { importPath: string; exportName?: string };
}

export function deriveRunStatus(
  journal: Array<{ type: string }>,
  pendingEffects: Record<string, number>,
): string {
  const types = new Set(journal.map((event) => event.type));
  if (types.has("RUN_COMPLETED")) return "completed";
  if (types.has("RUN_FAILED")) return "failed";
  const totalPending = Object.values(pendingEffects).reduce((a, b) => a + b, 0);
  if (totalPending > 0) return "waiting";
  if (types.has("EFFECT_REQUESTED")) return "in-progress";
  if (types.has("RUN_CREATED")) return "created";
  return "unknown";
}

export async function discoverRuns(runsDir: string): Promise<RunSummary[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(runsDir);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") return [];
    throw error;
  }

  const runs: RunSummary[] = [];
  for (const entry of entries) {
    const runDir = path.join(runsDir, entry);
    try {
      const stat = await fs.stat(runDir);
      if (!stat.isDirectory()) continue;

      const metadata = await readRunMetadata(runDir);
      const journal = await loadJournal(runDir);
      const stateCache = await readStateCache(runDir);

      const pendingEffects = stateCache?.pendingEffectsByKind ?? {};
      const totalEffects = stateCache
        ? Object.keys(stateCache.effectsByInvocation).length
        : 0;
      const totalPending = Object.values(pendingEffects).reduce((a, b) => a + b, 0);

      runs.push({
        runId: metadata.runId,
        runDir,
        processId: metadata.processId,
        prompt: metadata.prompt,
        createdAt: metadata.createdAt,
        status: deriveRunStatus(journal, pendingEffects),
        pendingEffects,
        totalEffects,
        resolvedEffects: totalEffects - totalPending,
        entrypoint: metadata.entrypoint,
      });
    } catch {
      continue;
    }
  }

  runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return runs.slice(0, 20);
}

export async function assessRun(runDir: string): Promise<{
  run: RunSummary;
  journalLength: number;
  lastEvent: { type: string; recordedAt: string } | null;
}> {
  const metadata = await readRunMetadata(runDir);
  const journal = await loadJournal(runDir);
  const stateCache = await readStateCache(runDir);

  const pendingEffects = stateCache?.pendingEffectsByKind ?? {};
  const totalEffects = stateCache
    ? Object.keys(stateCache.effectsByInvocation).length
    : 0;
  const totalPending = Object.values(pendingEffects).reduce((a, b) => a + b, 0);

  return {
    run: {
      runId: metadata.runId,
      runDir,
      processId: metadata.processId,
      prompt: metadata.prompt,
      createdAt: metadata.createdAt,
      status: deriveRunStatus(journal, pendingEffects),
      pendingEffects,
      totalEffects,
      resolvedEffects: totalEffects - totalPending,
      entrypoint: metadata.entrypoint,
    },
    journalLength: journal.length,
    lastEvent: journal.length > 0
      ? {
        type: journal[journal.length - 1].type,
        recordedAt: journal[journal.length - 1].recordedAt,
      }
      : null,
  };
}
