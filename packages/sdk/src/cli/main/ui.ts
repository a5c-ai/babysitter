import { promises as fs } from "node:fs";
import * as path from "node:path";
import { configureShow } from "../commands/configure";
import type { ParsedArgs } from "./types";
import {
  CORE_PROGRAM,
  HARNESS_PROGRAM,
  isHarnessInstallCommand,
  isHarnessRuntimeCommand,
  type CliProgram
} from "./program";
import { BabysitterRuntimeError, ErrorCategory, formatErrorWithContext, isBabysitterError, suggestCommand, toStructuredError } from "../../runtime/exceptions";

function toHarnessCliCommand(command: string): string {
  if (command.startsWith("harness:")) {
    return command.slice("harness:".length);
  }
  return command;
}

export function supportsColors(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.FORCE_COLOR !== undefined) return true;
  return Boolean(process.stderr && typeof process.stderr.isTTY === "boolean" && process.stderr.isTTY);
}

export async function handleHarnessDiscover(parsed: ParsedArgs): Promise<number> {
  const { discoverHarnesses, detectCallerHarness } = await import("../../harness/discovery");
  const results = await discoverHarnesses();
  const caller = detectCallerHarness();
  if (parsed.json) {
    console.log(JSON.stringify({ installed: results, caller }, null, 2));
    return 0;
  }

  const colors = supportsColors();
  const green = colors ? "\x1b[32m" : "";
  const reset = colors ? "\x1b[0m" : "";
  const bold = colors ? "\x1b[1m" : "";
  console.log(`\n${bold}Installed Harnesses${reset}\n`);
  console.log("  Name            Installed  Version          Config   Capabilities");
  console.log("  ──────────────  ─────────  ───────────────  ───────  ────────────────────────");
  for (const result of results) {
    console.log(
      `  ${result.name.padEnd(14)}  ${(result.installed ? "yes" : "no").padEnd(9)}  ${(result.version ?? "-").padEnd(15)}  ${(result.configFound ? "yes" : "no").padEnd(7)}  ${result.capabilities.join(", ") || "-"}`
    );
  }
  console.log(
    caller
      ? `\n${bold}Caller Harness${reset}  ${green}${caller.name}${reset}  (env: ${caller.matchedEnvVars.join(", ")})`
      : `\n${bold}Caller Harness${reset}  none detected`
  );
  console.log("");
  return 0;
}

export function handleUnknownCommand(command: string, json: boolean, program: CliProgram = CORE_PROGRAM): number {
  const error = buildUnknownCommandError(command, program);
  if (json) {
    console.error(JSON.stringify(toStructuredError(error), null, 2));
  } else {
    console.error(formatErrorWithContext(error, { colors: supportsColors() }));
  }
  return 1;
}

function buildUnknownCommandError(command: string, program: CliProgram): BabysitterRuntimeError {
  if (program.variant === "core" && isHarnessRuntimeCommand(command)) {
    return new BabysitterRuntimeError(
      "CommandMovedToHarnessCli",
      `Command "${command}" is provided by ${HARNESS_PROGRAM.packageName}.`,
      {
        category: ErrorCategory.Validation,
        suggestions: [
          `Install ${HARNESS_PROGRAM.packageName}`,
          `${HARNESS_PROGRAM.commandName} ${toHarnessCliCommand(command)}`,
        ],
        nextSteps: [
          `Run ${HARNESS_PROGRAM.commandName} --help-human to see the harness runtime commands.`,
        ],
        details: {
          command,
          program: program.commandName,
          movedTo: HARNESS_PROGRAM.commandName,
        },
      },
    );
  }

  if (program.variant === "harness" && isHarnessInstallCommand(command)) {
    return new BabysitterRuntimeError(
      "CommandAvailableInCoreCli",
      `Command "${command}" remains available in ${CORE_PROGRAM.packageName}.`,
      {
        category: ErrorCategory.Validation,
        suggestions: [`${CORE_PROGRAM.commandName} ${command}`],
        nextSteps: [
          `Use ${CORE_PROGRAM.commandName} for harness installation and plugin installation commands.`,
        ],
        details: {
          command,
          program: program.commandName,
          availableIn: CORE_PROGRAM.commandName,
        },
      },
    );
  }

  return new BabysitterRuntimeError("UnknownCommandError", `Unknown command: ${command}`, {
    category: ErrorCategory.Validation,
    suggestions: suggestCommand(command) ? [`Did you mean: ${suggestCommand(command)}?`] : [],
    nextSteps: [`Run ${program.commandName} --help to see available commands`],
    details: { command, program: program.commandName },
  });
}

export function showConfigBeforeCommand(parsed: ParsedArgs): void {
  const result = configureShow({ json: parsed.json, defaultsOnly: false });
  if (parsed.json) {
    console.error(JSON.stringify({ showConfig: result }, null, 2));
    return;
  }
  console.error("[show-config] Current effective configuration:");
  for (const item of result.values) {
    console.error(`  ${item.key}=${typeof item.value === "string" ? item.value : JSON.stringify(item.value)}${item.source === "env" ? " (env)" : ""}`);
  }
  console.error("");
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
    nextSteps: ["If this error persists, please report it as a bug"],
  });
  console.error(formatErrorWithContext(wrappedError, { colors, includeStack: verbose }));
}

export async function readCliVersion(): Promise<string> {
  const candidatePaths = [
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
