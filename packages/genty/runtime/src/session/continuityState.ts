/**
 * GAP-PERF-008: Structured Continuity State.
 *
 * Structured state that persists across session compaction. Captures
 * key decisions, current phase, and working context for seamless
 * resume after context compression.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContinuityPhase {
  name: string;
  startedAt: string;
  description: string;
}

export interface ContinuityDecision {
  key: string;
  value: string;
  rationale?: string;
  madeAt: string;
  runId?: string;
}

export interface ContinuityWorkingContext {
  focus: string;
  blockers: string[];
  nextSteps: string[];
}

export interface ContinuityState {
  schemaVersion: string;
  updatedAt: string;
  currentPhase: ContinuityPhase | null;
  decisions: ContinuityDecision[];
  workingContext: ContinuityWorkingContext;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CONTINUITY_STATE_SCHEMA_VERSION = "2026.01.continuity-state-v1";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emptyContinuityState(): ContinuityState {
  return {
    schemaVersion: CONTINUITY_STATE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    currentPhase: null,
    decisions: [],
    workingContext: { focus: "", blockers: [], nextSteps: [] },
  };
}

async function readRaw(filePath: string): Promise<ContinuityState> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return emptyContinuityState();
  }
  try {
    const data = JSON.parse(raw) as Partial<ContinuityState>;
    return {
      schemaVersion: typeof data.schemaVersion === "string" ? data.schemaVersion : CONTINUITY_STATE_SCHEMA_VERSION,
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
      currentPhase: data.currentPhase ?? null,
      decisions: Array.isArray(data.decisions) ? data.decisions : [],
      workingContext: data.workingContext ?? { focus: "", blockers: [], nextSteps: [] },
    };
  } catch {
    return emptyContinuityState();
  }
}

async function writeRaw(filePath: string, data: ContinuityState): Promise<void> {
  const dir = path.dirname(filePath);
  const tempPath = `${filePath}.tmp.${process.pid}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tempPath, filePath);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getContinuityStatePath(stateDir: string, sessionId: string): string {
  return path.join(stateDir, `${sessionId}.continuity.json`);
}

export async function getContinuityState(stateDir: string, sessionId: string): Promise<ContinuityState> {
  return readRaw(getContinuityStatePath(stateDir, sessionId));
}

export async function setCurrentPhase(
  stateDir: string,
  sessionId: string,
  phase: Omit<ContinuityPhase, "startedAt">,
): Promise<void> {
  const filePath = getContinuityStatePath(stateDir, sessionId);
  const state = await readRaw(filePath);
  state.currentPhase = { ...phase, startedAt: new Date().toISOString() };
  state.updatedAt = new Date().toISOString();
  await writeRaw(filePath, state);
}

export async function upsertDecision(
  stateDir: string,
  sessionId: string,
  decision: Omit<ContinuityDecision, "madeAt">,
): Promise<void> {
  const filePath = getContinuityStatePath(stateDir, sessionId);
  const state = await readRaw(filePath);
  const existing = state.decisions.findIndex((d) => d.key === decision.key);
  const entry: ContinuityDecision = { ...decision, madeAt: new Date().toISOString() };
  if (existing >= 0) {
    state.decisions[existing] = entry;
  } else {
    state.decisions.push(entry);
  }
  state.updatedAt = new Date().toISOString();
  await writeRaw(filePath, state);
}

export async function updateWorkingContext(
  stateDir: string,
  sessionId: string,
  updates: Partial<ContinuityWorkingContext>,
): Promise<void> {
  const filePath = getContinuityStatePath(stateDir, sessionId);
  const state = await readRaw(filePath);
  if (updates.focus !== undefined) state.workingContext.focus = updates.focus;
  if (updates.blockers !== undefined) state.workingContext.blockers = updates.blockers;
  if (updates.nextSteps !== undefined) state.workingContext.nextSteps = updates.nextSteps;
  state.updatedAt = new Date().toISOString();
  await writeRaw(filePath, state);
}

export async function buildContinuityResumePrompt(
  stateDir: string,
  sessionId: string,
): Promise<string> {
  const state = await getContinuityState(stateDir, sessionId);

  const sections: string[] = [];

  if (state.currentPhase) {
    sections.push(`## Current Phase: ${state.currentPhase.name}\n${state.currentPhase.description}`);
  }

  if (state.decisions.length > 0) {
    const items = state.decisions.map((d) => {
      const rationale = d.rationale ? ` (${d.rationale})` : "";
      return `- **${d.key}**: ${d.value}${rationale}`;
    });
    sections.push(`## Key Decisions\n${items.join("\n")}`);
  }

  const wc = state.workingContext;
  if (wc.focus || wc.blockers.length > 0 || wc.nextSteps.length > 0) {
    const parts: string[] = [];
    if (wc.focus) parts.push(`**Focus**: ${wc.focus}`);
    if (wc.blockers.length > 0) parts.push(`**Blockers**: ${wc.blockers.join(", ")}`);
    if (wc.nextSteps.length > 0) parts.push(`**Next Steps**: ${wc.nextSteps.join(", ")}`);
    sections.push(`## Working Context\n${parts.join("\n")}`);
  }

  return sections.length > 0 ? sections.join("\n\n") : "";
}
