import * as fs from 'fs';
import * as path from 'path';

import { isRunId } from './runId';

export function listRunIds(runsRootPath: string): string[] {
  try {
    const dirents = fs.readdirSync(runsRootPath, { withFileTypes: true });
    return dirents
      .filter((d) => d.isDirectory() && isRunId(d.name))
      .map((d) => d.name)
      .sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}

function parseRunIdTimestampMs(runId: string): number | undefined {
  const match = runId.match(/\brun-(\d{8})-(\d{6})\b/) ?? runId.match(/\b(\d{8})-(\d{6})\b/);
  if (!match) return undefined;
  const yyyymmdd = match[1];
  const hhmmss = match[2];
  if (!yyyymmdd || !hhmmss) return undefined;

  const year = Number(yyyymmdd.slice(0, 4));
  const month = Number(yyyymmdd.slice(4, 6));
  const day = Number(yyyymmdd.slice(6, 8));
  const hour = Number(hhmmss.slice(0, 2));
  const minute = Number(hhmmss.slice(2, 4));
  const second = Number(hhmmss.slice(4, 6));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second)
  ) {
    return undefined;
  }

  const dt = new Date(year, month - 1, day, hour, minute, second, 0);
  const ms = dt.getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

function bestEffortDirTimeMs(dirPath: string, runId: string): number | undefined {
  try {
    const stat = fs.statSync(dirPath);
    const byBirth = stat.birthtimeMs;
    if (Number.isFinite(byBirth) && byBirth > 0) return byBirth;
    const byCtime = stat.ctimeMs;
    if (Number.isFinite(byCtime) && byCtime > 0) return byCtime;
    const byMtime = stat.mtimeMs;
    if (Number.isFinite(byMtime) && byMtime > 0) return byMtime;
  } catch {
    // ignore
  }
  return parseRunIdTimestampMs(runId);
}

function chooseBestNewRunId(params: {
  runsRootPath: string;
  candidates: string[];
  afterTimeMs?: number;
}): string {
  if (params.candidates.length === 1) return params.candidates[0]!;
  if (params.afterTimeMs === undefined) return params.candidates[0]!;

  const afterMs = params.afterTimeMs;
  const scored = params.candidates.map((id) => {
    const dirPath = path.join(params.runsRootPath, id);
    const timeMs = bestEffortDirTimeMs(dirPath, id);
    const deltaMs = timeMs === undefined ? Number.POSITIVE_INFINITY : timeMs - afterMs;
    return { id, timeMs, deltaMs };
  });

  const nonNegative = scored.filter((s) => Number.isFinite(s.deltaMs) && s.deltaMs >= 0);
  if (nonNegative.length > 0) {
    nonNegative.sort((a, b) => a.deltaMs - b.deltaMs || a.id.localeCompare(b.id));
    return nonNegative[0]!.id;
  }

  const withTime = scored.filter((s) => s.timeMs !== undefined && Number.isFinite(s.timeMs));
  if (withTime.length > 0) {
    withTime.sort((a, b) => (b.timeMs! - a.timeMs!) || a.id.localeCompare(b.id));
    return withTime[0]!.id;
  }

  return params.candidates[0]!;
}

export async function waitForNewRunId(params: {
  runsRootPath: string;
  baselineIds: Set<string>;
  timeoutMs: number;
  pollIntervalMs?: number;
  signal?: AbortSignal;
  /**
   * Optional timestamp used to disambiguate when multiple new run directories exist.
   * If provided, selects the new run whose (best-effort) directory timestamp is closest after this time.
   */
  afterTimeMs?: number;
  /**
   * Number of consecutive polls the chosen id must remain the best candidate before returning.
   * Default: 2 when `afterTimeMs` is set; otherwise 1.
   */
  stablePolls?: number;
}): Promise<string | undefined> {
  const pollIntervalMs = params.pollIntervalMs ?? 250;
  const stablePolls = params.stablePolls ?? (params.afterTimeMs !== undefined ? 2 : 1);
  const start = Date.now();
  let lastPick: string | undefined;
  let stableCount = 0;

  const sleep = (ms: number): Promise<void> => {
    const signal = params.signal;
    if (!signal) return new Promise((r) => setTimeout(r, ms));
    if (signal.aborted) return Promise.resolve();
    return new Promise((resolve) => {
      let timer: NodeJS.Timeout;
      const onAbort = (): void => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        resolve();
      };
      timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      signal.addEventListener('abort', onAbort);
    });
  };

  while (Date.now() - start < params.timeoutMs) {
    if (params.signal?.aborted) return undefined;
    const current = listRunIds(params.runsRootPath);
    const candidates = current.filter((id) => !params.baselineIds.has(id));
    if (candidates.length > 0) {
      const pick = chooseBestNewRunId({
        runsRootPath: params.runsRootPath,
        candidates,
        ...(params.afterTimeMs !== undefined ? { afterTimeMs: params.afterTimeMs } : {}),
      });
      if (stablePolls <= 1) return pick;
      if (pick === lastPick) stableCount += 1;
      else {
        lastPick = pick;
        stableCount = 1;
      }
      if (stableCount >= stablePolls) return pick;
    }
    await sleep(pollIntervalMs);
  }
  return undefined;
}
