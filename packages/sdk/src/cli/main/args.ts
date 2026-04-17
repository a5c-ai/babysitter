import { existsSync } from "node:fs";
import * as path from "node:path";
import { CONFIG_ENV_VARS, DEFAULTS } from "../../config/defaults";
import type { ParsedArgs } from "./types";
import { BOOLEAN_FLAGS, FLAG_PARSERS } from "./argFlags";
import { applyPositionalArgs } from "./argPositionals";
import { collapseDoubledA5cRuns as _sharedCollapseDoubledA5cRuns } from "../resolveInputPath";

const collapseDoubledA5cRuns = _sharedCollapseDoubledA5cRuns;

function createDefaultParsedArgs(initialCommand?: string): ParsedArgs {
  return {
    command: initialCommand,
    runsDir: process.env[CONFIG_ENV_VARS.RUNS_DIR] ?? DEFAULTS.runsDir,
    json: false,
    dryRun: false,
    verbose: false,
    helpRequested: false,
    helpSurface: "agent",
    pendingOnly: false,
    reverseOrder: false,
    showConfig: false,
    showStrata: false,
    tree: false,
    rich: false,
    defaultsOnly: false,
  };
}

function normalizeInitialCommand(parsed: ParsedArgs) {
  if (parsed.command === "--help" || parsed.command === "-h") {
    parsed.command = undefined;
    parsed.helpRequested = true;
    return;
  }
  if (parsed.command === "--help-human") {
    parsed.command = undefined;
    parsed.helpRequested = true;
    parsed.helpSurface = "human";
    return;
  }
  if (parsed.command === "--version" || parsed.command === "-v") {
    parsed.command = "version";
  }
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [initialCommand, ...rest] = argv;
  const parsed = createDefaultParsedArgs(initialCommand);
  normalizeInitialCommand(parsed);

  const positionals: string[] = [];
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--help" || arg === "-h") {
      parsed.helpRequested = true;
      continue;
    }
    if (arg === "--help-human") {
      parsed.helpRequested = true;
      parsed.helpSurface = "human";
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      parsed.command = "version";
      continue;
    }

    const applyBoolean = BOOLEAN_FLAGS[arg];
    if (applyBoolean) {
      applyBoolean(parsed);
      continue;
    }

    const parseFlag = FLAG_PARSERS[arg];
    if (parseFlag) {
      i = parseFlag(parsed, rest, i);
      continue;
    }

    positionals.push(arg);
  }

  applyPositionalArgs(parsed, positionals);
  return parsed;
}

function normalizePosix(value: string): string {
  return path.normalize(value).replace(/\\/g, "/").replace(/\/+$/, "");
}

export function resolveRunDir(baseDir: string, runDirArg?: string): string {
  if (!runDirArg) throw new Error("Run directory argument is required.");
  if (path.isAbsolute(runDirArg)) {
    return collapseDoubledA5cRuns(path.normalize(runDirArg));
  }

  const normalBase = normalizePosix(baseDir);
  const normalArg = normalizePosix(runDirArg);
  if (normalBase && (normalArg === normalBase || normalArg.startsWith(normalBase + "/"))) {
    return collapseDoubledA5cRuns(path.resolve(runDirArg));
  }

  const standard = collapseDoubledA5cRuns(path.resolve(baseDir, runDirArg));
  try {
    if (!existsSync(standard)) {
      const fromCwd = path.resolve(runDirArg);
      if (existsSync(fromCwd)) {
        return collapseDoubledA5cRuns(fromCwd);
      }
    }
  } catch {
    // Ignore filesystem errors during resolution.
  }
  return standard;
}

export { collapseDoubledA5cRuns };
