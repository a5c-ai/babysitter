/**
 * Microagent discovery.
 *
 * Scans filesystem directories for `microagent.json` manifest files
 * and registers discovered manifests into a MicroagentRegistry.
 * Also provides a helper to seed the registry with built-in manifests
 * that ship with genty-core.
 */

import type { MicroagentManifest } from "@a5c-ai/genty-core";
import {
  MicroagentRegistry,
  builtInManifests,
} from "@a5c-ai/genty-core";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Filesystem discovery
// ---------------------------------------------------------------------------

/**
 * Walk the provided directories and collect every `microagent.json`
 * manifest found in immediate subdirectories.
 *
 * Layout expected:
 * ```
 *   <dir>/
 *     my-agent/
 *       microagent.json   <-- picked up
 *     other-agent/
 *       microagent.json   <-- picked up
 * ```
 */
export function discoverMicroagents(dirs: string[]): MicroagentManifest[] {
  const manifests: MicroagentManifest[] = [];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = join(dir, entry.name, "microagent.json");
      if (!existsSync(manifestPath)) continue;
      const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
      manifests.push(raw as MicroagentManifest);
    }
  }

  return manifests;
}

// ---------------------------------------------------------------------------
// Registration helpers
// ---------------------------------------------------------------------------

/**
 * Register all 5 built-in microagents that ship with genty-core.
 */
export function registerBuiltInMicroagents(registry: MicroagentRegistry): void {
  for (const manifest of builtInManifests) {
    registry.register(manifest);
  }
}

/**
 * Discover manifests from directories and register them.
 * Returns the number of manifests registered.
 */
export function registerDiscoveredMicroagents(
  registry: MicroagentRegistry,
  dirs: string[],
): number {
  const manifests = discoverMicroagents(dirs);
  for (const m of manifests) {
    registry.register(m);
  }
  return manifests.length;
}
