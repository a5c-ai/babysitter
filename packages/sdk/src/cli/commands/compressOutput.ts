/**
 * compress-output — run a command and compress its output.
 *
 * Used by `babysitter hook:run --hook-type pre-tool-use` to replace RTK.
 * Runs the given command, detects its family (git, ls, grep, diff, read),
 * and applies the appropriate compressor — all inlined, zero external deps.
 *
 * Usage:
 *   babysitter compress-output <command and args...>
 *
 * Examples:
 *   babysitter compress-output git status
 *   babysitter compress-output git log --oneline -20
 *   babysitter compress-output ls -la
 *   babysitter compress-output grep -rn "foo" src/
 */

import { spawnSync } from "node:child_process";
import {
  detectCommandFamily,
  detectGitSubcommand,
  compressGitOutput,
  compressLsOutput,
  compressGrepOutput,
  condenseDiff,
  compressReadOutput,
  capLines,
} from "./compressOutputHelpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompressOutputOptions {
  /** The command + arguments to run and compress. */
  args: string[];
  /** Timeout for the child process in ms (default 30 000). */
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Main compressor dispatcher
// ---------------------------------------------------------------------------

function compressCommandOutput(cmdStr: string, rawOutput: string): string {
  const family = detectCommandFamily(cmdStr);
  switch (family) {
    case "git": {
      const sub = detectGitSubcommand(cmdStr);
      return compressGitOutput(sub, rawOutput);
    }
    case "ls":
      return compressLsOutput(rawOutput);
    case "grep": {
      const parts = cmdStr.split(/\s+/);
      const pattern = parts.find((p, i) => i > 0 && !p.startsWith("-")) ?? "";
      return compressGrepOutput(rawOutput, pattern);
    }
    case "diff":
      return condenseDiff(rawOutput);
    case "read": {
      const parts = cmdStr.trim().split(/\s+/);
      const filePath = parts[parts.length - 1] ?? "";
      const dotPos = filePath.lastIndexOf(".");
      const ext = dotPos >= 0 ? filePath.slice(dotPos + 1) : "";
      return compressReadOutput(rawOutput, ext);
    }
    default:
      return capLines(rawOutput);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export function handleCompressOutput(opts: CompressOutputOptions): number {
  const { args, timeout = 30_000 } = opts;

  if (args.length === 0) {
    process.stderr.write("Error: compress-output requires a command\n");
    return 1;
  }

  const [bin, ...cmdArgs] = args;

  const result = spawnSync(bin, cmdArgs, {
    encoding: "buffer",
    timeout,
    maxBuffer: 10 * 1024 * 1024,
    shell: false,
  });

  if (result.error) {
    // Command failed to start (not found, timed out, etc.)
    const msg = result.error instanceof Error ? result.error.message : String(result.error);
    process.stderr.write(`compress-output: ${msg}\n`);
    return 1;
  }

  const stdout = (result.stdout ?? Buffer.alloc(0)).toString("utf8");
  // Write stderr through unchanged so the caller can still see errors
  const stderrOut = (result.stderr ?? Buffer.alloc(0)).toString("utf8");
  if (stderrOut) process.stderr.write(stderrOut);

  const cmdStr = args.join(" ");
  const compressed = compressCommandOutput(cmdStr, stdout);

  process.stdout.write(compressed);
  if (compressed && !compressed.endsWith("\n")) process.stdout.write("\n");

  return result.status ?? 0;
}
