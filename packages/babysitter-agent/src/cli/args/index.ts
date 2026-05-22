import { resolveRunsDir } from "@a5c-ai/babysitter-sdk";
import type { HarnessParsedArgs } from "./types";
import { BOOLEAN_FLAGS, FLAG_PARSERS } from "./argFlags";
import { applyPositionalArgs } from "./argPositionals";

function createDefaultParsedArgs(initialCommand?: string): HarnessParsedArgs {
  return {
    command: initialCommand,
    runsDir: resolveRunsDir(),
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

function normalizeInitialCommand(parsed: HarnessParsedArgs) {
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

export function parseHarnessArgs(argv: string[]): HarnessParsedArgs {
  const [initialCommand, ...rest] = argv;
  const parsed = createDefaultParsedArgs(initialCommand);
  normalizeInitialCommand(parsed);

  const positionals: string[] = [];
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
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
      index = parseFlag(parsed, rest, index);
      continue;
    }

    positionals.push(arg);
  }

  applyPositionalArgs(parsed, positionals);
  return parsed;
}

export type { HarnessParsedArgs };
