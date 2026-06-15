/**
 * Parallel file operations (GAP-PAR-005).
 *
 * Provides concurrency-limited helpers for reading, writing, and globbing
 * files in parallel. Uses a simple semaphore to cap concurrency without
 * external dependencies.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Concurrency limiter
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const idx = nextIndex++;
      results[idx] = await tasks[idx]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// readFilesParallel
// ---------------------------------------------------------------------------

export interface FileReadResult {
  path: string;
  content: string;
  error?: undefined;
}

export interface FileReadError {
  path: string;
  content?: undefined;
  error: string;
}

export type FileReadOutcome = FileReadResult | FileReadError;

/**
 * Read multiple files concurrently with a configurable concurrency limit.
 *
 * @param paths - Absolute or relative file paths to read.
 * @param concurrency - Max concurrent reads. Default: 8.
 * @returns An array of outcomes (one per input path, preserving order).
 */
export async function readFilesParallel(
  paths: string[],
  concurrency = 8,
): Promise<FileReadOutcome[]> {
  const tasks = paths.map((p) => async (): Promise<FileReadOutcome> => {
    try {
      const content = await fs.readFile(p, 'utf-8');
      return { path: p, content };
    } catch (err: unknown) {
      return { path: p, error: err instanceof Error ? err.message : String(err) };
    }
  });
  return runWithConcurrency(tasks, concurrency);
}

// ---------------------------------------------------------------------------
// writeFilesParallel
// ---------------------------------------------------------------------------

export interface FileWriteEntry {
  path: string;
  content: string;
}

export interface FileWriteResult {
  path: string;
  ok: boolean;
  error?: string;
}

/**
 * Write multiple files concurrently with a configurable concurrency limit.
 * Creates parent directories as needed.
 *
 * @param entries - File path + content pairs.
 * @param concurrency - Max concurrent writes. Default: 8.
 */
export async function writeFilesParallel(
  entries: FileWriteEntry[],
  concurrency = 8,
): Promise<FileWriteResult[]> {
  const tasks = entries.map((entry) => async (): Promise<FileWriteResult> => {
    try {
      const dir = entry.path.replace(/[\\/][^\\/]+$/, '');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(entry.path, entry.content, 'utf-8');
      return { path: entry.path, ok: true };
    } catch (err: unknown) {
      return {
        path: entry.path,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
  return runWithConcurrency(tasks, concurrency);
}

// ---------------------------------------------------------------------------
// globParallel
// ---------------------------------------------------------------------------

/**
 * Run multiple glob patterns in parallel and return merged results.
 *
 * Uses a simple recursive readdir + minimatch-style check.
 * For production use, consider swapping in a dedicated glob library.
 *
 * @param patterns - Glob patterns (only `*` and `**` are supported in
 *                   the simple built-in matcher).
 * @param cwd - Base directory to resolve against.
 * @param concurrency - Max concurrent pattern evaluations. Default: 4.
 */
export async function globParallel(
  patterns: string[],
  cwd: string,
  concurrency = 4,
): Promise<string[]> {
  const tasks = patterns.map((pattern) => async (): Promise<string[]> => {
    return matchGlob(pattern, cwd);
  });
  const perPattern = await runWithConcurrency(tasks, concurrency);
  // Deduplicate
  const seen = new Set<string>();
  const result: string[] = [];
  for (const group of perPattern) {
    for (const p of group) {
      if (!seen.has(p)) {
        seen.add(p);
        result.push(p);
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Simple glob matcher (no external dep)
// ---------------------------------------------------------------------------

function globToRegExp(pattern: string): RegExp {
  let re = '';
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '*' && pattern[i + 1] === '*') {
      // Match any path segments
      if (pattern[i + 2] === '/' || pattern[i + 2] === '\\') {
        re += '(?:.+[\\\\/])?';
        i += 3;
      } else {
        re += '.*';
        i += 2;
      }
    } else if (ch === '*') {
      re += '[^\\\\/]*';
      i++;
    } else if (ch === '?') {
      re += '[^\\\\/]';
      i++;
    } else if (ch === '/' || ch === '\\') {
      re += '[\\\\/]';
      i++;
    } else {
      re += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
      i++;
    }
  }
  return new RegExp(`^${re}$`);
}

async function listRecursive(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listRecursive(full)));
    } else {
      results.push(full);
    }
  }
  return results;
}

async function matchGlob(pattern: string, cwd: string): Promise<string[]> {
  const regex = globToRegExp(pattern);
  const allFiles = await listRecursive(cwd);
  return allFiles.filter((f) => {
    const relative = f.slice(cwd.length).replace(/^[\\/]/, '');
    return regex.test(relative);
  });
}
