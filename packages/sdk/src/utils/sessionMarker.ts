import * as path from "node:path";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  statSync,
} from "node:fs";
import { getGlobalStateDir } from "../config";
import { isProcessAlive } from "../utils/processLiveness";
import {
  findHarnessAncestorPid,
  __resetCacheForTests as resetAncestorCache,
  __setAncestorResolverForTests as setAncestorResolver,
} from "./ancestorWalk";

// Re-export types and functions for backward compatibility
export type { AncestorInfo } from "./ancestorWalk";
export { findHarnessAncestorPid } from "./ancestorWalk";

export const SESSION_PID_MARKER_ENV_VAR = "AGENT_ENABLE_SESSION_PID_MARKERS";
export const SESSION_PID_MARKER_ENV_VAR_DEPRECATED = "BABYSITTER_ENABLE_SESSION_PID_MARKERS";

export function isSessionPidMarkerEnabled(): boolean {
  const raw = process.env[SESSION_PID_MARKER_ENV_VAR] ?? process.env[SESSION_PID_MARKER_ENV_VAR_DEPRECATED];
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

export function __resetCacheForTests(): void {
  resetAncestorCache();
}

export function __setAncestorResolverForTests(
  fn: ((processNames: string[]) => import("./ancestorWalk").AncestorInfo | undefined) | undefined,
): void {
  setAncestorResolver(fn);
}

function sanitizeHarnessSlug(harness: string): string {
  return harness.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function getSessionMarkerPath(harness: string, ancestorPid: number): string {
  const slug = sanitizeHarnessSlug(harness) || "harness";
  return path.join(getGlobalStateDir(), `current-session-${slug}-pid-${ancestorPid}`);
}

export function hasSessionMarkerCandidate(harness: string): boolean {
  if (!isSessionPidMarkerEnabled()) return false;
  const raw = process.env.BABYSITTER_HARNESS_PID;
  if (raw) {
    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) return existsSync(getSessionMarkerPath(harness, parsed));
  }
  const slug = sanitizeHarnessSlug(harness) || "harness";
  const markerPrefix = `current-session-${slug}-pid-`;
  try { return readdirSync(getGlobalStateDir()).some((entry) => entry.startsWith(markerPrefix)); }
  catch { return false; }
}

function atomicWriteString(target: string, content: string): void {
  mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, content);
  renameSync(tmp, target);
}

export function writeSessionMarker(harness: string, sessionId: string): string | undefined {
  if (!isSessionPidMarkerEnabled()) return undefined;
  const info = findHarnessAncestorPid(deriveProcessNames(harness));
  if (!info) return undefined;
  const target = getSessionMarkerPath(harness, info.pid);
  atomicWriteString(target, `${sessionId}\n`);
  try { cleanupDeadSessionMarkers(); } catch { /* ignore */ }
  return target;
}

const MARKER_FILENAME_RE = /^current-session-.+-pid-(\d+)$/;
const MARKER_RECENCY_GRACE_MS = 60_000;

export function cleanupDeadSessionMarkers(): number {
  if (!isSessionPidMarkerEnabled()) return 0;
  const dir = getGlobalStateDir();
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return 0; }
  const now = Date.now();
  let removed = 0;
  for (const entry of entries) {
    const match = MARKER_FILENAME_RE.exec(entry);
    if (!match) continue;
    const pid = parseInt(match[1], 10);
    if (!Number.isFinite(pid) || pid <= 0) continue;
    const full = path.join(dir, entry);
    try { const st = statSync(full); if (now - st.mtimeMs < MARKER_RECENCY_GRACE_MS) continue; } catch { continue; }
    if (isProcessAlive(pid)) continue;
    try { unlinkSync(full); removed++; } catch { /* ignore */ }
  }
  return removed;
}

export function readSessionMarker(harness: string): string | undefined {
  return readSessionMarkerDetails(harness)?.sessionId;
}

export type SessionResolutionSource = "pid-marker" | "env-var" | "explicit" | "none";

export interface SessionMarkerDetails {
  sessionId: string;
  ancestorPid: number;
  ancestorAlive: boolean;
}

