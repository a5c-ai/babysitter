/**
 * Hook Dispatcher
 * Executes shell hooks from Node.js
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import * as path from "node:path";
import type {
  HookDispatcherOptions,
  HookResult,
  HookExecutionResult,
} from "./types";
import { DEFAULTS } from "../config/defaults";

/**
 * Find `plugins/babysitter/hooks/hook-dispatcher.sh` by walking up from cwd.
 * This allows running from nested projects/fixtures inside a mono-repo.
 *
 * @internal
 */
export function findHookDispatcherPath(startCwd: string): string | null {
  const claudePluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (claudePluginRoot) {
    const candidate = path.join(path.resolve(claudePluginRoot), "hooks", "hook-dispatcher.sh");
    if (existsSync(candidate)) return candidate;
  }

  let current = path.resolve(startCwd);
  // Guard against infinite loops: stop once we stop making progress.
  for (let i = 0; i < 50; i++) {
    const candidate = path.join(current, "plugins", "babysitter", "hooks", "hook-dispatcher.sh");
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

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
    timeout = DEFAULTS.hookTimeout,
    throwOnFailure = false,
  } = options;

  const dispatcherPath = findHookDispatcherPath(cwd);
  if (!dispatcherPath) {
    return {
      hookType,
      success: false,
      error:
        `Hook dispatcher not found. Expected plugins/babysitter/hooks/hook-dispatcher.sh ` +
        `in ${cwd} or any parent directory.`,
      executedHooks: [],
    };
  }

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
    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
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
      const _duration = Date.now() - startTime;

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
