import * as fs from 'fs';
import * as path from 'path';

import type { Run } from '../core/run';
import { listFilesRecursive, type RunFileItem } from '../core/runDetailsSnapshot';

export type KeyFilesItem = RunFileItem & {
  id: string;
  group: string;
  displayName: string;
  exists: boolean;
};

export type KeyFilesMeta = {
  runRoot: string;
  runRootExists: boolean;
  runRootReadable: boolean;
  runRootError?: string;
  truncated: boolean;
  totalFiles: number;
};

export type KeyFilesSnapshotAugment = {
  runFiles: KeyFilesItem[];
  importantFiles: KeyFilesItem[];
  keyFilesMeta: KeyFilesMeta;
};

function safeStat(p: string): fs.Stats | undefined {
  try {
    return fs.statSync(p);
  } catch {
    return undefined;
  }
}

function safeAccessReadable(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function computeKeyFilesGroupForRelPath(relPath: string): string {
  const normalized = relPath.replace(/\\/g, '/');
  const p = normalized.startsWith('run/') ? normalized.slice('run/'.length) : normalized;
  if (p === 'code/main.js' || p.startsWith('code/')) return 'Code';
  if (p.startsWith('artifacts/')) return 'Artifacts';
  if (p.startsWith('journal/') || p.endsWith('.log') || p === 'journal.jsonl') return 'Logs';
  if (p.startsWith('state/') || p === 'state.json' || p === 'process.md') return 'Process';
  if (p.startsWith('prompts/') || p.startsWith('work_summaries/')) return 'Process';
  return 'Other';
}

function toKeyFilesItemFromRunFile(params: { item: RunFileItem; runRoot: string }): KeyFilesItem {
  const relPath = typeof params.item.relPath === 'string' ? params.item.relPath : '';
  const displayName = relPath ? path.basename(relPath) : path.basename(params.item.fsPath ?? '');
  return {
    ...params.item,
    id: relPath || params.item.fsPath,
    group: computeKeyFilesGroupForRelPath(relPath),
    displayName,
    exists: true,
  };
}

function buildImportantFile(params: {
  runRoot: string;
  fsPath: string;
  displayName: string;
  group: string;
}): KeyFilesItem | undefined {
  const stat = safeStat(params.fsPath);
  if (!stat || !stat.isFile()) return undefined;
  const relPath = path.relative(path.resolve(params.runRoot), params.fsPath);
  return {
    relPath,
    fsPath: params.fsPath,
    isDirectory: false,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    id: relPath || params.fsPath,
    group: params.group,
    displayName: params.displayName || path.basename(relPath),
    exists: true,
  };
}

export function buildKeyFilesSnapshotAugment(params: {
  run: Run;
  maxRunFiles?: number;
}): KeyFilesSnapshotAugment {
  const maxRunFiles = params.maxRunFiles ?? 2000;
  const runRoot = params.run.paths.runRoot;

  let runRootExists = false;
  let runRootReadable = false;
  let runRootError: string | undefined;
  try {
    const stat = fs.statSync(runRoot);
    runRootExists = stat.isDirectory();
    runRootReadable = runRootExists && safeAccessReadable(runRoot);
    if (runRootExists && !runRootReadable) runRootError = 'Run folder is not readable.';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    runRootError = message;
  }

  let rawRunFiles: RunFileItem[] = [];
  if (runRootReadable) {
    rawRunFiles = listFilesRecursive({
      dir: runRoot,
      rootForRel: runRoot,
      maxFiles: maxRunFiles + 1,
    });
  }

  const truncated = rawRunFiles.length > maxRunFiles;
  if (truncated) rawRunFiles = rawRunFiles.slice(0, maxRunFiles);
  const runFiles = rawRunFiles.map((item) => toKeyFilesItemFromRunFile({ item, runRoot }));

  const importantCandidates: Array<{ fsPath: string; displayName: string; group: string }> = [
    { fsPath: params.run.paths.stateJson, displayName: 'state.json', group: 'Process' },
    { fsPath: params.run.paths.journalJsonl, displayName: 'journal.jsonl', group: 'Logs' },
    { fsPath: params.run.paths.mainJs, displayName: 'code/main.js', group: 'Code' },
  ];

  const importantFiles = importantCandidates
    .map((c) =>
      buildImportantFile({ runRoot, fsPath: c.fsPath, displayName: c.displayName, group: c.group }),
    )
    .filter((v): v is KeyFilesItem => Boolean(v));

  return {
    runFiles,
    importantFiles,
    keyFilesMeta: {
      runRoot,
      runRootExists,
      runRootReadable,
      ...(runRootError ? { runRootError } : {}),
      truncated,
      totalFiles: rawRunFiles.length,
    },
  };
}

export function groupOrderIndex(group: string): number {
  const order = ['Process', 'Code', 'Artifacts', 'Logs', 'Other'];
  const idx = order.indexOf(group);
  return idx === -1 ? order.length : idx;
}

export function matchesKeyFilesFilter(
  item: { relPath?: unknown; displayName?: unknown } | undefined,
  filterLower: string,
): boolean {
  if (!filterLower) return true;
  const rel = (item && typeof item.relPath === 'string' ? item.relPath : '').toLowerCase();
  const name = (item && typeof item.displayName === 'string' ? item.displayName : '').toLowerCase();
  return rel.includes(filterLower) || name.includes(filterLower);
}

export function normalizePinnedIdsByRunId(input: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!input || typeof input !== 'object') return out;
  for (const [runId, ids] of Object.entries(input as Record<string, unknown>)) {
    if (typeof runId !== 'string' || !Array.isArray(ids)) continue;
    const cleaned: string[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      if (typeof id !== 'string') continue;
      const trimmed = id.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      cleaned.push(trimmed);
    }
    if (cleaned.length > 0) out[runId] = cleaned;
  }
  return out;
}

