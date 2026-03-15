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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompressOutputOptions {
  /** The command + arguments to run and compress. */
  args: string[];
  /** Timeout for the child process in ms (default 30 000). */
  timeout?: number;
}

type CommandFamily = "git" | "ls" | "grep" | "diff" | "read" | "unknown";
type GitSubcommand =
  | "diff" | "log" | "status" | "show" | "add" | "commit"
  | "push" | "pull" | "branch" | "fetch" | "stash" | "worktree" | "unknown";
type _FilterLevel = "none" | "minimal" | "aggressive";
type Language =
  | "rust" | "python" | "javascript" | "typescript" | "go"
  | "c" | "cpp" | "java" | "ruby" | "shell" | "unknown";

// ---------------------------------------------------------------------------
// Command-family detection
// ---------------------------------------------------------------------------

function detectCommandFamily(command: string): CommandFamily {
  const first = command.trim().toLowerCase().split(/\s+/)[0] ?? "";
  if (first === "git") return "git";
  if (first === "ls" || first === "dir") return "ls";
  if (first === "grep" || first === "rg" || first === "ag") return "grep";
  if (first === "diff" || first === "delta") return "diff";
  if (first === "cat" || first === "head" || first === "tail" || first === "less" || first === "more") return "read";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Git compressor
// ---------------------------------------------------------------------------

function detectGitSubcommand(command: string): GitSubcommand {
  const parts = command.toLowerCase().trim().split(/\s+/);
  const sub = parts.find((p, i) => i > 0 && !p.startsWith("-")) ?? "";
  const map: Record<string, GitSubcommand> = {
    diff: "diff", log: "log", status: "status", show: "show",
    add: "add", commit: "commit", push: "push", pull: "pull",
    branch: "branch", fetch: "fetch", stash: "stash", worktree: "worktree",
  };
  return map[sub] ?? "unknown";
}

function compactDiff(diff: string, maxLines = 100): string {
  const lines = diff.split("\n");
  const result: string[] = [];
  let kept = 0;
  let currentFile = "";
  for (const line of lines) {
    if (kept >= maxLines) break;
    if (line.startsWith("diff --git") || line.startsWith("--- ")) continue;
    if (line.startsWith("+++ ")) {
      currentFile = line.replace(/^\+\+\+ b?\//, "");
      result.push(`\n--- ${currentFile} ---`);
      continue;
    }
    if (line.startsWith("@@")) continue;
    if (line.startsWith("+") || line.startsWith("-")) {
      result.push(line.length > 120 ? line.slice(0, 117) + "..." : line);
      kept++;
    }
  }
  if (lines.length > maxLines) result.push(`\n... ${lines.length - maxLines} more lines`);
  return result.join("\n").trim();
}

function compactLog(log: string, maxEntries = 20): string {
  const lines = log.split("\n");
  const entries: string[] = [];
  let count = 0;
  for (const line of lines) {
    if (count >= maxEntries) break;
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("commit ")) {
      entries.push(trimmed.replace("commit ", "").slice(0, 12));
    } else if (/^[0-9a-f]{7,}/.test(trimmed)) {
      entries.push(trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed);
      count++;
    }
  }
  return entries.join("\n");
}

function compactStatus(status: string): string {
  const lines = status.split("\n");
  const staged: string[] = [];
  const unstaged: string[] = [];
  const untracked: string[] = [];
  for (const line of lines) {
    if (!line.trim() || line.startsWith("On branch") || line.startsWith("HEAD")) continue;
    if (line.startsWith("\t")) {
      const name = line.trim();
      if (line.includes("new file:") || line.includes("modified:") || line.includes("deleted:")) {
        staged.push(name);
      } else {
        unstaged.push(name);
      }
    } else if (line.startsWith("?? ")) {
      untracked.push(line.slice(3));
    }
  }
  const parts: string[] = [];
  if (staged.length) parts.push(`staged(${staged.length}): ${staged.slice(0, 5).join(", ")}`);
  if (unstaged.length) parts.push(`unstaged(${unstaged.length}): ${unstaged.slice(0, 5).join(", ")}`);
  if (untracked.length) parts.push(`untracked(${untracked.length}): ${untracked.slice(0, 5).join(", ")}`);
  return parts.length ? parts.join("\n") : "clean";
}

function compressGitOutput(sub: GitSubcommand, raw: string): string {
  switch (sub) {
    case "diff": return compactDiff(raw);
    case "log":  return compactLog(raw);
    case "status": return compactStatus(raw);
    case "show": return compactDiff(raw, 60);
    case "add": case "commit": case "push": case "pull": case "fetch":
      return raw.split("\n").filter(l => l.trim()).slice(0, 10).join("\n");
    default:
      return raw.split("\n").slice(0, 50).join("\n");
  }
}

// ---------------------------------------------------------------------------
// Ls compressor
// ---------------------------------------------------------------------------

const NOISE_DIRS = new Set([
  "node_modules", ".git", "target", "__pycache__", ".next", "dist", "build",
  ".cache", ".turbo", ".vercel", ".pytest_cache", ".mypy_cache", ".tox",
  ".venv", "venv", "coverage", ".nyc_output", ".DS_Store", "Thumbs.db",
  ".idea", ".vscode", ".vs", ".eggs",
]);

function humanSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)}M`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${bytes}B`;
}

