import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Generate a temporary env file containing KEY=VALUE export lines.
 *
 * @param env - Environment variables to write.
 * @param dir - Directory for the temp file; defaults to os.tmpdir().
 * @returns Path to the generated temp file.
 */
export async function generateTempEnvFile(
  env: Record<string, string>,
  dir?: string,
): Promise<string> {
  const targetDir = dir ?? os.tmpdir();
  await fs.promises.mkdir(targetDir, { recursive: true });

  const filename = `a5c-env-${process.pid}-${Date.now()}.env`;
  const filePath = path.join(targetDir, filename);

  const lines = Object.entries(env).map(
    ([key, value]) => `export ${key}=${escapeValue(value)}`,
  );
  const content = lines.join('\n') + '\n';

  const tmpPath = `${filePath}.tmp`;
  await fs.promises.writeFile(tmpPath, content, 'utf-8');
  await fs.promises.rename(tmpPath, filePath);

  return filePath;
}

/**
 * Escape a value for safe inclusion in a shell env file.
 * Wraps in double quotes and escapes backslashes, double quotes,
 * newlines, dollar signs, and backticks.
 */
function escapeValue(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
  return `"${escaped}"`;
}