export function getPinnedIdsForRun(pinnedIdsByRunId: unknown, runId: string): string[] {
  if (typeof runId !== 'string' || !runId) return [];
  const normalized = normalizePinnedIdsByRunId(pinnedIdsByRunId);
  return normalized[runId] ?? [];
}

export function setPinnedIdsForRun(
  pinnedIdsByRunId: unknown,
  runId: string,
  ids: readonly string[],
): Record<string, string[]> {
  const normalized = normalizePinnedIdsByRunId(pinnedIdsByRunId);
  const next: Record<string, string[]> = { ...normalized };
  const cleaned = normalizePinnedIdsByRunId({ [runId]: Array.from(ids) })[runId] ?? [];
  if (cleaned.length === 0) delete next[runId];
  else next[runId] = cleaned;
  return next;
}

export function togglePinnedId(ids: readonly string[], fileId: string): string[] {
  const current = Array.isArray(ids) ? ids.filter((v) => typeof v === 'string') : [];
  if (typeof fileId !== 'string' || !fileId.trim()) return current;
  return current.includes(fileId)
    ? current.filter((id) => id !== fileId)
    : current.concat([fileId]);
}

export type GroupedKeyFiles = Array<{ group: string; items: KeyFilesItem[] }>;

export function groupKeyFiles(items: readonly KeyFilesItem[]): GroupedKeyFiles {
  const groups: Record<string, KeyFilesItem[]> = {};
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const group = typeof item.group === 'string' && item.group ? item.group : 'Other';
    (groups[group] ??= []).push(item);
  }
  const groupKeys = Object.keys(groups).sort((a, b) => {
    const ai = groupOrderIndex(a);
    const bi = groupOrderIndex(b);
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  });
  return groupKeys.map((group) => {
    const sorted = groups[group]!.slice().sort((a, b) => {
      const ar = (a.relPath ?? '').toString();
      const br = (b.relPath ?? '').toString();
      const byRel = ar.localeCompare(br);
      if (byRel !== 0) return byRel;
      return (a.id ?? '').toString().localeCompare((b.id ?? '').toString());
    });
    return { group, items: sorted };
  });
}

