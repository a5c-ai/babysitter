/**
 * hook:run CLI command.
 *
 * Dispatches hook handling to the appropriate harness adapter.
 * Each harness (e.g. "claude-code") implements its own stop and
 * session-start handlers via the HarnessAdapter interface.
 */

import { getAdapterByName, listSupportedHarnesses } from "../../harness";

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
        message: `Unknown hook type: ${hookType}. Supported: stop, session-start`,
      };
      if (json) {
        process.stderr.write(JSON.stringify(error, null, 2) + "\n");
      } else {
        process.stderr.write(
          `Error: Unknown hook type: ${hookType}. Supported: stop, session-start\n`,
        );
      }
      return 1;
    }
  }
}
