/**
 * GAP-STATE-003: Session State Persistence.
 *
 * Stores rich persistent state: findings, file modifications, breakpoint patterns,
 * and user preferences. Follows the same atomic temp-file + rename pattern
 * as context.ts and history.ts.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionFinding {
  content: string;
  category: "architecture" | "bug" | "pattern" | "dependency" | "other";
  runId?: string;
  timestamp: string;
}

export interface SessionFileModification {
  filePath: string;
  action: "create" | "modify" | "delete";
  runId?: string;
  timestamp: string;
}

export interface SessionBreakpointPattern {
  breakpointId: string;
  approvedCount: number;
  rejectedCount: number;
  lastAction: "approved" | "rejected";
  lastInteractionAt: string;
}

export interface SessionPersistentState {
  schemaVersion: string;
  findings: SessionFinding[];
  preferences: Record<string, string>;
  fileModifications: SessionFileModification[];
  breakpointPatterns: SessionBreakpointPattern[];
}

export const SESSION_PERSISTENT_SCHEMA_VERSION = "2026.01.session-persistent-v1";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emptyPersistentState(): SessionPersistentState {
  return {
    schemaVersion: SESSION_PERSISTENT_SCHEMA_VERSION,
    findings: [],
    preferences: {},
    fileModifications: [],
    breakpointPatterns: [],
  };
}

function nowTimestamp(): string {
  return new Date().toISOString();
}

async function readRaw(filePath: string): Promise<SessionPersistentState> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return emptyPersistentState();
    return emptyPersistentState();
  }
  try {
    const data = JSON.parse(raw) as Partial<SessionPersistentState>;
    return {
      schemaVersion: typeof data.schemaVersion === "string" ? data.schemaVersion : SESSION_PERSISTENT_SCHEMA_VERSION,
      findings: Array.isArray(data.findings) ? data.findings : [],
      preferences: data.preferences && typeof data.preferences === "object" ? data.preferences : {},
      fileModifications: Array.isArray(data.fileModifications) ? data.fileModifications : [],
      breakpointPatterns: Array.isArray(data.breakpointPatterns) ? data.breakpointPatterns : [],
    };
  } catch {
    return emptyPersistentState();
  }
}

async function writeRaw(filePath: string, data: SessionPersistentState): Promise<void> {
  const dir = path.dirname(filePath);
  const tempPath = `${filePath}.tmp.${process.pid}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tempPath, filePath);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getSessionPersistentStatePath(stateDir: string, sessionId: string): string {
  return path.join(stateDir, `${sessionId}.persistent.json`);
}

export async function getSessionPersistentState(stateDir: string, sessionId: string): Promise<SessionPersistentState> {
  return readRaw(getSessionPersistentStatePath(stateDir, sessionId));
}

export async function addFinding(
  stateDir: string,
  sessionId: string,
  finding: Omit<SessionFinding, "timestamp">,
): Promise<void> {
  const filePath = getSessionPersistentStatePath(stateDir, sessionId);
  const data = await readRaw(filePath);
  data.findings.push({ ...finding, timestamp: nowTimestamp() });
  await writeRaw(filePath, data);
}

export async function setPreference(
  stateDir: string,
  sessionId: string,
  key: string,
  value: string,
): Promise<void> {
  const filePath = getSessionPersistentStatePath(stateDir, sessionId);
  const data = await readRaw(filePath);
  data.preferences[key] = value;
  await writeRaw(filePath, data);
}

export async function recordFileModification(
  stateDir: string,
  sessionId: string,
  mod: Omit<SessionFileModification, "timestamp">,
): Promise<void> {
  const filePath = getSessionPersistentStatePath(stateDir, sessionId);
  const data = await readRaw(filePath);
  data.fileModifications.push({ ...mod, timestamp: nowTimestamp() });
  await writeRaw(filePath, data);
}

export async function recordBreakpointInteraction(
  stateDir: string,
  sessionId: string,
  breakpointId: string,
  action: "approved" | "rejected",
): Promise<void> {
  const filePath = getSessionPersistentStatePath(stateDir, sessionId);
  const data = await readRaw(filePath);
  const now = nowTimestamp();

  const existing = data.breakpointPatterns.find((p) => p.breakpointId === breakpointId);
  if (existing) {
    if (action === "approved") existing.approvedCount++;
    else existing.rejectedCount++;
    existing.lastAction = action;
    existing.lastInteractionAt = now;
  } else {
    data.breakpointPatterns.push({
      breakpointId,
      approvedCount: action === "approved" ? 1 : 0,
      rejectedCount: action === "rejected" ? 1 : 0,
      lastAction: action,
      lastInteractionAt: now,
    });
  }

  await writeRaw(filePath, data);
}

/**
 * Render persistent state into a markdown section for resume prompt injection.
 * Returns empty string when no meaningful data exists.
 */
export async function buildResumeContext(stateDir: string, sessionId: string): Promise<string> {
  const state = await getSessionPersistentState(stateDir, sessionId);

  const sections: string[] = [];

  if (state.findings.length > 0) {
    const lines = state.findings.map((f) => `- [${f.category}] ${f.content}`);
    sections.push(`### Findings\n${lines.join("\n")}`);
  }

  const prefKeys = Object.keys(state.preferences);
  if (prefKeys.length > 0) {
    const lines = prefKeys.map((k) => `- **${k}**: ${state.preferences[k]}`);
    sections.push(`### Preferences\n${lines.join("\n")}`);
  }

  if (state.fileModifications.length > 0) {
    const recent = state.fileModifications.slice(-10);
    const lines = recent.map((m) => `- ${m.action} \`${m.filePath}\``);
    sections.push(`### Recent File Changes\n${lines.join("\n")}`);
  }

  if (state.breakpointPatterns.length > 0) {
    const lines = state.breakpointPatterns.map(
      (p) => `- \`${p.breakpointId}\`: ${p.approvedCount} approved, ${p.rejectedCount} rejected (last: ${p.lastAction})`,
    );
    sections.push(`### Breakpoint Patterns\n${lines.join("\n")}`);
  }

  if (sections.length === 0) return "";
  return `## Session Context\n\n${sections.join("\n\n")}`;
}
