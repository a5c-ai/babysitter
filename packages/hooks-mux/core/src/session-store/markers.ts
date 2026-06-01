/**
 * PID-based session marker mechanism (default-off).
 *
 * Ported from SDK `packages/sdk/src/utils/sessionMarker.ts`.
 *
 * All operations are gated behind env var AGENT_HOOKS_PROXY_ENABLE_PID_MARKERS.
 * When the env var is not set to "1", all functions are no-ops.
 *
 * Marker files live at:
 *   ~/.a5c/current-session-{harness}-pid-{ancestorPid}
 */

import * as path from 'path';
import * as os from 'os';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  unlinkSync,
} from 'fs';
import { execSync } from 'child_process';

// ---------------------------------------------------------------------------
// Enable gate
// ---------------------------------------------------------------------------

export const SESSION_PID_MARKER_ENV_VAR = 'AGENT_HOOKS_PROXY_ENABLE_PID_MARKERS';

export function isSessionPidMarkerEnabled(): boolean {
  const raw = process.env[SESSION_PID_MARKER_ENV_VAR];
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true';
}

// ---------------------------------------------------------------------------
// Global state dir
// ---------------------------------------------------------------------------

function getGlobalStateDir(): string {
  return path.join(os.homedir(), '.a5c');
}

// ---------------------------------------------------------------------------
// Process liveness check (cross-platform)
// ---------------------------------------------------------------------------

function isProcessAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) return false;

  if (process.platform === 'win32') {
    try {
      const out = execSync(
        `tasklist /FI "PID eq ${pid}" /NH /FO CSV`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 3000 },
      );
      return out.includes(`"${pid}"`);
    } catch {
      return false;
    }
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'EPERM') return true;
    return false;
  }
}

// ---------------------------------------------------------------------------
// Ancestor walk
// ---------------------------------------------------------------------------

interface ParentInfo {
  ppid: number;
  name: string;
}

function runCmd(cmd: string, timeoutMs = 5000): string {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: timeoutMs,
  });
}

type WindowsStrategy = 'powershell' | 'wmic' | 'tasklist-incapable';
let cachedWindowsStrategy: WindowsStrategy | undefined;

function parsePosixPs(pid: number): ParentInfo | undefined {
  try {
    const out = runCmd(`ps -p ${pid} -o ppid=,comm=`).trim();
    const match = out.match(/^\s*(\d+)\s+(\S+)\s*$/);
    if (!match) return undefined;
    const ppid = parseInt(match[1], 10);
    const name = path.basename(match[2]);
    return { ppid, name };
  } catch {
    return undefined;
  }
}

function parseWindowsViaPowershell(pid: number): ParentInfo | undefined {
  try {
    const script = `Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\" | Select-Object ParentProcessId,Name | ConvertTo-Json -Compress`;
    const out = runCmd(`powershell -NoProfile -Command "${script}"`).trim();
    if (!out) return undefined;
    const parsed = JSON.parse(out) as
      | { ParentProcessId?: number; Name?: string }
      | Array<{ ParentProcessId?: number; Name?: string }>;
    const entry = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!entry) return undefined;
    const ppid = typeof entry.ParentProcessId === 'number' ? entry.ParentProcessId : NaN;
    const name = entry.Name ? String(entry.Name) : '';
    if (!Number.isFinite(ppid) || !name) return undefined;
    return { ppid, name };
  } catch {
    return undefined;
  }
}

function parseWindowsViaWmic(pid: number): ParentInfo | undefined {
  try {
    const out = runCmd(
      `wmic process where ProcessId=${pid} get ParentProcessId,Name /format:csv`,
    ).trim();
    const lines = out.split(/\r?\n/).filter((l) => l.includes(','));
    if (lines.length < 2) return undefined;
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const row = lines[1].split(',');
    const nameIdx = header.indexOf('name');
    const ppidIdx = header.indexOf('parentprocessid');
    if (nameIdx < 0 || ppidIdx < 0) return undefined;
    const name = (row[nameIdx] || '').trim();
    const ppid = parseInt((row[ppidIdx] || '').trim(), 10);
    if (!Number.isFinite(ppid) || !name) return undefined;
    return { ppid, name };
  } catch {
    return undefined;
  }
}

function parseWindows(pid: number): ParentInfo | undefined {
  if (cachedWindowsStrategy === 'powershell') {
    const info = parseWindowsViaPowershell(pid);
    if (info) return info;
  } else if (cachedWindowsStrategy === 'wmic') {
    const info = parseWindowsViaWmic(pid);
    if (info) return info;
  } else if (cachedWindowsStrategy === 'tasklist-incapable') {
    return undefined;
  }

  const psInfo = parseWindowsViaPowershell(pid);
  if (psInfo) {
    cachedWindowsStrategy = 'powershell';
    return psInfo;
  }
  const wmicInfo = parseWindowsViaWmic(pid);
  if (wmicInfo) {
    cachedWindowsStrategy = 'wmic';
    return wmicInfo;
  }
  cachedWindowsStrategy = 'tasklist-incapable';
  return undefined;
}

