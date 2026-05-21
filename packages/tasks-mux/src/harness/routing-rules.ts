import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { RoutingConfig } from "../types.js";
import { RoutingConfigSchema } from "../types.js";

const DEFAULT_CONFIG_PATHS = [
  ".a5c/breakpoints-routing.json",
  ".breakpoints/routing.json",
];

/**
 * Load routing configuration from the filesystem.
 * Searches default paths in order, returns the first found.
 */
export async function loadRoutingConfig(
  configPath?: string,
  cwd?: string,
): Promise<RoutingConfig | null> {
  const basePath = cwd ?? process.cwd();

  if (configPath) {
    const absPath = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(basePath, configPath);
    return readAndParseConfig(absPath);
  }

  for (const relPath of DEFAULT_CONFIG_PATHS) {
    const absPath = path.resolve(basePath, relPath);
    const config = await readAndParseConfig(absPath);
    if (config) return config;
  }

  return null;
}

async function readAndParseConfig(filePath: string): Promise<RoutingConfig | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return RoutingConfigSchema.parse(parsed);
  } catch {
    return null;
  }
}
