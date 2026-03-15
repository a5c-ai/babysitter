/**
 * hook:run CLI command.
 *
 * Dispatches hook handling to the appropriate harness adapter.
 * Each harness (e.g. "claude-code") implements its own stop and
 * session-start handlers via the HarnessAdapter interface.
 *
 * The "user-prompt-submit" hook type is harness-agnostic: it reads the
 * Claude Code UserPromptSubmit JSON payload from stdin, applies density-filter
 * compression if the prompt exceeds the configured token threshold, and writes
 * the (possibly compressed) payload to stdout.
 */

import { getAdapterByName, listSupportedHarnesses } from "../../harness";
import { loadCompressionConfig } from "../../compression/config-loader";
import { densityFilterText, estimateTokens } from "../../compression/density-filter";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface HookRunCommandArgs {
  hookType: string;
  /** Which host tool is invoking the hook. Defaults to "claude-code". */
  harness: string;
  pluginRoot?: string;
  stateDir?: string;
  runsDir?: string;
  json: boolean;
  verbose?: boolean;
}

// ---------------------------------------------------------------------------
// Stdin reader
// ---------------------------------------------------------------------------

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });
}

async function handleUserPromptSubmit(): Promise<number> {
  let raw: string;
  try {
    raw = await readStdin();
  } catch {
    return 0;
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Not valid JSON — pass through unchanged
    process.stdout.write(raw);
    return 0;
  }

  // Apply compression only if enabled; if disabled, falls through and outputs original payload
  const config = loadCompressionConfig(process.cwd());
  const layer = config.layers.userPromptHook;

  if (config.enabled && layer.enabled) {
    const prompt = payload.prompt;
    if (typeof prompt === "string") {
      const tokenCount = estimateTokens(prompt);
      if (tokenCount > layer.threshold) {
        payload.prompt = densityFilterText(prompt, 1 - layer.keepRatio);
      }
    }
  }

  process.stdout.write(JSON.stringify(payload));
  return 0;
}

// ---------------------------------------------------------------------------
// pre-tool-use handler (harness-agnostic, self-contained)
//
// Reads the Claude Code PreToolUse JSON payload from stdin, checks if the
// Bash command is a simple compressible one (git, ls, grep, diff, cat, …),
// and rewrites it to `babysitter compress-output <cmd>` so command output is
// compressed before it enters Claude's context window.
//
// Replaces the external rtk-rewrite.sh hook with a self-contained babysitter
// implementation.
// ---------------------------------------------------------------------------

const COMPRESSIBLE_BINS = new Set([
  "git", "ls", "dir", "grep", "rg", "ag", "diff", "delta",
  "cat", "head", "tail", "less", "more",
]);

/** Returns true if the command is a plain invocation with no shell operators. */
function isSimpleCommand(cmd: string): boolean {
  // Skip rewrites for commands that contain pipes, redirects, subshells, etc.
  return !/[|;&<>`]|\$\(/.test(cmd);
}

async function handlePreToolUse(): Promise<number> {
  let raw: string;
  try {
    raw = await readStdin();
  } catch {
    return 0;
  }

  // Check feature flag before doing anything
  const config = loadCompressionConfig(process.cwd());
  if (!config.enabled || !config.layers.commandOutputHook.enabled) {
    return 0;
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Not JSON — pass through
    return 0;
  }

  const toolInput = payload.tool_input as Record<string, unknown> | undefined;
  const command = typeof toolInput?.command === "string" ? toolInput.command.trim() : "";

  if (!command) return 0;

  const firstToken = command.split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!COMPRESSIBLE_BINS.has(firstToken)) return 0;
  if (!isSimpleCommand(command)) return 0;

  // Respect excludeCommands from config
  const excluded = config.layers.commandOutputHook.excludeCommands;
  if (excluded.some(exc => firstToken === exc.toLowerCase())) return 0;

  // Rewrite: prepend `babysitter compress-output`
  const rewritten = `babysitter compress-output ${command}`;
  const updatedInput = { ...toolInput, command: rewritten };

  const response = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: "babysitter output compression",
      updatedInput,
    },
  };
  process.stdout.write(JSON.stringify(response) + "\n");
  return 0;
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

export async function handleHookRun(args: HookRunCommandArgs): Promise<number> {
  const { hookType, harness, json } = args;

  if (!hookType) {
    const error = {
      error: "MISSING_HOOK_TYPE",
      message: "--hook-type is required for hook:run",
    };
    if (json) {
      process.stderr.write(JSON.stringify(error, null, 2) + "\n");
    } else {
      process.stderr.write("Error: --hook-type is required for hook:run\n");
    }
    return 1;
  }

  // harness-agnostic hook types — handle before adapter lookup
  if (hookType === "user-prompt-submit") {
    return await handleUserPromptSubmit();
  }
  if (hookType === "pre-tool-use") {
    return await handlePreToolUse();
  }

  const adapter = getAdapterByName(harness);
  if (!adapter) {
    const supported = listSupportedHarnesses();
    const error = {
      error: "UNSUPPORTED_HARNESS",
      message: `Unsupported harness: "${harness}". Supported: ${supported.join(", ")}`,
    };
    if (json) {
      process.stderr.write(JSON.stringify(error, null, 2) + "\n");
    } else {
      process.stderr.write(`Error: ${error.message}\n`);
    }
    return 1;
  }

  switch (hookType) {
    case "stop":
      return await adapter.handleStopHook(args);
    case "session-start":
      return await adapter.handleSessionStartHook(args);
    default: {
      const error = {
        error: "UNKNOWN_HOOK_TYPE",
        message: `Unknown hook type: ${hookType}. Supported: stop, session-start, user-prompt-submit`,
      };
      if (json) {
        process.stderr.write(JSON.stringify(error, null, 2) + "\n");
      } else {
        process.stderr.write(
          `Error: Unknown hook type: ${hookType}. Supported: stop, session-start, user-prompt-submit\n`,
        );
      }
      return 1;
    }
  }
}
