import { promises as fs } from "fs";
import path from "path";
import os from "os";

/** Return true when err represents a "file/directory not found" filesystem error. */
export function isNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as NodeJS.ErrnoException).code;
  return code === "ENOENT" || code === "ENOTDIR" || err.message.includes("ENOENT");
}

export interface WatchSource {
  path: string;
  depth: number; // how many levels deep to search for .a5c/runs/
  label?: string;
}

export interface KanbanConfig {
  sources: WatchSource[];
  port: number;
  pollInterval: number;
  theme: "dark" | "light";
  staleThresholdMs: number;
  recentCompletionWindowMs: number;
  retentionDays: number;
  hiddenProjects: string[];
}

export type ObserverConfig = KanbanConfig;

const DEFAULT_REGISTRY_PATH = path.join(os.homedir(), ".a5c", "kanban.json");

function getRegistryPath(): string {
  if (process.env.KANBAN_REGISTRY) {
    return process.env.KANBAN_REGISTRY;
  }
  return DEFAULT_REGISTRY_PATH;
}

async function loadRegistryFile(filePath: string): Promise<RegistryData | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);
    const sources = Array.isArray(parsed.sources)
      ? parsed.sources.map((s: Record<string, unknown>) => ({
          path: String(s.path || ""),
          depth: typeof s.depth === "number" ? s.depth : 2,
          label: s.label ? String(s.label) : undefined,
        }))
      : [];
    return {
      sources,
      pollInterval: typeof parsed.pollInterval === "number" ? parsed.pollInterval : undefined,
      theme: parsed.theme === "dark" || parsed.theme === "light" ? parsed.theme : undefined,
      staleThresholdMs: typeof parsed.staleThresholdMs === "number" ? parsed.staleThresholdMs : undefined,
      recentCompletionWindowMs: typeof parsed.recentCompletionWindowMs === "number" ? parsed.recentCompletionWindowMs : undefined,
      retentionDays: typeof parsed.retentionDays === "number" ? parsed.retentionDays : undefined,
      hiddenProjects: Array.isArray(parsed.hiddenProjects) ? parsed.hiddenProjects.filter((s: unknown) => typeof s === "string") : undefined,
    };
  } catch (err) {
    if (isNotFoundError(err)) {
      return null;
    }
    throw err;
  }
}

let cachedConfig: KanbanConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 10000; // 10s

// Invalidate the config cache (called after POST /api/config writes new values)
export function invalidateConfigCache(): void {
  cachedConfig = null;
  cacheTime = 0;
}