export type KeyFilesModel = {
  runId: string;
  runRoot: string;
  keyFilesMeta?: KeyFilesMeta;
  pillText: string;
  emptyMessage?: string;
  showRunActions: boolean;
  canRevealRunRoot: boolean;
  canCopyRunRoot: boolean;
  filterLower: string;
  nextPinnedIds?: string[];
  groupedPinned: GroupedKeyFiles;
  groupedImportant: GroupedKeyFiles;
  groupedAll: GroupedKeyFiles;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return value;
  return value === null ? null : null;
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function computeKeyFilesModel(params: {
  snapshot: unknown;
  filterValue: string;
  pinnedIdsByRunId: unknown;
}): KeyFilesModel {
  const snapshot =
    params && typeof params === 'object' ? (params as { snapshot?: unknown }).snapshot : undefined;
  const snapshotRecord = isRecord(snapshot) ? snapshot : undefined;

  const runRecord =
    snapshotRecord && isRecord(snapshotRecord['run']) ? snapshotRecord['run'] : undefined;
  const runId = getString(runRecord?.['id']) ?? '';
  const runPathsRecord = runRecord && isRecord(runRecord['paths']) ? runRecord['paths'] : undefined;
  const runRoot = getString(runPathsRecord?.['runRoot']) ?? '';

  const keyFilesMetaRecord =
    snapshotRecord && isRecord(snapshotRecord['keyFilesMeta'])
      ? snapshotRecord['keyFilesMeta']
      : undefined;
  const runRootError =
    typeof keyFilesMetaRecord?.['runRootError'] === 'string'
      ? keyFilesMetaRecord['runRootError']
      : undefined;
  const keyFilesMeta: KeyFilesMeta | undefined = keyFilesMetaRecord
    ? {
        runRoot: getString(keyFilesMetaRecord['runRoot']) ?? runRoot,
        runRootExists: getBoolean(keyFilesMetaRecord['runRootExists']) ?? false,
        runRootReadable: getBoolean(keyFilesMetaRecord['runRootReadable']) ?? false,
        ...(runRootError ? { runRootError } : {}),
        truncated: getBoolean(keyFilesMetaRecord['truncated']) ?? false,
        totalFiles:
          typeof keyFilesMetaRecord['totalFiles'] === 'number'
            ? keyFilesMetaRecord['totalFiles']
            : 0,
      }
    : undefined;
  const runRootExists = Boolean(keyFilesMeta?.runRootExists);
  const runRootReadable = Boolean(keyFilesMeta?.runRootReadable);

  const runFilesRaw: unknown[] =
    snapshotRecord && Array.isArray(snapshotRecord['runFiles']) ? snapshotRecord['runFiles'] : [];
  const importantFilesRaw: unknown[] =
    snapshotRecord && Array.isArray(snapshotRecord['importantFiles'])
      ? snapshotRecord['importantFiles']
      : [];

  const normalizeItem = (raw: unknown): KeyFilesItem | undefined => {
    if (!isRecord(raw)) return undefined;
    const relPath = getString(raw['relPath']) ?? '';
    const fsPath = getString(raw['fsPath']) ?? '';
    if (!fsPath) return undefined;
    const id = typeof raw['id'] === 'string' && raw['id'] ? raw['id'] : relPath || fsPath;
    if (!id) return undefined;
    const isDirectory = Boolean(raw['isDirectory']);
    const group =
      typeof raw['group'] === 'string' && raw['group']
        ? raw['group']
        : computeKeyFilesGroupForRelPath(relPath);
    const displayName =
      typeof raw['displayName'] === 'string' && raw['displayName']
        ? raw['displayName']
        : relPath
          ? relPath
          : fsPath;
    const exists = raw['exists'] === false ? false : true;
    return {
      relPath,
      fsPath,
      isDirectory,
      size: getNumberOrNull(raw['size']),
      mtimeMs: getNumberOrNull(raw['mtimeMs']),
      id,
      group,
      displayName,
      exists,
    };
  };

  const runFiles = runFilesRaw
    .map(normalizeItem)
    .filter((v): v is KeyFilesItem => Boolean(v))
    .filter((v) => !v.isDirectory && v.exists !== false);
  const byId = new Map(runFiles.map((f) => [f.id, f]));

  const pinnedIds = getPinnedIdsForRun(params.pinnedIdsByRunId, runId);
  const pinnedItems: KeyFilesItem[] = [];
  const keptPinnedIds: string[] = [];
  for (const id of pinnedIds) {
    const item = byId.get(id);
    if (!item || item.exists === false) continue;
    pinnedItems.push(item);
    keptPinnedIds.push(id);
  }

  const pinnedSet = new Set(pinnedItems.map((f) => f.id));
  const importantItems = importantFilesRaw
    .map(normalizeItem)
    .filter((v): v is KeyFilesItem => Boolean(v))
    .filter((v) => !v.isDirectory && v.exists !== false && !pinnedSet.has(v.id));

  const importantSet = new Set(importantItems.map((f) => f.id));
  const remainingItems = runFiles.filter(
    (f) => f.exists !== false && !pinnedSet.has(f.id) && !importantSet.has(f.id),
  );

  const filterLower = (params.filterValue || '').toString().trim().toLowerCase();
  const filteredPinned = pinnedItems.filter((f) => matchesKeyFilesFilter(f, filterLower));
  const filteredImportant = importantItems.filter((f) => matchesKeyFilesFilter(f, filterLower));
  const filteredRemaining = remainingItems.filter((f) => matchesKeyFilesFilter(f, filterLower));

  const pillSuffix = keyFilesMeta?.truncated ? ' \u2022 truncated' : '';
  const pillText =
    String(importantItems.length) +
    ' important \u2022 ' +
    String(pinnedItems.length) +
    ' pinned \u2022 ' +
    String(runFiles.length) +
    ' files' +
    pillSuffix;

  const hasAny = pinnedItems.length > 0 || importantItems.length > 0 || runFiles.length > 0;
  const anyFiltered =
    filteredPinned.length > 0 || filteredImportant.length > 0 || filteredRemaining.length > 0;

  let emptyMessage: string | undefined;
  if (!hasAny) {
    if (keyFilesMeta && !runRootExists) emptyMessage = 'Run folder is missing.';
    else if (keyFilesMeta && runRootExists && !runRootReadable)
      emptyMessage = keyFilesMeta.runRootError || 'Run folder is not readable.';
    else emptyMessage = 'No key files found yet for this run.';
  } else if (filterLower && !anyFiltered) {
    emptyMessage = 'No files match the current filter.';
  }

  return {
    runId,
    runRoot,
    ...(keyFilesMeta ? { keyFilesMeta } : {}),
    pillText,
    ...(emptyMessage ? { emptyMessage } : {}),
    showRunActions: Boolean(emptyMessage) && Boolean(runRoot),
    canRevealRunRoot: Boolean(runRoot) && (!keyFilesMeta || runRootExists),
    canCopyRunRoot: Boolean(runRoot),
    filterLower,
    ...(keptPinnedIds.length !== pinnedIds.length ? { nextPinnedIds: keptPinnedIds } : {}),
    groupedPinned: groupKeyFiles(filteredPinned),
    groupedImportant: groupKeyFiles(filteredImportant),
    groupedAll: groupKeyFiles(filteredRemaining),
  };
}
