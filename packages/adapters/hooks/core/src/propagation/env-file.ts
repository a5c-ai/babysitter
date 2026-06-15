import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ---------------------------------------------------------------------------
// Temp file tracking & cleanup
// ---------------------------------------------------------------------------

/** Paths of temp env files created during this process lifetime. */
const trackedTempFiles: string[] = [];
let cleanupRegistered = false;

/**
 * Return the list of tracked temp file paths (for testing / diagnostics).
 */
export function getTrackedTempFiles(): readonly string[] {
  return trackedTempFiles;
}

/**
 * Remove all tracked temp files synchronously (best-effort).
 * Called automatically on process exit.
 */
export function cleanupTempFiles(): void {
  for (const filePath of trackedTempFiles) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // best-effort -- file may already be gone
    }
  }
  trackedTempFiles.length = 0;
}

function ensureCleanupRegistered(): void {
  if (!cleanupRegistered) {
    cleanupRegistered = true;
    process.on('exit', cleanupTempFiles);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build shell-safe export lines for an env file consumed via `source`.
 *
 * Exporting is required when the sourcing shell may spawn downstream child
 * processes that need to inherit the persisted values.
 */
export function buildExportEnvFileLines(
  env: Record<string, string>,
): string[] {
  return Object.entries(env).map(
    ([key, value]) => `export ${key}=${escapeShellValue(value)}`,
  );
}

/**
 * Generate a temporary env file containing exported KEY=VALUE lines.
 *
 * @param env - Environment variables to write.
 * @param dir - Directory for the temp file; defaults to os.tmpdir().
 * @returns Path to the generated temp file.
 */
export async function generateTempEnvFile(
  env: Record<string, string>,
  dir?: string,
): Promise<string> {
  ensureCleanupRegistered();

  const targetDir = dir ?? os.tmpdir();
  await fs.promises.mkdir(targetDir, { recursive: true });

  const filename = `a5c-env-${process.pid}-${Date.now()}.env`;
  const filePath = path.join(targetDir, filename);

  const lines = buildExportEnvFileLines(env);
  const content = lines.join('\n') + '\n';

  const tmpPath = `${filePath}.tmp`;
  await fs.promises.writeFile(tmpPath, content, 'utf-8');
  await fs.promises.rename(tmpPath, filePath);

  trackedTempFiles.push(filePath);

  return filePath;
}

/**
 * Escape a value for safe inclusion in a shell env file.
 * Wraps in double quotes and escapes backslashes, double quotes,
 * newlines, dollar signs, and backticks.
 */
export function escapeShellValue(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
  return `"${escaped}"`;
}
