import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { cp } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { checkCliAvailable } from "./discovery";
import {
  BabysitterRuntimeError,
  ErrorCategory,
} from "../runtime/exceptions";
import type {
  HarnessInstallOptions,
  HarnessInstallResult,
} from "./types";

export async function execFilePromise(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        cwd: options.cwd,
        env: options.env,
        windowsHide: true,
        maxBuffer: 20 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const execError = error as NodeJS.ErrnoException & { status?: number } | null;
        resolve({
          stdout: String(stdout ?? ""),
          stderr: String(stderr ?? ""),
          exitCode: typeof execError?.status === "number" ? execError.status : error ? 1 : 0,
        });
      },
    );
  });
}

export function renderCommand(command: string, args: string[]): string {
  return [command, ...args].join(" ");
}

export async function installCliViaNpm(args: {
  harness: string;
  cliCommand: string;
  packageName: string;
  summary: string;
  options: HarnessInstallOptions;
}): Promise<HarnessInstallResult> {
  const cliInfo = await checkCliAvailable(args.cliCommand);
  if (cliInfo.available) {
    return {
      harness: args.harness,
      warning: `${args.harness} is already installed; nothing to do.`,
      location: cliInfo.path,
    };
  }

  const command = "npm";
  const commandArgs = ["install", "-g", args.packageName];
  if (args.options.dryRun) {
    return {
      harness: args.harness,
      dryRun: true,
      summary: args.summary,
      command: renderCommand(command, commandArgs),
    };
  }

  const result = await execFilePromise(command, commandArgs);
  if (result.exitCode !== 0) {
    throw new BabysitterRuntimeError(
      "HarnessInstallFailed",
      `${renderCommand(command, commandArgs)} failed`,
      {
        category: ErrorCategory.External,
        details: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        },
      },
    );
  }

  return {
    harness: args.harness,
    summary: args.summary,
    command: renderCommand(command, commandArgs),
    output: [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"),
  };
}

export function repoRootCandidates(): string[] {
  return [
    process.env.BABYSITTER_REPO_ROOT ?? "",
    process.env.REPO_ROOT ?? "",
    process.cwd(),
    path.resolve(__dirname, "..", "..", "..", "..", ".."),
  ].filter(Boolean);
}

export function resolveRepoRoot(): string | null {
  for (const candidate of repoRootCandidates()) {
    const resolved = path.resolve(candidate);
    if (
      existsSync(path.join(resolved, "plugins", "babysitter-codex")) &&
      existsSync(path.join(resolved, "plugins", "pi")) &&
      existsSync(path.join(resolved, "packages", "sdk"))
    ) {
      return resolved;
    }
  }
  return null;
}

export function getCodexHome(): string {
  return process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

export function getInstalledCodexSkillDir(): string {
  return path.join(getCodexHome(), "skills", "babysitter-codex");
}

export function isCodexPluginInstalled(): boolean {
  return existsSync(path.join(getInstalledCodexSkillDir(), "SKILL.md"));
}

export function getClaudeInstalledPluginsPath(): string {
  return path.join(os.homedir(), ".claude", "plugins", "installed_plugins.json");
}

export function isClaudePluginInstalled(): boolean {
  const installedPath = getClaudeInstalledPluginsPath();
  if (!existsSync(installedPath)) {
    return false;
  }
  try {
    const parsed = JSON.parse(readFileSync(installedPath, "utf8")) as {
      plugins?: Record<string, unknown>;
    };
    return Object.keys(parsed.plugins ?? {}).some((key) => key.includes("babysitter@a5c.ai"));
  } catch {
    return false;
  }
}

export function getGeminiExtensionDir(workspace?: string): string {
  const base = path.resolve(workspace ?? process.cwd());
  return path.join(base, ".gemini", "extensions", "babysitter-gemini");
}

export function isGeminiPluginInstalled(workspace?: string): boolean {
  return existsSync(getGeminiExtensionDir(workspace));
}

export async function copyGeminiExtension(args: {
  harness: string;
  summary: string;
  sourceDir: string;
  targetDir: string;
  options: HarnessInstallOptions;
}): Promise<HarnessInstallResult> {
  if (existsSync(args.targetDir)) {
    return {
      harness: args.harness,
      warning: "babysitter-gemini is already present in the active workspace; skipping reinstall.",
      location: args.targetDir,
    };
  }

  if (args.options.dryRun) {
    return {
      harness: args.harness,
      dryRun: true,
      summary: args.summary,
      location: args.targetDir,
    };
  }

  mkdirSync(path.dirname(args.targetDir), { recursive: true });
  await cp(args.sourceDir, args.targetDir, {
    recursive: true,
    force: true,
    filter: (entry) => {
      const name = path.basename(entry);
      return !["node_modules", ".git", ".a5c", ".DS_Store"].includes(name);
    },
  });

  return {
    harness: args.harness,
    summary: args.summary,
    location: args.targetDir,
  };
}
