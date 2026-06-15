import * as path from "node:path";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
// ── Error types (locally defined to avoid SDK dependency) ────────────────

enum ErrorCategory {
  Configuration = "CONFIGURATION",
  Validation = "VALIDATION",
  Runtime = "RUNTIME",
  External = "EXTERNAL",
  Internal = "INTERNAL",
}

class BabysitterRuntimeError extends Error {
  readonly details?: Record<string, unknown>;
  readonly category: ErrorCategory;
  readonly suggestions: string[];
  readonly nextSteps: string[];

  constructor(
    name: string,
    message: string,
    options?: {
      category?: ErrorCategory;
      suggestions?: string[];
      nextSteps?: string[];
      details?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = name;
    this.category = options?.category ?? ErrorCategory.Runtime;
    this.suggestions = options?.suggestions ?? [];
    this.nextSteps = options?.nextSteps ?? [];
    this.details = options?.details;
  }
}

function isBabysitterError(err: unknown): err is BabysitterRuntimeError {
  return err instanceof BabysitterRuntimeError;
}
import { AGENT_PROGRAM } from "./program";

// ── Error formatting utilities (migrated from SDK) ──────────────────────

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  CONFIGURATION: "Configuration or setup issue",
  VALIDATION: "Input validation failure",
  RUNTIME: "Runtime execution error",
  EXTERNAL: "External service or dependency failure",
  INTERNAL: "Internal error (please report as a bug)",
};

interface BabysitterLikeError extends Error {
  category?: string;
  suggestions?: string[];
  nextSteps?: string[];
  details?: Record<string, unknown>;
}

function asBabysitterLike(error: Error): BabysitterLikeError | undefined {
  const e = error as BabysitterLikeError;
  if ("category" in e && "suggestions" in e && "nextSteps" in e) return e;
  return undefined;
}

function formatErrorWithContext(
  error: Error,
  options: { colors?: boolean; includeStack?: boolean; prefix?: string } = {},
): string {
  const { colors = false, includeStack = false, prefix = "" } = options;
  const lines: string[] = [];

  const red = colors ? (s: string) => `\x1b[31m${s}\x1b[0m` : (s: string) => s;
  const yellow = colors ? (s: string) => `\x1b[33m${s}\x1b[0m` : (s: string) => s;
  const cyan = colors ? (s: string) => `\x1b[36m${s}\x1b[0m` : (s: string) => s;
  const dim = colors ? (s: string) => `\x1b[2m${s}\x1b[0m` : (s: string) => s;
  const bold = colors ? (s: string) => `\x1b[1m${s}\x1b[0m` : (s: string) => s;

  const bErr = asBabysitterLike(error);
  const category = bErr?.category ?? "INTERNAL";
  const categoryLabel = CATEGORY_DESCRIPTIONS[category] ?? "Unknown error category";

  lines.push(`${prefix}${red(bold("Error:"))} ${error.message}`);
  lines.push(`${prefix}${dim(`[${error.name}] Category: ${categoryLabel}`)}`);

  if (bErr?.suggestions && bErr.suggestions.length > 0) {
    lines.push("");
    lines.push(`${prefix}${yellow("Did you mean?")}`);
    for (const suggestion of bErr.suggestions) lines.push(`${prefix}  - ${suggestion}`);
  }

  if (bErr?.nextSteps && bErr.nextSteps.length > 0) {
    lines.push("");
    lines.push(`${prefix}${cyan("Next Steps:")}`);
    for (const step of bErr.nextSteps) lines.push(`${prefix}  - ${step}`);
  }

  if (includeStack && error.stack) {
    lines.push("");
    lines.push(`${prefix}${dim("Stack trace:")}`);
    for (const stackLine of error.stack.split("\n").slice(1)) lines.push(`${prefix}${dim(stackLine)}`);
  }

  return lines.join("\n");
}

interface StructuredError {
  name: string;
  message: string;
  category: string;
  categoryDescription: string;
  suggestions: string[];
  nextSteps: string[];
  details?: Record<string, unknown>;
  stack?: string;
}

function toStructuredError(error: Error, includeStack = false): StructuredError {
  const bErr = asBabysitterLike(error);
  const category = bErr?.category ?? "INTERNAL";
  return {
    name: error.name,
    message: error.message,
    category,
    categoryDescription: CATEGORY_DESCRIPTIONS[category] ?? "Unknown error category",
    suggestions: bErr?.suggestions ?? [],
    nextSteps: bErr?.nextSteps ?? [],
    details: bErr?.details,
    stack: includeStack ? error.stack : undefined,
  };
}

// ── Command suggestion (migrated from SDK) ──────────────────────────────

const COMMAND_TYPOS: Record<string, string[]> = {
  "run:create": ["run:creat", "run:craete", "runcreate", "create:run", "run-create"],
  "run:status": ["run:stat", "run:staus", "runstatus", "status:run", "run-status"],
  "run:iterate": ["run:iter", "run:itterate", "runiterate", "iterate:run", "run-iterate"],
  "run:events": ["run:event", "runevents", "events:run", "run-events"],
};

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function suggestCommand(input: string): string | undefined {
  const normalizedInput = input.toLowerCase().trim();
  for (const [correct, typos] of Object.entries(COMMAND_TYPOS)) {
    if (typos.includes(normalizedInput)) return correct;
  }
  const commands = Object.keys(COMMAND_TYPOS);
  let bestMatch: string | undefined;
  let bestDistance = Infinity;
  for (const command of commands) {
    const distance = levenshteinDistance(normalizedInput, command);
    if (distance < bestDistance && distance <= 3) {
      bestDistance = distance;
      bestMatch = command;
    }
  }
  return bestMatch;
}

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
    path.join(process.cwd(), "packages", "genty", "package.json"),
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