export interface SessionResolutionDetails {
  sessionId?: string;
  resolvedFrom: SessionResolutionSource;
  ancestorPid: number | null;
  ancestorAlive: boolean | null;
}

export function readSessionMarkerDetails(harness: string): SessionMarkerDetails | undefined {
  if (!isSessionPidMarkerEnabled()) return undefined;
  if (!hasSessionMarkerCandidate(harness)) return undefined;
  const info = findHarnessAncestorPid(deriveProcessNames(harness));
  if (!info) return undefined;
  const ancestorAlive = isProcessAlive(info.pid);
  if (!ancestorAlive) return undefined;
  const target = getSessionMarkerPath(harness, info.pid);
  if (!existsSync(target)) return undefined;
  try {
    const content = readFileSync(target, "utf8").trim();
    return content ? { sessionId: content, ancestorPid: info.pid, ancestorAlive } : undefined;
  } catch {
    return undefined;
  }
}

export function resolveSessionIdWithMarker(
  harness: string,
  parsed: { sessionId?: string },
  harnessEnvVars: readonly string[] = [],
): string | undefined {
  return resolveSessionIdWithMarkerDetailed(harness, parsed, harnessEnvVars).sessionId;
}

export function resolveSessionIdWithMarkerDetailed(
  harness: string,
  parsed: { sessionId?: string },
  harnessEnvVars: readonly string[] = [],
): SessionResolutionDetails {
  if (parsed.sessionId) {
    return {
      sessionId: parsed.sessionId,
      resolvedFrom: "explicit",
      ancestorPid: null,
      ancestorAlive: null,
    };
  }
  const trustEnv = process.env.AGENT_TRUST_ENV_SESSION === "1" || process.env.BABYSITTER_TRUST_ENV_SESSION === "1";
  const agentSessionId = process.env.AGENT_SESSION_ID;
  const fromMarker = readSessionMarkerDetails(harness);

  const fromHarnessEnv = () => {
    for (const key of harnessEnvVars) {
      const v = process.env[key];
      if (v) return v;
    }
    return undefined;
  };

  if (trustEnv) {
    if (agentSessionId) {
      return { sessionId: agentSessionId, resolvedFrom: "env-var", ancestorPid: null, ancestorAlive: null };
    }
    const harnessEnvSessionId = fromHarnessEnv();
    if (harnessEnvSessionId) {
      return { sessionId: harnessEnvSessionId, resolvedFrom: "env-var", ancestorPid: null, ancestorAlive: null };
    }
    if (fromMarker) {
      return {
        sessionId: fromMarker.sessionId,
        resolvedFrom: "pid-marker",
        ancestorPid: fromMarker.ancestorPid,
        ancestorAlive: fromMarker.ancestorAlive,
      };
    }
    return { sessionId: undefined, resolvedFrom: "none", ancestorPid: null, ancestorAlive: null };
  }

  if (fromMarker) {
    return {
      sessionId: fromMarker.sessionId,
      resolvedFrom: "pid-marker",
      ancestorPid: fromMarker.ancestorPid,
      ancestorAlive: fromMarker.ancestorAlive,
    };
  }
  const harnessEnvSessionId = fromHarnessEnv();
  if (harnessEnvSessionId) {
    return { sessionId: harnessEnvSessionId, resolvedFrom: "env-var", ancestorPid: null, ancestorAlive: null };
  }
  if (agentSessionId) {
    return { sessionId: agentSessionId, resolvedFrom: "env-var", ancestorPid: null, ancestorAlive: null };
  }
  return { sessionId: undefined, resolvedFrom: "none", ancestorPid: null, ancestorAlive: null };
}

export function deriveProcessNames(harness: string): string[] {
  const slug = sanitizeHarnessSlug(harness);
  switch (slug) {
    case "claude-code": return ["claude"];
    case "codex": return ["codex"];
    case "cursor": return ["cursor"];
    case "gemini-cli": case "gemini": return ["gemini", "node"];
    case "github-copilot": return ["copilot", "gh"];
    case "pi": case "oh-my-pi": return ["pi"];
    default: return [slug];
  }
}
