import * as fs from 'fs';

import { isFsPathInsideRoot } from './runDetailsSnapshot';

export const DEFAULT_MAX_COPY_CONTENTS_BYTES = 1_000_000;
const DEFAULT_BINARY_SNIFF_BYTES = 8_192;

export type CopyFileContentsResult =
  | { ok: true; content: string; size: number }
  | {
      ok: false;
      code:
        | 'outside_root'
        | 'not_found'
        | 'not_file'
        | 'symlink'
        | 'too_large'
        | 'binary'
        | 'read_error';
      message: string;
    };

export function isProbablyBinary(bytes: Uint8Array): boolean {
  const len = Math.min(bytes.length, DEFAULT_BINARY_SNIFF_BYTES);
  if (len === 0) return false;

  let controlCount = 0;
  for (let i = 0; i < len; i++) {
    const b = bytes[i]!;
    if (b === 0) return true; // NUL byte
    if (b < 7 || (b > 13 && b < 32)) controlCount++;
  }

  return controlCount / len > 0.3;
}

async function readPrefix(fd: fs.promises.FileHandle, bytes: number): Promise<Uint8Array> {
  const toRead = Math.max(0, bytes | 0);
  if (toRead <= 0) return new Uint8Array();
  const buffer = Buffer.allocUnsafe(toRead);
  const { bytesRead } = await fd.read(buffer, 0, toRead, 0);
  return buffer.subarray(0, bytesRead);
}

export async function readFileContentsForClipboard(params: {
  runRoot: string;
  fsPath: string;
  maxBytes?: number;
}): Promise<CopyFileContentsResult> {
  const runRoot = typeof params.runRoot === 'string' ? params.runRoot : '';
  const fsPath = typeof params.fsPath === 'string' ? params.fsPath : '';
  const maxBytes =
    typeof params.maxBytes === 'number' && Number.isFinite(params.maxBytes) && params.maxBytes > 0
      ? Math.floor(params.maxBytes)
      : DEFAULT_MAX_COPY_CONTENTS_BYTES;

  if (!runRoot || !fsPath) return { ok: false, code: 'read_error', message: 'Missing file path.' };
  if (!isFsPathInsideRoot(runRoot, fsPath))
    return {
      ok: false,
      code: 'outside_root',
      message: 'Refusing to read a file outside the run directory.',
    };

  try {
    const lst = await fs.promises.lstat(fsPath);
    if (lst.isSymbolicLink())
      return {
        ok: false,
        code: 'symlink',
        message: 'Refusing to copy contents of a symbolic link.',
      };
  } catch (err) {
    const errno = err as NodeJS.ErrnoException | undefined;
    if (errno?.code === 'ENOENT')
      return { ok: false, code: 'not_found', message: 'File not found.' };
    return { ok: false, code: 'read_error', message: 'Could not read file.' };
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(fsPath);
  } catch (err) {
    const errno = err as NodeJS.ErrnoException | undefined;
    if (errno?.code === 'ENOENT')
      return { ok: false, code: 'not_found', message: 'File not found.' };
    return { ok: false, code: 'read_error', message: 'Could not read file.' };
  }

  if (!stat.isFile()) return { ok: false, code: 'not_file', message: 'Not a file.' };
  const size = stat.size;
  if (size > maxBytes)
    return {
      ok: false,
      code: 'too_large',
      message: `File is too large to copy (${size} bytes; limit ${maxBytes} bytes).`,
    };

  let fd: fs.promises.FileHandle | undefined;
  try {
    fd = await fs.promises.open(fsPath, 'r');
    const prefix = await readPrefix(fd, Math.min(DEFAULT_BINARY_SNIFF_BYTES, size));
    if (isProbablyBinary(prefix))
      return {
        ok: false,
        code: 'binary',
        message: 'File appears to be binary; Copy contents is disabled.',
      };

    const buffer = Buffer.allocUnsafe(size);
    const { bytesRead } = await fd.read(buffer, 0, size, 0);
    const content = buffer.subarray(0, bytesRead).toString('utf8');
    return { ok: true, content, size };
  } catch {
    return { ok: false, code: 'read_error', message: 'Could not read file.' };
  } finally {
    try {
      await fd?.close();
    } catch {
      // ignore
    }
  }
}
