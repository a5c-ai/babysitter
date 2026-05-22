/**
 * Storage path resolution for @a5c-ai/agent-mux.
 *
 * Resolves the global config directory and project config directory
 * based on options, environment variables, and filesystem walk-up.
 */

import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';

// ---------------------------------------------------------------------------
// StoragePaths interface (§4.1-4.2)
// ---------------------------------------------------------------------------

/** Resolved paths for both global and project storage directories. */
export interface StoragePaths {
  /** Absolute path to the global config directory (e.g., ~/.agent-mux). */
  readonly configDir: string;

  /** Absolute path to the project config directory (e.g., .agent-mux). */
  readonly projectConfigDir: string;

  /** Absolute path to the global config.json file. */
  readonly globalConfigFile: string;

  /** Absolute path to the project config.json file. */
  readonly projectConfigFile: string;

  /** Absolute path to the global profiles directory. */
  readonly globalProfilesDir: string;

  /** Absolute path to the project profiles directory. */
  readonly projectProfilesDir: string;

  /** Absolute path to the auth-hints.json file. */
  readonly authHintsFile: string;

  /** Absolute path to the run-index.jsonl file. */
  readonly runIndexFile: string;
}

// ---------------------------------------------------------------------------
// Options for path resolution
// ---------------------------------------------------------------------------

/** Options that influence storage path resolution. */
export interface StoragePathOptions {
  /** Override the global config directory. Must be absolute. */
  configDir?: string;

  /** Override the project config directory. Must be absolute. */
  projectConfigDir?: string;
}

// ---------------------------------------------------------------------------
// resolveStoragePaths()
// ---------------------------------------------------------------------------

/**
 * Resolve the global and project config directory paths.
 *
 * Resolution order for the global config directory:
 * 1. `options.configDir` if provided.
 * 2. `AGENT_MUX_CONFIG_DIR` environment variable if set.
 * 3. `path.join(os.homedir(), '.agent-mux')`.
 *
 * Resolution order for the project config directory:
 * 1. `options.projectConfigDir` if provided.
 * 2. `AGENT_MUX_PROJECT_DIR` environment variable if set.
 * 3. Walk up from `process.cwd()` looking for a `.agent-mux/` directory.
 * 4. If not found, use `path.join(process.cwd(), '.agent-mux')`.
 */
export function resolveStoragePaths(options?: StoragePathOptions): StoragePaths {
  const configDir = resolveConfigDir(options?.configDir);
  const projectConfigDir = resolveProjectConfigDir(options?.projectConfigDir);

  return {
    configDir,
    projectConfigDir,
    globalConfigFile: path.join(configDir, 'config.json'),
    projectConfigFile: path.join(projectConfigDir, 'config.json'),
    globalProfilesDir: path.join(configDir, 'profiles'),
    projectProfilesDir: path.join(projectConfigDir, 'profiles'),
    authHintsFile: path.join(configDir, 'auth-hints.json'),
    runIndexFile: path.join(projectConfigDir, 'run-index.jsonl'),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveConfigDir(override?: string): string {
  if (override) {
    return path.resolve(override);
  }

  const envDir = process.env['AGENT_MUX_CONFIG_DIR'];
  if (envDir) {
    return path.resolve(envDir);
  }

  return path.join(os.homedir(), '.agent-mux');
}

function resolveProjectConfigDir(override?: string): string {
  if (override) {
    return path.resolve(override);
  }

  const envDir = process.env['AGENT_MUX_PROJECT_DIR'];
  if (envDir) {
    return path.resolve(envDir);
  }

  return walkUpForAgentMux(process.cwd());
}

/**
 * Walk up the directory tree from `startDir` looking for a `.agent-mux/`
 * directory. If not found, defaults to `startDir/.agent-mux`.
 */
function walkUpForAgentMux(startDir: string): string {
  let current = path.resolve(startDir);

  while (true) {
    const candidate = path.join(current, '.agent-mux');
    try {
      const stat = fs.statSync(candidate);
      if (stat.isDirectory()) {
        return candidate;
      }
    } catch {
      // Directory doesn't exist, keep walking up.
    }

    const parent = path.dirname(current);
    if (parent === current) {
      // Reached the filesystem root without finding .agent-mux/.
      // Default to cwd/.agent-mux.
      return path.join(startDir, '.agent-mux');
    }
    current = parent;
  }
}
