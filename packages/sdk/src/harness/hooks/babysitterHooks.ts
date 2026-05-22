/**
 * Global babysitter hooks system.
 *
 * Reads hook configuration from:
 * - ~/.a5c/hooks.json (global)
 * - <cwd>/.a5c/hooks.json (project)
 * - <cwd>/.a5c/hooks.local.json (local overrides, gitignored)
 *
 * Merges them (project overrides global, local overrides project)
 * and invokes shell handlers for babysitter events.
 *
 * This replaces the per-adapter findHookDispatcherPath() approach.
 */

import * as path from "node:path";
import * as os from "node:os";
import { existsSync, readFileSync } from "node:fs";
import { execFile } from "node:child_process";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BabysitterHookEntry {
  command: string;
  timeout?: number;
}

export interface BabysitterHooksConfig {
  hooks: Record<string, BabysitterHookEntry[]>;
}

// ---------------------------------------------------------------------------
// Loading and merging
// ---------------------------------------------------------------------------

function loadJsonFile(filePath: string): Record<string, unknown> | null {
  if (!existsSync(filePath)) return null;
  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed: unknown = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Malformed JSON — skip
  }
  return null;
}

function parseHooksFromJson(obj: Record<string, unknown>): Record<string, BabysitterHookEntry[]> {
  const hooks = obj.hooks;
  if (!hooks || typeof hooks !== "object" || Array.isArray(hooks)) {
    return {};
  }
  const result: Record<string, BabysitterHookEntry[]> = {};
  for (const [key, value] of Object.entries(hooks as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const entries: BabysitterHookEntry[] = [];
      for (const item of value) {
        if (typeof item === "string") {
          entries.push({ command: item });
        } else if (item && typeof item === "object" && "command" in item) {
          entries.push(item as BabysitterHookEntry);
        }
      }
      if (entries.length > 0) {
        result[key] = entries;
      }
    }
  }
  return result;
}

export function loadBabysitterHooks(cwd?: string): BabysitterHooksConfig {
  const resolvedCwd = cwd ? path.resolve(cwd) : process.cwd();
  const homeDir = os.homedir();

  // 1. Global: ~/.a5c/hooks.json
  const globalPath = path.join(homeDir, ".a5c", "hooks.json");
  const globalData = loadJsonFile(globalPath);
  const globalHooks = globalData ? parseHooksFromJson(globalData) : {};

  // 2. Project: <cwd>/.a5c/hooks.json
  const projectPath = path.join(resolvedCwd, ".a5c", "hooks.json");
  const projectData = loadJsonFile(projectPath);
  const projectHooks = projectData ? parseHooksFromJson(projectData) : {};

  // 3. Local: <cwd>/.a5c/hooks.local.json (gitignored)
  const localPath = path.join(resolvedCwd, ".a5c", "hooks.local.json");
  const localData = loadJsonFile(localPath);
  const localHooks = localData ? parseHooksFromJson(localData) : {};

  // Merge: project overrides global, local overrides project
  const allKeys = new Set([
    ...Object.keys(globalHooks),
    ...Object.keys(projectHooks),
    ...Object.keys(localHooks),
  ]);
  const merged: Record<string, BabysitterHookEntry[]> = {};
  for (const key of allKeys) {
    // Last-defined wins for each hook name
    merged[key] = localHooks[key] ?? projectHooks[key] ?? globalHooks[key] ?? [];
  }

  return { hooks: merged };
}

// ---------------------------------------------------------------------------
// Invocation
// ---------------------------------------------------------------------------

export async function invokeBabysitterHook(
  hookName: string,
  input: unknown,
  config?: BabysitterHooksConfig,
): Promise<unknown> {
  const effectiveConfig = config ?? loadBabysitterHooks();
  const entries = effectiveConfig.hooks[hookName];
  if (!entries || entries.length === 0) return undefined;

  const inputStr = typeof input === "string" ? input : JSON.stringify(input);
  let lastResult: unknown;

  for (const entry of entries) {
    const timeout = entry.timeout ?? 30000;
    lastResult = await new Promise<unknown>((resolve) => {
      const child = execFile(
        process.platform === "win32" ? "cmd" : "/bin/sh",
        process.platform === "win32" ? ["/c", entry.command] : ["-c", entry.command],
        { timeout, maxBuffer: 1024 * 1024 },
        (error, stdout, _stderr) => {
          if (error) {
            resolve(undefined);
            return;
          }
          const trimmed = stdout.trim();
          if (!trimmed) {
            resolve(undefined);
            return;
          }
          try {
            resolve(JSON.parse(trimmed));
          } catch {
            resolve(trimmed);
          }
        },
      );
      if (child.stdin) {
        child.stdin.write(inputStr);
        child.stdin.end();
      }
    });
  }

  return lastResult;
}
