/**
 * Hook Dispatcher
 * Executes shell hooks from Node.js
 */

import { spawn } from "node:child_process";
import * as path from "node:path";
import type {
  HookDispatcherOptions,
  HookResult,
  HookExecutionResult,
} from "./types";

/**
 * Call a hook by dispatching to the shell hook-dispatcher.sh
 */
export async function callHook(
  options: HookDispatcherOptions
): Promise<HookResult> {
  const {
    hookType,
    payload,
    cwd = process.cwd(),
    timeout = 30000,
    throwOnFailure = false,
  } = options;

  // Find the hook-dispatcher.sh script
  // Assume it's in plugins/babysitter/hooks/hook-dispatcher.sh
  const dispatcherPath = path.join(
    cwd,
    "plugins",
    "babysitter",
    "hooks",
    "hook-dispatcher.sh"
  );

  const payloadJson = JSON.stringify(payload);
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const child = spawn("bash", [dispatcherPath, hookType], {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      timeout,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    // Send payload via stdin
    child.stdin.write(payloadJson);
    child.stdin.end();

    // Collect output
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Handle timeout
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeout);

    child.on("error", (error) => {
      clearTimeout(timeoutHandle);
      const result: HookResult = {
        hookType,
        success: false,
        error: `Failed to spawn hook dispatcher: ${error.message}`,
        executedHooks: [],
      };

      if (throwOnFailure) {
        reject(new Error(result.error));
      } else {
        resolve(result);
      }
    });

    child.on("close", (exitCode) => {
      clearTimeout(timeoutHandle);
      const duration = Date.now() - startTime;

      if (timedOut) {
        const result: HookResult = {
          hookType,
          success: false,
          error: `Hook execution timed out after ${timeout}ms`,
          executedHooks: [],
        };

        if (throwOnFailure) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
        return;
      }

      // Parse execution results from stderr
      const executedHooks = parseHookExecutionSummary(stderr);

      const result: HookResult = {
        hookType,
        success: exitCode === 0,
        output: stdout ? tryParseJson(stdout) : undefined,
        error:
          exitCode !== 0
            ? `Hook dispatcher exited with code ${exitCode}`
            : undefined,
        executedHooks,
      };

      if (throwOnFailure && !result.success) {
        reject(
          new Error(
            result.error ||
              `Hook ${hookType} failed with exit code ${exitCode}`
          )
        );
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Parse hook execution summary from stderr output
 * Looks for lines like: "plugin:logger.sh:success"
 */
function parseHookExecutionSummary(stderr: string): HookExecutionResult[] {
  const results: HookExecutionResult[] = [];
  const lines = stderr.split("\n");

  for (const line of lines) {
    // Look for summary lines: "location:hookname:status[:exitcode]"
    const match = line.match(/^(per-repo|per-user|plugin):([^:]+):([^:]+)(?::(\d+))?$/);
    if (match) {
      const [, location, hookName, status, exitCodeStr] = match;
      results.push({
        hookPath: `unknown`, // We don't have full path in summary
        hookName,
        hookLocation: location as "per-repo" | "per-user" | "plugin",
        status: status as "success" | "failed",
        exitCode: exitCodeStr ? parseInt(exitCodeStr, 10) : undefined,
      });
    }
  }

  return results;
}

/**
 * Try to parse JSON, return raw string if it fails
 */
function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str.trim();
  }
}