// Write config to the kanban registry file (~/.a5c/kanban.json by default).
export async function writeConfig(data: {
  sources: WatchSource[];
  pollInterval?: number;
  theme?: string;
  staleThresholdMs?: number;
  recentCompletionWindowMs?: number;
  retentionDays?: number;
  hiddenProjects?: string[];
}): Promise<void> {
  const registryPath = getRegistryPath();
  const dir = path.dirname(registryPath);
  await fs.mkdir(dir, { recursive: true });

  // Read existing file to preserve any extra fields
  let existing: Record<string, unknown> = {};
  try {
    const content = await fs.readFile(registryPath, "utf-8");
    existing = JSON.parse(content);
  } catch (err) {
    // Expected when writing config for the first time; warn if the file exists but is unreadable
    if (!isNotFoundError(err)) {
      console.warn(`[config] Failed to read existing config at ${registryPath} before merge:`, err);
    }
  }

  const merged = {
    ...existing,
    sources: data.sources,
    ...(data.pollInterval !== undefined ? { pollInterval: data.pollInterval } : {}),
    ...(data.theme !== undefined ? { theme: data.theme } : {}),
    ...(data.staleThresholdMs !== undefined ? { staleThresholdMs: data.staleThresholdMs } : {}),
    ...(data.recentCompletionWindowMs !== undefined ? { recentCompletionWindowMs: data.recentCompletionWindowMs } : {}),
    ...(data.retentionDays !== undefined ? { retentionDays: data.retentionDays } : {}),
    ...(data.hiddenProjects !== undefined ? { hiddenProjects: data.hiddenProjects } : {}),
  };

  await fs.writeFile(registryPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
}

interface RegistryData {
  sources: WatchSource[];
  pollInterval?: number;
  theme?: "dark" | "light";
  staleThresholdMs?: number;
  recentCompletionWindowMs?: number;
  retentionDays?: number;
  hiddenProjects?: string[];
}

async function loadRegistry(): Promise<RegistryData> {
  try {
    const registryPath = getRegistryPath();
    const primary = await loadRegistryFile(registryPath);
    if (primary) {
      return primary;
    }
    return { sources: [] };
  } catch (err) {
    if (!isNotFoundError(err)) {
      console.warn(`[config] Failed to load registry from ${getRegistryPath()} — using defaults:`, err);
    }
    return { sources: [] };
  }
}

function getDefaultSources(): WatchSource[] {
  const sources: WatchSource[] = [];

  // CLI flag via KANBAN_WATCH_DIR (set by src/cli.ts — defaults to user's cwd)
  const cliWatchDir = process.env.KANBAN_WATCH_DIR;
  if (cliWatchDir) {
    sources.push({ path: cliWatchDir, depth: 3, label: "cli" });
  }

  // WATCH_DIR env (backwards-compatible single dir)
  if (process.env.WATCH_DIR) {
    sources.push({ path: process.env.WATCH_DIR, depth: 0, label: "env" });
  }

  // WATCH_DIRS env (comma-separated)
  if (process.env.WATCH_DIRS) {
    for (const dir of process.env.WATCH_DIRS.split(",")) {
      const trimmed = dir.trim();
      if (trimmed) sources.push({ path: trimmed, depth: 2 });
    }
  }

  // Default: parent of cwd — users typically run from inside a project dir
  // but want to observe ALL sibling projects in the parent folder
  if (sources.length === 0) {
    sources.push({
      path: path.resolve(process.cwd(), ".."),
      depth: 3,
      label: "parent",
    });
  }

  return sources;
}

export async function getConfig(): Promise<KanbanConfig> {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }

  const registry = await loadRegistry();
  const defaultSources = getDefaultSources();

  // Merge: registry sources take priority, defaults as fallback
  // Deduplicate sources by normalized path to prevent duplicate discovery
  const rawSources = registry.sources.length > 0 ? registry.sources : defaultSources;
  const seen = new Set<string>();
  const sources = rawSources.filter((s) => {
    const normalized = path.resolve(s.path);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  // Priority: registry file > env vars > defaults
  const envPollInterval = process.env.KANBAN_POLL_INTERVAL || process.env.POLL_INTERVAL;
  const envTheme = process.env.KANBAN_DEFAULT_THEME || process.env.THEME;
  const envStaleThreshold = process.env.KANBAN_STALE_THRESHOLD_MS;
  const envRecentWindow = process.env.KANBAN_RECENT_WINDOW_MS;
  const envRetentionDays = process.env.KANBAN_RETENTION_DAYS;

  cachedConfig = {
    sources,
    port: parseInt(process.env.KANBAN_PORT || process.env.PORT || "4800", 10),
    pollInterval: registry.pollInterval ?? (envPollInterval ? parseInt(envPollInterval, 10) : 2000),
    theme: registry.theme ?? ((envTheme === "dark" || envTheme === "light" ? envTheme : "dark") as "dark" | "light"),
    staleThresholdMs: registry.staleThresholdMs ?? (envStaleThreshold ? parseInt(envStaleThreshold, 10) : 3600000),
    recentCompletionWindowMs: registry.recentCompletionWindowMs ?? (envRecentWindow ? parseInt(envRecentWindow, 10) : 14400000),
    retentionDays: registry.retentionDays ?? (envRetentionDays ? parseInt(envRetentionDays, 10) : 30),
    hiddenProjects: registry.hiddenProjects ?? [],
  };
  cacheTime = now;

  return cachedConfig;
}
