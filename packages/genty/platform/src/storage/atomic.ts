import { promises as fs } from "node:fs";
import path from "node:path";

const RETRYABLE_ERRORS = new Set(["EBUSY", "ETXTBSY", "EPERM", "EACCES"]);

async function fsyncPath(targetPath: string) {
  const handle = await fs.open(targetPath, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function writeFileAtomic(targetPath: string, data: string | Buffer, retries = 3) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  const handle = await fs.open(tempPath, "w");
  try {
    if (typeof data === "string") {
      await handle.writeFile(data, "utf8");
    } else {
      await handle.writeFile(data);
    }
    await handle.sync();
  } finally {
    await handle.close();
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await fs.rename(tempPath, targetPath);
      await fsyncPath(path.dirname(targetPath));
      return;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        await fs.writeFile(targetPath, data);
        return;
      }
      if (attempt === retries || !err.code || !RETRYABLE_ERRORS.has(err.code)) {
        await fs.rm(tempPath, { force: true });
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 25));
    }
  }
}
