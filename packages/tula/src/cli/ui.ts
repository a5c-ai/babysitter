import * as path from "node:path";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import {
  BabysitterRuntimeError,
  ErrorCategory,
  formatErrorWithContext,
  isBabysitterError,
  suggestCommand,
  toStructuredError,
} from "@a5c-ai/babysitter-sdk";
import { AGENT_PROGRAM } from "./program";

export function supportsColors(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.FORCE_COLOR !== undefined) return true;
  return Boolean(process.stderr?.isTTY);
}

export function handleUnknownCommand(command: string, json: boolean): number {
  const error = new BabysitterRuntimeError("UnknownCommandError", `Unknown command: ${command}`, {
    category: ErrorCategory.Validation,
    suggestions: suggestCommand(command) ? [`Did you mean: ${suggestCommand(command)}?`] : [],
    nextSteps: [
      `Run ${AGENT_PROGRAM.commandName} --help to see available agent runtime commands.`,
      'Use "babysitter harness:install" or "babysitter harness:install-plugin" for installation commands.',
    ],
    details: { command, program: AGENT_PROGRAM.commandName },
  });
  if (json) {
    console.error(JSON.stringify(toStructuredError(error), null, 2));
  } else {
    console.error(formatErrorWithContext(error, { colors: supportsColors() }));
  }
  return 1;
}

export function outputError(error: Error, options: { json: boolean; verbose?: boolean }): void {
  const { json, verbose = false } = options;
  if (json) {
    console.error(JSON.stringify(toStructuredError(error, verbose)));
    return;
  }
  const colors = supportsColors();
  if (isBabysitterError(error)) {
    console.error(formatErrorWithContext(error, { colors, includeStack: verbose }));
    return;
  }
  const wrappedError = new BabysitterRuntimeError(error.name || "Error", error.message, {
    category: ErrorCategory.Internal,
    nextSteps: ["If this error persists, please report it as a bug."],
  });
  console.error(formatErrorWithContext(wrappedError, { colors, includeStack: verbose }));
}

export async function readCliVersion(): Promise<string> {
  const candidatePaths = [
    path.join(process.cwd(), "package.json"),
    path.join(process.cwd(), "packages", "tula", "package.json"),
    path.join(__dirname, "..", "..", "package.json"),
    path.join(__dirname, "..", "..", "..", "package.json"),
  ];
  for (const packagePath of candidatePaths) {
    try {
      const raw = await fs.readFile(packagePath, "utf8");
      return (JSON.parse(raw) as { version?: string }).version ?? "unknown";
    } catch {
      // try the next candidate
    }
  }
  return "unknown";
}

export async function launchObserver(workspace?: string): Promise<number> {
  const watchDir = workspace ?? path.resolve(process.cwd(), "..");
  const colors = supportsColors();
  const bold = colors ? "\x1b[1m" : "";
  const dim = colors ? "\x1b[2m" : "";
  const reset = colors ? "\x1b[0m" : "";
  process.stderr.write(`${bold}Launching babysitter observer dashboard...${reset}\n`);
  process.stderr.write(`${dim}Watching: ${watchDir}${reset}\n\n`);

  const child = spawn("npx", ["-y", "@a5c-ai/babysitter-observer-dashboard@latest", "--watch-dir", watchDir], {
    stdio: "inherit",
    shell: true,
  });

  return await new Promise<number>((resolve) => {
    child.on("close", (code) => resolve(code ?? 0));
    child.on("error", (err) => {
      process.stderr.write(`Failed to launch observer: ${err.message}\n`);
      resolve(1);
    });
  });
}