function compressLsOutput(raw: string): string {
  const dirs: string[] = [];
  const files: Array<[string, string]> = [];
  const byExt = new Map<string, number>();
  for (const line of raw.split("\n")) {
    if (line.startsWith("total ") || !line.trim()) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 9) continue;
    const name = parts.slice(8).join(" ");
    if (name === "." || name === "..") continue;
    if (NOISE_DIRS.has(name)) continue;
    if (parts[0].startsWith("d")) {
      dirs.push(name);
    } else if (parts[0].startsWith("-") || parts[0].startsWith("l")) {
      const size = parseInt(parts[4] ?? "0", 10) || 0;
      const dotPos = name.lastIndexOf(".");
      const ext = dotPos >= 0 ? name.slice(dotPos) : "no ext";
      byExt.set(ext, (byExt.get(ext) ?? 0) + 1);
      files.push([name, humanSize(size)]);
    }
  }
  if (!dirs.length && !files.length) return "(empty)\n";
  let out = "";
  for (const d of dirs) out += `${d}/\n`;
  for (const [name, size] of files) out += `${name}  ${size}\n`;
  out += "\n";
  let summary = `${files.length} files, ${dirs.length} dirs`;
  if (byExt.size) {
    const extCounts = [...byExt.entries()].sort((a, b) => b[1] - a[1]);
    const extParts = extCounts.slice(0, 5).map(([e, c]) => `${c} ${e}`);
    summary += ` (${extParts.join(", ")}`;
    if (extCounts.length > 5) summary += `, +${extCounts.length - 5} more`;
    summary += ")";
  }
  return out + summary + "\n";
}

// ---------------------------------------------------------------------------
// Grep compressor
// ---------------------------------------------------------------------------

function compressGrepOutput(raw: string, pattern: string, maxResults = 50, maxLineLen = 120): string {
  if (!raw.trim()) return `0 matches for '${pattern}'`;
  const byFile = new Map<string, Array<[number, string]>>();
  let total = 0;
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split(":");
    if (parts.length < 3 || !/^\d+$/.test(parts[1] ?? "")) continue;
    const file = parts[0] ?? "";
    const lineNum = parseInt(parts[1] ?? "0", 10);
    const content = parts.slice(2).join(":");
    const cleaned = content.trim().length > maxLineLen
      ? content.trim().slice(0, maxLineLen - 3) + "..."
      : content.trim();
    total++;
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file)!.push([lineNum, cleaned]);
  }
  if (total === 0) return `0 matches for '${pattern}'`;
  let out = `${total} matches in ${byFile.size} files:\n\n`;
  let shown = 0;
  for (const [file, matches] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (shown >= maxResults) break;
    out += `${file} (${matches.length}):\n`;
    for (const [ln, content] of matches.slice(0, 10)) {
      out += `  ${String(ln).padStart(4)}: ${content}\n`;
      shown++;
      if (shown >= maxResults) break;
    }
    if (matches.length > 10) out += `  +${matches.length - 10}\n`;
    out += "\n";
  }
  if (total > shown) out += `... +${total - shown} more\n`;
  return out;
}

