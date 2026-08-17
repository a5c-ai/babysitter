import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export async function ensurePrivateDirectory(directory: string): Promise<void> {
  const created = await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  if (created !== undefined) {
    await fs.chmod(directory, 0o700);
    await fsyncDirectory(path.dirname(directory));
  }
  await requireMode(directory, 0o700);
}

export async function publishCreateOnce(directory: string, filename: string, bytes: Buffer): Promise<string> {
  const targetPath = path.join(directory, filename);
  const temporaryPath = path.join(directory, `.${filename}.${process.pid}.${crypto.randomUUID()}.tmp`);
  const handle = await fs.open(temporaryPath, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }

  try {
    await requireMode(temporaryPath, 0o600);
    await requireExactBytes(temporaryPath, bytes);
    await fs.link(temporaryPath, targetPath);
    await fsyncDirectory(directory);
    await requireMode(targetPath, 0o600);
    await requireExactBytes(targetPath, bytes);
    return targetPath;
  } finally {
    await fs.rm(temporaryPath, { force: true });
  }
}

export async function renameNoReplace(sourcePath: string, targetPath: string): Promise<void> {
  await requireAbsent(targetPath);
  await fs.rename(sourcePath, targetPath);
  await fsyncDirectory(path.dirname(targetPath));
}

export async function readPrivateFile(filePath: string): Promise<Buffer> {
  await requireMode(filePath, 0o600);
  return await fs.readFile(filePath);
}

export async function requireMode(targetPath: string, expected: number): Promise<void> {
  const stat = await fs.stat(targetPath);
  if ((stat.mode & 0o777) !== expected) {
    throw new Error(`${targetPath} must have mode ${expected.toString(8)}`);
  }
}

export async function requireExactBytes(targetPath: string, expected: Buffer): Promise<void> {
  const actual = await fs.readFile(targetPath);
  if (!actual.equals(expected)) {
    throw new Error(`${targetPath} bytes diverged during durable publication`);
  }
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.lstat(targetPath);
    return true;
  } catch (error) {
    if (isErrno(error, "ENOENT")) return false;
    throw error;
  }
}

export async function requireAbsent(targetPath: string): Promise<void> {
  if (await pathExists(targetPath)) {
    throw new Error(`${targetPath} already exists`);
  }
}

export async function fsyncDirectory(directory: string): Promise<void> {
  const handle = await fs.open(directory, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function isErrno(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
