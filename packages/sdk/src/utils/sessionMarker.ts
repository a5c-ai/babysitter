import * as path from "node:path";
import { execSync } from "node:child_process";
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

export interface AncestorInfo {
  pid: number;
  startTime?: string;
}

const ANCESTOR_CACHE_TTL_MS = 30_000;

interface AncestorCacheEntry {
  info: AncestorInfo | undefined;
  resolvedAt: number;
  processNamesKey: string;
}

let ancestorCache: AncestorCacheEntry | undefined;

type WindowsStrategy = "powershell" | "wmic" | "tasklist-incapable";
let cachedWindowsStrategy: WindowsStrategy | undefined;

export function __resetCacheForTests(): void {
  ancestorCache = undefined;
  cachedWindowsStrategy = undefined;
  ancestorResolverOverride = undefined;
}

let ancestorResolverOverride:
  | ((processNames: string[]) => AncestorInfo | undefined)
  | undefined;

export function __setAncestorResolverForTests(
  fn: ((processNames: string[]) => AncestorInfo | undefined) | undefined,
): void {
  ancestorResolverOverride = fn;
}

function sanitizeHarnessSlug(harness: string): string {
  return harness
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSessionMarkerPath(harness: string, ancestorPid: number): string {
  const slug = sanitizeHarnessSlug(harness) || "harness";
  return path.join(getGlobalStateDir(), `current-session-${slug}-pid-${ancestorPid}`);
}

// ---------------------------------------------------------------------------
// Ancestor walk
// ---------------------------------------------------------------------------

interface ParentInfo {
  ppid: number;
  name: string;
  startTime?: string;
}

function runCmd(cmd: string, timeoutMs = 5000): string {
  return execSync(cmd, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: timeoutMs,
  });
}

function parsePosixPs(pid: number): ParentInfo | undefined {
  try {
    const out = runCmd(`ps -p ${pid} -o ppid=,comm=,lstart=`).trim();
    const match = out.match(/^\s*(\d+)\s+(\S+)\s*(.*)$/);
    if (!match) return undefined;
    const ppid = parseInt(match[1], 10);
    const name = path.basename(match[2]);
    const startTime = match[3]?.trim() || undefined;
    return { ppid, name, startTime };
  } catch {
    return undefined;
  }
}

function parseWindowsViaPowershell(pid: number): ParentInfo | undefined {
  try {
    const script = `Get-CimInstance Win32_Process -Filter "ProcessId=${pid}" | Select-Object ParentProcessId,Name,CreationDate | ConvertTo-Json -Compress`;
    const out = runCmd(`powershell -NoProfile -Command '${script}'`).trim();
    if (!out) return undefined;
    const parsed = JSON.parse(out) as
      | { ParentProcessId?: number; Name?: string; CreationDate?: string | { DateTime?: string } }
      | Array<{ ParentProcessId?: number; Name?: string; CreationDate?: string | { DateTime?: string } }>;
    const entry = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!entry) return undefined;
    const ppid = typeof entry.ParentProcessId === "number" ? entry.ParentProcessId : NaN;
    const name = entry.Name ? String(entry.Name) : "";
    let startTime: string | undefined;
    if (typeof entry.CreationDate === "string") {
      startTime = entry.CreationDate;
    } else if (entry.CreationDate && typeof entry.CreationDate === "object") {
      const dt = (entry.CreationDate as { DateTime?: string }).DateTime;
      if (dt) startTime = dt;
    }
    if (!Number.isFinite(ppid) || !name) return undefined;
    return { ppid, name, startTime };
  } catch {
    return undefined;
  }
}

function parseWindowsViaWmic(pid: number): ParentInfo | undefined {
  try {
    const out = runCmd(
      `wmic process where ProcessId=${pid} get ParentProcessId,Name,CreationDate /format:csv`,
    ).trim();
    const lines = out.split(/\r?\n/).filter((l) => l.includes(","));
    if (lines.length < 2) return undefined;
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const row = lines[1].split(",");
    const nameIdx = header.indexOf("name");
    const ppidIdx = header.indexOf("parentprocessid");
    const startIdx = header.indexOf("creationdate");
    if (nameIdx < 0 || ppidIdx < 0) return undefined;
    const name = (row[nameIdx] || "").trim();
    const ppid = parseInt((row[ppidIdx] || "").trim(), 10);
    const startTime = startIdx >= 0 ? (row[startIdx] || "").trim() || undefined : undefined;
    if (!Number.isFinite(ppid) || !name) return undefined;
    return { ppid, name, startTime };
  } catch {
    return undefined;
  }
}

function parseWindows(pid: number): ParentInfo | undefined {
  if (cachedWindowsStrategy === "wmic") {
    const info = parseWindowsViaWmic(pid);
    if (info) return info;
  } else if (cachedWindowsStrategy === "powershell") {
    const info = parseWindowsViaPowershell(pid);
    if (info) return info;
  } else if (cachedWindowsStrategy === "tasklist-incapable") {
    return undefined;
  }

  const wmicInfo = parseWindowsViaWmic(pid);
  if (wmicInfo) {
    cachedWindowsStrategy = "wmic";
    return wmicInfo;
  }
  const psInfo = parseWindowsViaPowershell(pid);
  if (psInfo) {
    cachedWindowsStrategy = "powershell";
    return psInfo;
  }
  cachedWindowsStrategy = "tasklist-incapable";
  return undefined;
}

