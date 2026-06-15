/**
 * Atomic file write utility.
 *
 * Writes data to a temporary file in the same directory and then renames
 * it to the target path, ensuring the target is either fully written or
 * unchanged. Retries on transient EPERM / EACCES errors (Windows).
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

/**
 * Write `data` to `targetPath` atomically using tmp-file + rename.
 *
 * @param targetPath - Destination file path.
 * @param data       - Content to write (string or Buffer).
 * @param retries    - Number of rename retries on transient errors (default 3).
 */
export async function writeFileAtomic(
  targetPath: string,
  data: string | Buffer,
  retries = 3,
): Promise<void> {
  const dir = path.dirname(targetPath);
  const tmpName = `.${path.basename(targetPath)}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  const tmpPath = path.join(dir, tmpName);

  await fs.writeFile(tmpPath, data);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await fs.rename(tmpPath, targetPath);
      return;
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if ((code === "EPERM" || code === "EACCES") && attempt < retries) {
        await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
        continue;
      }
      // Clean up temp file on final failure
      await fs.unlink(tmpPath).catch(() => {});
      throw err;
    }
  }
}
