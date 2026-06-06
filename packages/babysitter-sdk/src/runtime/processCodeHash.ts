import { promises as fs } from "fs";
import crypto from "crypto";
import path from "path";

export async function hashProcessCodeFile(importPath: string, baseDir?: string): Promise<string | undefined> {
  if (!importPath || importPath === "bare-run") return undefined;
  const absolutePath = path.isAbsolute(importPath) ? importPath : path.resolve(baseDir ?? process.cwd(), importPath);
  try {
    const data = await fs.readFile(absolutePath);
    return crypto.createHash("sha256").update(data).digest("hex");
  } catch {
    return undefined;
  }
}