function getParentInfo(pid: number): ParentInfo | undefined {
  if (process.platform === "win32") return parseWindows(pid);
  return parsePosixPs(pid);
}

function normalizeProcName(name: string): string {
  return path.basename(name).toLowerCase().replace(/\.exe$/, "");
}

export function findHarnessAncestorPid(processNames: string[]): AncestorInfo | undefined {
  if (ancestorResolverOverride) return ancestorResolverOverride(processNames);
  
  if (process.env.BABYSITTER_HARNESS_PID) {
    const overridePid = parseInt(process.env.BABYSITTER_HARNESS_PID, 10);
    if (Number.isFinite(overridePid) && overridePid > 0) {
      return { pid: overridePid };
    }
  }

  const processNamesKey = processNames.join("|");
  const now = Date.now();

  if (
    ancestorCache &&
    ancestorCache.processNamesKey === processNamesKey &&
    now - ancestorCache.resolvedAt < ANCESTOR_CACHE_TTL_MS
  ) {
    if (!ancestorCache.info) return undefined;
    if (isProcessAlive(ancestorCache.info.pid)) return ancestorCache.info;
    ancestorCache = undefined;
  }

  const envProcessNames = process.env.BABYSITTER_HARNESS_PROCESS_NAMES
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const targets = [...processNames, ...(envProcessNames || [])].map((n) =>
    n.toLowerCase().replace(/\.exe$/, ""),
  );

  let pid = process.pid;
  let highestMatch: AncestorInfo | undefined;

  for (let depth = 0; depth < 100; depth++) {
    const info = getParentInfo(pid);
    if (!info) break;

    const base = normalizeProcName(info.name || "");
    if (targets.includes(base)) {
      highestMatch = { pid, startTime: info.startTime };
    }

    if (!Number.isFinite(info.ppid) || info.ppid <= 0 || info.ppid === pid) break;
    pid = info.ppid;
  }

  if (highestMatch && !isProcessAlive(highestMatch.pid)) {
    highestMatch = undefined;
  }

  ancestorCache = { info: highestMatch, resolvedAt: now, processNamesKey };
  return highestMatch;
}

// ---------------------------------------------------------------------------
// Marker file I/O
// ---------------------------------------------------------------------------

function atomicWriteString(target: string, content: string): void {
  mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, content);
  renameSync(tmp, target);
}

export function writeSessionMarker(harness: string, sessionId: string): string | undefined {
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
  const dir = getGlobalStateDir();
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return 0;
  }
  const now = Date.now();
  let removed = 0;
  for (const entry of entries) {
    const match = MARKER_FILENAME_RE.exec(entry);
    if (!match) continue;
    const pid = parseInt(match[1], 10);
    if (!Number.isFinite(pid) || pid <= 0) continue;
    const full = path.join(dir, entry);
    try {
      const st = statSync(full);
      if (now - st.mtimeMs < MARKER_RECENCY_GRACE_MS) continue;
    } catch {
      continue;
    }
    if (isProcessAlive(pid)) continue;
    try {
      unlinkSync(full);
      removed++;
    } catch { /* ignore */ }
  }
  return removed;
}

export function readSessionMarker(harness: string): string | undefined {
  const info = findHarnessAncestorPid(deriveProcessNames(harness));
  if (!info) return undefined;
  if (!isProcessAlive(info.pid)) return undefined;
  const target = getSessionMarkerPath(harness, info.pid);
  if (!existsSync(target)) return undefined;
  try {
    const content = readFileSync(target, "utf8").trim();
    return content || undefined;
  } catch {
    return undefined;
  }
}

export function resolveSessionIdWithMarker(
  harness: string,
  parsed: { sessionId?: string },
  harnessEnvVars: readonly string[] = [],
): string | undefined {
  if (parsed.sessionId) return parsed.sessionId;
  const trustEnv = process.env.BABYSITTER_TRUST_ENV_SESSION === "1";
  if (trustEnv) {
    if (process.env.BABYSITTER_SESSION_ID) return process.env.BABYSITTER_SESSION_ID;
    for (const key of harnessEnvVars) {
      const v = process.env[key];
      if (v) return v;
    }
    return undefined;
  }
  for (const key of harnessEnvVars) {
    const v = process.env[key];
    if (v) return v;
  }
  if (process.env.BABYSITTER_SESSION_ID) return process.env.BABYSITTER_SESSION_ID;
  const fromMarker = readSessionMarker(harness);
  if (fromMarker) return fromMarker;
  return undefined;
}

export function deriveProcessNames(harness: string): string[] {
  const slug = sanitizeHarnessSlug(harness);
  switch (slug) {
    case "claude-code":
      return ["claude"];
    case "codex":
      return ["codex"];
    case "cursor":
      return ["cursor"];
    case "gemini-cli":
    case "gemini":
      return ["gemini", "node"];
    case "github-copilot":
      return ["copilot", "gh"];
    case "pi":
    case "oh-my-pi":
      return ["pi"];
    default:
      return [slug];
  }
}