function getParentInfo(pid: number): ParentInfo | undefined {
  if (process.platform === 'win32') return parseWindows(pid);
  return parsePosixPs(pid);
}

function normalizeProcName(name: string): string {
  return path.basename(name).toLowerCase().replace(/\.exe$/, '');
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let ancestorResolverOverride:
  | ((processNames: string[]) => { pid: number; name: string } | null)
  | undefined;

export function __setAncestorResolverForTests(
  fn: ((processNames: string[]) => { pid: number; name: string } | null) | undefined,
): void {
  ancestorResolverOverride = fn;
}

export function __resetCacheForTests(): void {
  cachedWindowsStrategy = undefined;
  ancestorResolverOverride = undefined;
}

// ---------------------------------------------------------------------------
// Public: find harness ancestor PID
// ---------------------------------------------------------------------------

/**
 * Walk the process tree upward looking for a process matching one of the
 * given harness names. Returns the matching PID and process name, or null.
 */
export function findHarnessAncestorPid(
  harnessNames: string[],
): { pid: number; name: string } | null {
  if (!isSessionPidMarkerEnabled()) return null;

  if (ancestorResolverOverride) return ancestorResolverOverride(harnessNames);

  const targets = harnessNames.map((n) => n.toLowerCase().replace(/\.exe$/, ''));

  let pid = process.pid;
  let highestMatch: { pid: number; name: string } | null = null;

  for (let depth = 0; depth < 100; depth++) {
    const info = getParentInfo(pid);
    if (!info) break;

    const base = normalizeProcName(info.name || '');
    if (targets.includes(base)) {
      highestMatch = { pid, name: base };
    }

    if (!Number.isFinite(info.ppid) || info.ppid <= 0 || info.ppid === pid) break;
    pid = info.ppid;
  }

  if (highestMatch && !isProcessAlive(highestMatch.pid)) {
    highestMatch = null;
  }

  return highestMatch;
}

// ---------------------------------------------------------------------------
// Harness slug & paths
// ---------------------------------------------------------------------------

function sanitizeHarnessSlug(harness: string): string {
  return harness
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getSessionMarkerPath(harness: string, ancestorPid: number): string {
  const slug = sanitizeHarnessSlug(harness) || 'harness';
  return path.join(getGlobalStateDir(), `current-session-${slug}-pid-${ancestorPid}`);
}

function deriveProcessNames(harness: string): string[] {
  const slug = sanitizeHarnessSlug(harness);
  try {
    const { getPluginTargetDescriptor } = require("@a5c-ai/atlas/catalog") as { getPluginTargetDescriptor: (id: string) => { processNames?: string[]; cliCommand?: string } | undefined };
    // Try exact match first, then common aliases
    const target = getPluginTargetDescriptor(slug)
      ?? getPluginTargetDescriptor(slug === "claude" ? "claude-code" : slug)
      ?? getPluginTargetDescriptor(slug === "gemini" ? "gemini-cli" : slug)
      ?? getPluginTargetDescriptor(slug === "copilot" ? "github-copilot" : slug);
    if (target?.processNames?.length) return target.processNames;
    if (target?.cliCommand) return [target.cliCommand];
  } catch {
    // Catalog unavailable at runtime — fall through to slug
  }
  return [slug];
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

/**
 * Write a session marker file for the given harness.
 *
 * Writes `sessionId` to `~/.a5c/current-session-{harness}-pid-{ancestorPid}`.
 * No-op if PID markers are disabled or no ancestor harness process is found.
 */
export function writeSessionMarker(harness: string, sessionId: string): void {
  if (!isSessionPidMarkerEnabled()) return;

  const ancestor = findHarnessAncestorPid(deriveProcessNames(harness));
  if (!ancestor) return;

  const target = getSessionMarkerPath(harness, ancestor.pid);
  atomicWriteString(target, `${sessionId}\n`);
}

/**
 * Read the session ID from a marker file for the given harness.
 *
 * Returns null if PID markers are disabled, no ancestor found, or no marker file exists.
 */
export function readSessionMarker(harness: string): string | null {
  if (!isSessionPidMarkerEnabled()) return null;

  const ancestor = findHarnessAncestorPid(deriveProcessNames(harness));
  if (!ancestor) return null;
  if (!isProcessAlive(ancestor.pid)) return null;

  const target = getSessionMarkerPath(harness, ancestor.pid);
  if (!existsSync(target)) return null;

  try {
    const content = readFileSync(target, 'utf8').trim();
    return content || null;
  } catch {
    return null;
  }
}

/**
 * Remove the session marker file for the given harness.
 *
 * No-op if PID markers are disabled or no ancestor found.
 */
export function cleanupSessionMarker(harness: string): void {
  if (!isSessionPidMarkerEnabled()) return;

  const ancestor = findHarnessAncestorPid(deriveProcessNames(harness));
  if (!ancestor) return;

  const target = getSessionMarkerPath(harness, ancestor.pid);
  try {
    unlinkSync(target);
  } catch {
    // Ignore -- file may not exist
  }
}
