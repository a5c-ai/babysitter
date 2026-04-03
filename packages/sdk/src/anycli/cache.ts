/**
 * AnyCLI Cache Management
 *
 * Simple filesystem-based cache for agent-generated service artifacts.
 * One cache.json per service under ~/.a5c/anycli/cache/<service>/.
 * The agent decides freshness, structure, and invalidation -- this module
 * is just convenience I/O.
 */

import { promises as fs } from "fs";
import path from "path";
import { homedir } from "os";
import type { AnycliServiceCache } from "./types";
import { writeFileAtomic } from "../storage/atomic.js";

/**
 * Base directory name for babysitter state.
 */
const A5C_DIR = ".a5c";

/**
 * Subdirectory for anycli cache within the global state dir.
 */
const ANYCLI_CACHE_SUBDIR = path.join("anycli", "cache");

/**
 * Cache filename.
 */
const CACHE_FILE = "cache.json";

/**
 * Returns the global cache directory for a service.
 *
 * @param service - Service identifier
 * @returns Absolute path to `~/.a5c/anycli/cache/<service>/`
 */
export function getAnycliCacheDir(service: string): string {
  return path.join(homedir(), A5C_DIR, ANYCLI_CACHE_SUBDIR, service);
}

/**
 * Reads a cached service entry if one exists.
 *
 * Returns `null` if no cache entry exists or the entry is corrupt.
 *
 * @param service - Service identifier
 * @returns The cached service entry, or null
 */
export async function readServiceCache(service: string): Promise<AnycliServiceCache | null> {
  const cacheDir = getAnycliCacheDir(service);
  const cachePath = path.join(cacheDir, CACHE_FILE);

  try {
    const raw = await fs.readFile(cachePath, "utf8");
    const entry = JSON.parse(raw) as AnycliServiceCache;
    return entry;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return null;
    }
    // Corrupt cache -- treat as miss
    return null;
  }
}

/**
 * Writes a service cache entry atomically.
 *
 * @param service - Service identifier
 * @param cache - The cache entry to write
 */
export async function writeServiceCache(
  service: string,
  cache: AnycliServiceCache
): Promise<void> {
  const cacheDir = getAnycliCacheDir(service);
  await fs.mkdir(cacheDir, { recursive: true });

  const cachePath = path.join(cacheDir, CACHE_FILE);
  await writeFileAtomic(cachePath, JSON.stringify(cache, null, 2) + "\n");
}

/**
 * Invalidates the cache for a service by removing its cache directory.
 *
 * @param service - Service identifier
 */
export async function invalidateServiceCache(service: string): Promise<void> {
  const cacheDir = getAnycliCacheDir(service);
  try {
    await fs.rm(cacheDir, { recursive: true, force: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Lists all cached service names.
 *
 * @returns Array of service identifier strings
 */
export async function listCachedServices(): Promise<string[]> {
  const baseDir = path.join(homedir(), A5C_DIR, ANYCLI_CACHE_SUBDIR);
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
