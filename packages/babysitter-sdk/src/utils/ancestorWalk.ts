/**
 * Process ancestor walk logic for session PID markers.
 * Extracted from sessionMarker.ts for max-lines compliance.
 */

import * as path from "node:path";
import { execSync } from "node:child_process";
import { isProcessAlive } from "../utils/processLiveness";

export interface AncestorInfo {
  pid: number;
  startTime?: string;
}

interface ParentInfo {
  ppid: number;
  name: string;
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

let ancestorResolverOverride:
  | ((processNames: string[]) => AncestorInfo | undefined)
  | undefined;

export function __resetCacheForTests(): void {
  ancestorCache = undefined;
  cachedWindowsStrategy = undefined;
  ancestorResolverOverride = undefined;
}

export function __setAncestorResolverForTests(
  fn: ((processNames: string[]) => AncestorInfo | undefined) | undefined,
): void {
  ancestorResolverOverride = fn;
}

function runCmd(cmd: string, timeoutMs = 5000): string {
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: timeoutMs });
}

function parsePosixPs(pid: number): ParentInfo | undefined {
  try {
    const out = runCmd(`ps -p ${pid} -o ppid=,comm=,lstart=`).trim();
    const match = out.match(/^\s*(\d+)\s+(\S+)\s*(.*)$/);
    if (!match) return undefined;
    return { ppid: parseInt(match[1], 10), name: path.basename(match[2]), startTime: match[3]?.trim() || undefined };
  } catch { return undefined; }
}

function parseWindowsViaPowershell(pid: number): ParentInfo | undefined {
  try {
    const script = `Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\" | Select-Object ParentProcessId,Name,CreationDate,CommandLine | ConvertTo-Json -Compress`;
    const out = runCmd(`powershell -NoProfile -Command "${script}"`).trim();
    if (!out) return undefined;
    const parsed = JSON.parse(out) as
      | { ParentProcessId?: number; Name?: string; CreationDate?: string | { DateTime?: string } }
      | Array<{ ParentProcessId?: number; Name?: string; CreationDate?: string | { DateTime?: string } }>;
    const entry = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!entry) return undefined;
    const ppid = typeof entry.ParentProcessId === "number" ? entry.ParentProcessId : NaN;
    const name = entry.Name ? String(entry.Name) : "";
    let startTime: string | undefined;
    if (typeof entry.CreationDate === "string") { startTime = entry.CreationDate; }
    else if (entry.CreationDate && typeof entry.CreationDate === "object") {
      const dt = (entry.CreationDate as { DateTime?: string }).DateTime;
      if (dt) startTime = dt;
    }
    if (!Number.isFinite(ppid) || !name) return undefined;
    return { ppid, name, startTime };
  } catch { return undefined; }
}

function parseWindowsViaWmic(pid: number): ParentInfo | undefined {
  try {
    const out = runCmd(`wmic process where ProcessId=${pid} get ParentProcessId,Name,CreationDate /format:csv`).trim();
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
  } catch { return undefined; }
}

function parseWindows(pid: number): ParentInfo | undefined {
  if (cachedWindowsStrategy === "powershell") { const info = parseWindowsViaPowershell(pid); if (info) return info; }
  else if (cachedWindowsStrategy === "wmic") { const info = parseWindowsViaWmic(pid); if (info) return info; }
  else if (cachedWindowsStrategy === "tasklist-incapable") { return undefined; }
  const psInfo = parseWindowsViaPowershell(pid);
  if (psInfo) { cachedWindowsStrategy = "powershell"; return psInfo; }
  const wmicInfo = parseWindowsViaWmic(pid);
  if (wmicInfo) { cachedWindowsStrategy = "wmic"; return wmicInfo; }
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

function parseHarnessPidOverride(): number | undefined {
  const raw = process.env.BABYSITTER_HARNESS_PID;
  if (!raw) return undefined;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function findHarnessAncestorPid(processNames: string[]): AncestorInfo | undefined {
  if (ancestorResolverOverride) return ancestorResolverOverride(processNames);
  const overridePid = parseHarnessPidOverride();
  if (overridePid) return { pid: overridePid };
  const processNamesKey = processNames.join("|");
  const now = Date.now();
  if (ancestorCache && ancestorCache.processNamesKey === processNamesKey && now - ancestorCache.resolvedAt < ANCESTOR_CACHE_TTL_MS) {
    if (!ancestorCache.info) return undefined;
    if (isProcessAlive(ancestorCache.info.pid)) return ancestorCache.info;
    ancestorCache = undefined;
  }
  const envProcessNames = process.env.BABYSITTER_HARNESS_PROCESS_NAMES?.split(",").map((s) => s.trim()).filter(Boolean);
  const targets = [...processNames, ...(envProcessNames || [])].map((n) => n.toLowerCase().replace(/\.exe$/, ""));
  let pid = process.pid;
  let highestMatch: AncestorInfo | undefined;
  for (let depth = 0; depth < 100; depth++) {
    const info = getParentInfo(pid);
    if (!info) break;
    const base = normalizeProcName(info.name || "");
    if (targets.includes(base)) highestMatch = { pid, startTime: info.startTime };
    if (!Number.isFinite(info.ppid) || info.ppid <= 0 || info.ppid === pid) break;
    pid = info.ppid;
  }
  if (highestMatch && !isProcessAlive(highestMatch.pid)) highestMatch = undefined;
  ancestorCache = { info: highestMatch, resolvedAt: now, processNamesKey };
  return highestMatch;
}

export { parseHarnessPidOverride };
