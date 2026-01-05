import * as fs from 'fs';
import * as path from 'path';

import { JournalTailer, type JournalTailResult } from './journal';
import type { Run } from './run';
import { readStateJsonFile, type ReadStateJsonResult } from './stateJson';
import {
  detectAwaitingInputFromJournal,
  detectAwaitingInputFromState,
  type AwaitingInputStatus,
} from './awaitingInput';

export type RunView = Omit<Run, 'timestamps'> & {
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
};

export type RunFileItem = {
  relPath: string;
  fsPath: string;
  isDirectory: boolean;
  size: number | null;
  mtimeMs: number | null;
};

export type TextFileReadResult = {
  content: string;
  truncated: boolean;
  size: number;
};

export type JournalErrorView = {
  line: number;
  source: string;
  message: string;
};

export type JournalView = {
  entries: unknown[];
  errors: JournalErrorView[];
  truncated: boolean;
  position: number;
};

export type RunDetailsSnapshot = {
  run: RunView;
  state: ReadStateJsonResult;
  journal: JournalView;
  awaitingInput?: AwaitingInputStatus;
  workSummaries: RunFileItem[];
  prompts: RunFileItem[];
  artifacts: RunFileItem[];
  mainJs: RunFileItem | null;
};

function normalizeForPlatform(p: string): string {
  const resolved = path.resolve(p);
  if (process.platform === 'win32') return resolved.toLowerCase();
  return resolved;
}

export function isFsPathInsideRoot(root: string, candidate: string): boolean {
  const normalizedRoot = normalizeForPlatform(root);
  const normalizedCandidate = normalizeForPlatform(candidate);

  if (normalizedCandidate === normalizedRoot) return true;
  const rootWithSep = normalizedRoot.endsWith(path.sep)
    ? normalizedRoot
    : `${normalizedRoot}${path.sep}`;
  return normalizedCandidate.startsWith(rootWithSep);
}

export function appendRollingWindow<T>(
  current: readonly T[],
  next: readonly T[],
  limit: number,
): T[] {
  if (limit <= 0) return [];
  if (current.length === 0) return next.slice(-limit);
  if (next.length === 0) return current.slice(-limit);
  const combined = current.concat(next);
  return combined.slice(-limit);
}

function safeStat(filePath: string): fs.Stats | undefined {
  try {
    return fs.statSync(filePath);
  } catch {
    return undefined;
  }
}

export function listFilesRecursive(params: {
  dir: string;
  rootForRel: string;
  maxFiles: number;
}): RunFileItem[] {
  const results: RunFileItem[] = [];
  const stack: string[] = [params.dir];
  const normalizedRoot = path.resolve(params.rootForRel);

  while (stack.length > 0 && results.length < params.maxFiles) {
    const current = stack.pop();
    if (!current) break;

    let dirents: fs.Dirent[];
    try {
      dirents = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const dirent of dirents) {
      if (results.length >= params.maxFiles) break;
      const abs = path.join(current, dirent.name);
      const relPath = path.relative(normalizedRoot, abs);
      const stat = safeStat(abs);
      const isDirectory = dirent.isDirectory();

      results.push({
        relPath,
        fsPath: abs,
        isDirectory,
        size: stat ? (isDirectory ? null : stat.size) : null,
        mtimeMs: stat ? stat.mtimeMs : null,
      });

      if (isDirectory && !dirent.isSymbolicLink()) stack.push(abs);
    }
  }

  results.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return results;
}

export function listFilesSortedByMtimeDesc(params: {
  dir: string;
  rootForRel: string;
  maxFiles: number;
}): RunFileItem[] {
  const items = listFilesRecursive(params);
  items.sort((a, b) => {
    const aTime = a.mtimeMs ?? -1;
    const bTime = b.mtimeMs ?? -1;
    if (aTime !== bTime) return bTime - aTime;
    return a.relPath.localeCompare(b.relPath);
  });
  return items;
}

export function readTextFileWithLimit(filePath: string, maxBytes: number): TextFileReadResult {
  const stat = safeStat(filePath);
  const size = stat?.isFile() ? stat.size : 0;

  const fd = fs.openSync(filePath, 'r');
  try {
    const toRead = Math.max(0, Math.min(maxBytes, size));
    const buffer = Buffer.allocUnsafe(toRead);
    const bytesRead = fs.readSync(fd, buffer, 0, toRead, 0);
    const content = buffer.subarray(0, bytesRead).toString('utf8');
    return { content, truncated: size > maxBytes, size };
  } finally {
    fs.closeSync(fd);
  }
}

function toJournalView(result: JournalTailResult): JournalView {
  return {
    entries: result.entries,
    errors: result.errors.map((e) => ({ line: e.line, source: e.source, message: e.message })),
    truncated: result.truncated,
    position: result.position,
  };
}

export function readRunDetailsSnapshot(params: {
  run: Run;
  journalTailer: JournalTailer;
  existingJournalEntries: readonly unknown[];
  maxJournalEntries: number;
  maxArtifacts: number;
  maxWorkSummaries: number;
  maxPrompts: number;
}): { snapshot: RunDetailsSnapshot; nextJournalEntries: unknown[] } {
  const state = readStateJsonFile(params.run.paths.stateJson);
  const tail = params.journalTailer.tail(params.run.paths.journalJsonl);
  const nextJournalEntries = appendRollingWindow(
    params.existingJournalEntries,
    tail.entries,
    params.maxJournalEntries,
  );
  const awaitingInput =
    detectAwaitingInputFromState(state.state) ?? detectAwaitingInputFromJournal(nextJournalEntries);

  const workSummaries = listFilesSortedByMtimeDesc({
    dir: params.run.paths.workSummariesDir,
    rootForRel: params.run.paths.workSummariesDir,
    maxFiles: params.maxWorkSummaries,
  });

  const prompts = listFilesSortedByMtimeDesc({
    dir: params.run.paths.promptsDir,
    rootForRel: params.run.paths.promptsDir,
    maxFiles: params.maxPrompts,
  });

  const artifacts = listFilesRecursive({
    dir: params.run.paths.artifactsDir,
    rootForRel: params.run.paths.artifactsDir,
    maxFiles: params.maxArtifacts,
  });

  const mainJsStat = safeStat(params.run.paths.mainJs);
  const mainJs =
    mainJsStat && mainJsStat.isFile()
      ? {
          relPath: path.relative(path.resolve(params.run.paths.runRoot), params.run.paths.mainJs),
          fsPath: params.run.paths.mainJs,
          isDirectory: false,
          size: mainJsStat.size,
          mtimeMs: mainJsStat.mtimeMs,
        }
      : null;

  return {
    snapshot: {
      run: {
        ...params.run,
        timestamps: {
          createdAt: params.run.timestamps.createdAt.toISOString(),
          updatedAt: params.run.timestamps.updatedAt.toISOString(),
        },
      },
      state,
      journal: toJournalView({ ...tail, entries: nextJournalEntries }),
      ...(awaitingInput ? { awaitingInput } : {}),
      workSummaries,
      prompts,
      artifacts,
      mainJs,
    },
    nextJournalEntries,
  };
}
