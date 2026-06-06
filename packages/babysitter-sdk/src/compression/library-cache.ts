/**
 * library-cache — compress-and-cache process library files (processLibraryCache layer).
 *
 * On first access (or after TTL expiry) a file is read, compressed with
 * densityFilterText, and written to .a5c/cache/compression/<hash>.json.
 * Subsequent reads within TTL are served from cache with zero re-compression cost.
 */

import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { densityFilterText, estimateTokens } from './density-filter';

interface CacheEntry {
  filePath: string;
  compressedContent: string;
  originalTokens: number;
  compressedTokens: number;
  compressedAt: string;
}

function cacheEntryPath(cacheDir: string, filePath: string): string {
  const hash = crypto.createHash('sha256').update(path.resolve(filePath)).digest('hex').slice(0, 16);
  return path.join(cacheDir, `${hash}.json`);
}

function isCacheExpired(compressedAt: string, ttlHours: number): boolean {
  return Date.now() - new Date(compressedAt).getTime() > ttlHours * 3_600_000;
}

function readCache(cacheDir: string, filePath: string, ttlHours: number): string | null {
  const entryPath = cacheEntryPath(cacheDir, filePath);
  if (!existsSync(entryPath)) return null;
  try {
    const entry = JSON.parse(readFileSync(entryPath, 'utf8')) as CacheEntry;
    if (isCacheExpired(entry.compressedAt, ttlHours)) return null;
    return entry.compressedContent;
  } catch {
    return null;
  }
}

function writeCache(cacheDir: string, filePath: string, entry: CacheEntry): void {
  try {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(cacheEntryPath(cacheDir, filePath), JSON.stringify(entry, null, 2), 'utf8');
  } catch {
    // Best-effort
  }
}

/**
 * Return compressed content for `filePath`, reading from cache when fresh.
 * On cache miss: reads, compresses, writes to cache, returns compressed content.
 * Returns null if the file doesn't exist or can't be read.
 */
export function getOrCompressFile(
  filePath: string,
  targetReduction: number,
  ttlHours: number,
  cacheDir: string,
): string | null {
  const resolved = path.resolve(filePath);
  if (!existsSync(resolved)) return null;

  const cached = readCache(cacheDir, resolved, ttlHours);
  if (cached !== null) return cached;

  let content: string;
  try {
    content = readFileSync(resolved, 'utf8');
  } catch {
    return null;
  }

  const originalTokens = estimateTokens(content);
  const compressedContent = originalTokens > 50 ? densityFilterText(content, targetReduction) : content;

  writeCache(cacheDir, resolved, {
    filePath: resolved,
    compressedContent,
    originalTokens,
    compressedTokens: estimateTokens(compressedContent),
    compressedAt: new Date().toISOString(),
  });

  return compressedContent;
}

/**
 * Find all SKILL.md and AGENT.md files under `rootDir` (max depth 6).
 * Used by the session-start hook to pre-warm the cache.
 */
export function findLibraryFiles(rootDir: string): string[] {
  const results: string[] = [];
  const LIBRARY_FILENAMES = new Set(['SKILL.md', 'AGENT.md']);

  function scan(dir: string, depth: number): void {
    if (depth > 6) return;
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (name.startsWith('.') && name !== '.claude') continue;
      if (name === 'node_modules') continue;
      const fullPath = path.join(dir, name);
      let isDir = false;
      try {
        isDir = statSync(fullPath).isDirectory();
      } catch {
        continue;
      }
      if (isDir) {
        scan(fullPath, depth + 1);
      } else if (LIBRARY_FILENAMES.has(name)) {
        results.push(fullPath);
      }
    }
  }

  scan(rootDir, 0);
  return results;
}