// ---------------------------------------------------------------------------
// Diff compressor
// ---------------------------------------------------------------------------

function condenseDiff(diff: string): string {
  const result: string[] = [];
  let currentFile = "";
  let added = 0, removed = 0;
  const changes: string[] = [];
  const flush = (): void => {
    if (currentFile && (added > 0 || removed > 0)) {
      result.push(`${currentFile} (+${added} -${removed})`);
      for (const c of changes.slice(0, 10)) result.push(`  ${c}`);
      if (changes.length > 10) result.push(`  ... +${changes.length - 10} more`);
    }
  };
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      flush();
      currentFile = line.replace(/^\+\+\+ b?\//, "");
      added = 0; removed = 0; changes.length = 0;
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      added++;
      if (changes.length < 15) changes.push(line.length > 70 ? line.slice(0, 67) + "..." : line);
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      removed++;
      if (changes.length < 15) changes.push(line.length > 70 ? line.slice(0, 67) + "..." : line);
    }
  }
  flush();
  return result.join("\n");
}

// ---------------------------------------------------------------------------
// Filter + read compressor
// ---------------------------------------------------------------------------

interface CommentPatterns { line?: string; blockStart?: string; blockEnd?: string; docLine?: string; docBlockStart?: string; }

function languageFromExtension(ext: string): Language {
  const map: Record<string, Language> = {
    rs: "rust", py: "python", pyw: "python",
    js: "javascript", mjs: "javascript", cjs: "javascript",
    ts: "typescript", tsx: "typescript",
    go: "go", c: "c", h: "c", cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
    java: "java", rb: "ruby", sh: "shell", bash: "shell", zsh: "shell",
  };
  return map[ext.toLowerCase()] ?? "unknown";
}

function commentPatterns(lang: Language): CommentPatterns {
  if (lang === "python") return { line: "#", blockStart: '"""', blockEnd: '"""', docBlockStart: '"""' };
  if (lang === "ruby") return { line: "#", blockStart: "=begin", blockEnd: "=end" };
  if (lang === "shell") return { line: "#" };
  return { line: "//", blockStart: "/*", blockEnd: "*/", docBlockStart: "/**" };
}

function minimalFilter(content: string, lang: Language): string {
  const patterns = commentPatterns(lang);
  const lines = content.split("\n");
  const result: string[] = [];
  let inBlock = false, inDocstring = false;
  for (const line of lines) {
    const t = line.trim();
    if (patterns.blockStart && patterns.blockEnd) {
      if (!inDocstring && t.includes(patterns.blockStart) &&
          !(patterns.docBlockStart && t.startsWith(patterns.docBlockStart))) {
        inBlock = true;
      }
      if (inBlock) { if (t.includes(patterns.blockEnd)) inBlock = false; continue; }
    }
    if (lang === "python" && t.startsWith('"""')) { inDocstring = !inDocstring; result.push(line); continue; }
    if (inDocstring) { result.push(line); continue; }
    if (patterns.line && t.startsWith(patterns.line)) {
      if (patterns.docLine && t.startsWith(patterns.docLine)) result.push(line);
      continue;
    }
    result.push(line);
  }
  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function compressReadOutput(content: string, ext: string): string {
  const lang = languageFromExtension(ext);
  return minimalFilter(content, lang);
}

// ---------------------------------------------------------------------------
// Generic cap for unknown commands
// ---------------------------------------------------------------------------

function capLines(raw: string, maxLines = 200): string {
  const lines = raw.split("\n");
  if (lines.length <= maxLines) return raw;
  return lines.slice(0, maxLines).join("\n") + `\n... +${lines.length - maxLines} more lines`;
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
