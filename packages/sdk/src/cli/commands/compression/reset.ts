/**
 * compression:reset — remove the project-level compression config file.
 *
 * Usage:
 *   babysitter compression:reset [--json]
 *
 * Deletes .a5c/compression.config.json from the current project, reverting all
 * compression settings to their built-in defaults (subject to env var overrides).
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompressionResetOptions {
  json?: boolean;
  cwd?: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleCompressionReset(opts: CompressionResetOptions): Promise<number> {
  const projectDir = opts.cwd ?? process.cwd();
  const filePath = path.join(projectDir, '.a5c', 'compression.config.json');

  let existed = false;
  try {
    await fs.unlink(filePath);
    existed = true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      const message = err instanceof Error ? err.message : String(err);
      if (opts.json) {
        console.error(JSON.stringify({ error: `Failed to remove config file: ${message}` }));
      } else {
        console.error(`Error: Failed to remove config file: ${message}`);
      }
      return 1;
    }
    // File didn't exist — that's fine
  }

  if (opts.json) {
    console.log(JSON.stringify({ removed: existed, configFile: filePath }));
  } else {
    if (existed) {
      console.log(`Removed: ${filePath}`);
      console.log('Compression config reset to defaults.');
    } else {
      console.log(`No project config file found at: ${filePath}`);
      console.log('Nothing to reset — already using defaults.');
    }
  }

  return 0;
}
