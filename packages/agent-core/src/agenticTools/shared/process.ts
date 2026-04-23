import * as childProcess from "node:child_process";
import * as fs from "node:fs";

export const DEFAULT_BASH_TIMEOUT = 120_000;
export const DEFAULT_SEARCH_TIMEOUT = 30_000;
export const MAX_READ_LINES = 10_000;
const MAX_SPAWN_OUTPUT_BYTES = 50 * 1024 * 1024;

let rgPath: string | undefined;

export function getRgPath(): string {
  if (rgPath !== undefined) {
    return rgPath;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vscodeRipgrep = require("@vscode/ripgrep") as { rgPath: string };
    if (vscodeRipgrep.rgPath && fs.existsSync(vscodeRipgrep.rgPath)) {
      rgPath = vscodeRipgrep.rgPath;
      return rgPath;
    }
  } catch {
    // fall through to PATH lookup
  }
  rgPath = "rg";
  return rgPath;
}

export function spawnAsync(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    shell?: boolean;
  },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const processHandle = childProcess.spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      timeout: options.timeout ?? DEFAULT_BASH_TIMEOUT,
      shell: options.shell ?? false,
      windowsHide: true,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let stdoutTruncated = false;
    let stderrTruncated = false;

    processHandle.stdout?.on("data", (chunk: Buffer) => {
      if (stdoutTruncated) {
        return;
      }
      stdoutBytes += chunk.length;
      if (stdoutBytes > MAX_SPAWN_OUTPUT_BYTES) {
        stdoutTruncated = true;
        return;
      }
      stdoutChunks.push(chunk);
    });

    processHandle.stderr?.on("data", (chunk: Buffer) => {
      if (stderrTruncated) {
        return;
      }
      stderrBytes += chunk.length;
      if (stderrBytes > MAX_SPAWN_OUTPUT_BYTES) {
        stderrTruncated = true;
        return;
      }
      stderrChunks.push(chunk);
    });

    const concatSafe = (chunks: Buffer[], truncated: boolean, totalBytes: number): string => {
      const text = Buffer.concat(chunks).toString("utf8");
      return truncated
        ? `${text}\n... [truncated: ${totalBytes} bytes total, limit ${MAX_SPAWN_OUTPUT_BYTES}]`
        : text;
    };

    processHandle.on("close", (code) => {
      resolve({
        stdout: concatSafe(stdoutChunks, stdoutTruncated, stdoutBytes),
        stderr: concatSafe(stderrChunks, stderrTruncated, stderrBytes),
        exitCode: code ?? 1,
      });
    });

    processHandle.on("error", (error) => {
      resolve({
        stdout: concatSafe(stdoutChunks, stdoutTruncated, stdoutBytes),
        stderr: error.message,
        exitCode: 1,
      });
    });
  });
}
