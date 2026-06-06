import { promises as fs } from "fs";
import path from "path";

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

  for (let attempt = 0; attempt <= retries; attempt++) {
    const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}-${attempt}`;
    try {
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
      await fs.rename(tempPath, targetPath);
      try { await fsyncPath(path.dirname(targetPath)); } catch { /* fsync dir may fail on Windows */ }
      return;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      await fs.rm(tempPath, { force: true }).catch(() => {});
      if (err.code === "ENOENT" && attempt < retries) {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 50));
        continue;
      }
      if (attempt === retries || (!err.code || (!RETRYABLE_ERRORS.has(err.code) && err.code !== "ENOENT"))) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 25));
    }
  }
}
