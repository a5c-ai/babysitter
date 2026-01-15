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
  runFiles: RunFileItem[];
  importantFiles: RunFileItem[];
  keyFilesMeta: KeyFilesMeta;
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

function safeLstat(filePath: string): fs.Stats | undefined {
  try {
    return fs.lstatSync(filePath);
  } catch {
    return undefined;
  }
}

function safeDirReadable(dirPath: string): { readable: boolean; error?: string } {
  try {
    fs.readdirSync(dirPath);
    return { readable: true };
  } catch (err) {
    const errno = err as NodeJS.ErrnoException | undefined;
    if (errno?.code === 'EACCES' || errno?.code === 'EPERM') {
      return { readable: false, error: 'Run folder is not readable.' };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { readable: false, error: message };
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
      const isDirectory = dirent.isDirectory();
      const stat = !isDirectory ? safeStat(abs) : undefined;

      results.push({
        relPath,
        fsPath: abs,
        isDirectory,
        size: stat ? stat.size : null,
        mtimeMs: stat ? stat.mtimeMs : null,
      });

      if (isDirectory && !dirent.isSymbolicLink()) stack.push(abs);
    }
  }

  results.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return results;
}

function listFilesRecursiveFilesOnly(params: {
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
      if (dirent.isSymbolicLink()) continue;

      const abs = path.join(current, dirent.name);
      if (dirent.isDirectory()) {
        stack.push(abs);
        continue;
      }

      if (!dirent.isFile()) continue;

      const stat = safeStat(abs);
      if (!stat || !stat.isFile()) continue;

      const relPath = path.relative(normalizedRoot, abs);
      results.push({
        relPath,
        fsPath: abs,
        isDirectory: false,
        size: stat.size,
        mtimeMs: stat.mtimeMs,
      });
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

export type KeyFilesMeta = {
  runRoot: string;
  runRootExists: boolean;
  runRootReadable: boolean;
  runRootError?: string;
  truncated: boolean;
  totalFiles: number;
};

function buildRunFileItemIfRegularFile(params: {
  runRoot: string;
  fsPath: string;
}): RunFileItem | undefined {
  if (!isFsPathInsideRoot(params.runRoot, params.fsPath)) return undefined;

  const lst = safeLstat(params.fsPath);
  if (!lst || lst.isSymbolicLink()) return undefined;

  const stat = safeStat(params.fsPath);
  if (!stat || !stat.isFile()) return undefined;

  const relPath = path.relative(path.resolve(params.runRoot), params.fsPath);
  return {
    relPath,
    fsPath: params.fsPath,
    isDirectory: false,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
  };
}

function discoverKeyFiles(params: { run: Run; maxRunFiles: number }): {
  runFiles: RunFileItem[];
  importantFiles: RunFileItem[];
  keyFilesMeta: KeyFilesMeta;
} {
  const runRoot = params.run.paths.runRoot;

  let runRootExists = false;
  let runRootReadable = false;
  let runRootError: string | undefined;

  try {
    const stat = fs.statSync(runRoot);
    runRootExists = stat.isDirectory();
    if (runRootExists) {
      const readable = safeDirReadable(runRoot);
      runRootReadable = readable.readable;
      runRootError = readable.error;
    }
  } catch (err) {
    const errno = err as NodeJS.ErrnoException | undefined;
    if (errno?.code === 'ENOENT') {
      runRootExists = false;
      runRootReadable = false;
    } else if (errno?.code === 'EACCES' || errno?.code === 'EPERM') {
      runRootExists = true;
      runRootReadable = false;
      runRootError = 'Run folder is not readable.';
    } else {
      const message = err instanceof Error ? err.message : String(err);
      runRootError = message;
    }
  }

  let rawRunFiles: RunFileItem[] = [];
  if (runRootReadable) {
    rawRunFiles = listFilesRecursiveFilesOnly({
      dir: runRoot,
      rootForRel: runRoot,
      maxFiles: params.maxRunFiles + 1,
    });
  }

  const truncated = rawRunFiles.length > params.maxRunFiles;
  const runFiles = truncated ? rawRunFiles.slice(0, params.maxRunFiles) : rawRunFiles;

  const importantFsPaths = [
    params.run.paths.stateJson,
    params.run.paths.journalJsonl,
    params.run.paths.mainJs,
    path.join(runRoot, 'process.md'),
    path.join(runRoot, 'artifacts', 'process.md'),
    path.join(runRoot, 'code', 'main.js'),
    path.join(runRoot, 'run', 'process.md'),
    path.join(runRoot, 'run', 'artifacts', 'process.md'),
    path.join(runRoot, 'run', 'code', 'main.js'),
  ]
    .map((p) => path.resolve(p))
    .filter((p, idx, all) => all.indexOf(p) === idx);

  const importantFiles = importantFsPaths
    .map((fsPath) => buildRunFileItemIfRegularFile({ runRoot, fsPath }))
    .filter((v): v is RunFileItem => Boolean(v))
    .sort((a, b) => a.relPath.localeCompare(b.relPath));

  return {
    runFiles,
    importantFiles,
    keyFilesMeta: {
      runRoot,
      runRootExists,
      runRootReadable,
      ...(runRootError ? { runRootError } : {}),
      truncated,
      totalFiles: runFiles.length,
    },
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

  const prompts = (() => {
    const runRoot = params.run.paths.runRoot;
    const candidates = [params.run.paths.promptsDir, path.join(runRoot, 'run', 'prompts')];

    const merged: RunFileItem[] = [];
    const seen = new Set<string>();

    for (const dir of candidates) {
      const items = listFilesRecursiveFilesOnly({
        dir,
        rootForRel: runRoot,
        maxFiles: Math.max(0, params.maxPrompts) + 1,
      });
      for (const item of items) {
        if (!item || typeof item.fsPath !== 'string') continue;
        const key = path.resolve(item.fsPath);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
    }

    merged.sort((a, b) => {
      const aTime = a.mtimeMs ?? -1;
      const bTime = b.mtimeMs ?? -1;
      if (aTime !== bTime) return bTime - aTime;
      return a.relPath.localeCompare(b.relPath);
    });

    return merged.slice(0, Math.max(0, params.maxPrompts));
  })();

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

  const keyFiles = discoverKeyFiles({ run: params.run, maxRunFiles: 2000 });

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
      runFiles: keyFiles.runFiles,
      importantFiles: keyFiles.importantFiles,
      keyFilesMeta: keyFiles.keyFilesMeta,
    },
    nextJournalEntries,
  };
}
