import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

export function getNpmCommand(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

export function getNpxCommand(): string {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

export async function runPackageBinaryViaNpx(args: {
  harness: string;
  packageName: string;
  packageArgs: string[];
  summary: string;
  options: HarnessInstallOptions;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  location?: string;
}): Promise<HarnessInstallResult> {
  const displayCommand = "npx";
  const command = getNpxCommand();
  const commandArgs = ["--yes", args.packageName, ...args.packageArgs];

  if (args.options.dryRun) {
    return {
      harness: args.harness,
      dryRun: true,
      summary: args.summary,
      command: renderCommand(displayCommand, commandArgs),
      location: args.location,
    };
  }

  const result = await execFilePromise(command, commandArgs, {
    cwd: args.cwd,
    env: args.env,
  });
  if (result.exitCode !== 0) {
    throw new BabysitterRuntimeError(
      "HarnessPluginInstallFailed",
      `${renderCommand(displayCommand, commandArgs)} failed`,
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
    command: renderCommand(displayCommand, commandArgs),
    location: args.location,
    output: [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"),
  };
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

  const command = getNpmCommand();
  const commandArgs = ["install", "-g", args.packageName];
  if (args.options.dryRun) {
    return {
      harness: args.harness,
      dryRun: true,
      summary: args.summary,
      command: renderCommand("npm", commandArgs),
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

export function getCodexHome(): string {
  return process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

export function getInstalledCodexSkillDir(): string {
  return path.join(getCodexHome(), "skills", "babysit");
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
  const base = path.resolve(workspace ?? os.homedir());
  return path.join(base, ".gemini", "extensions", "babysitter");
}

export function isGeminiPluginInstalled(workspace?: string): boolean {
  return existsSync(getGeminiExtensionDir(workspace));
}
