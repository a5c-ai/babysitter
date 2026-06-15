import { normalizeSessionStateDir } from "../../../config";

export interface SessionCommandScopeArgs {
  sessionId?: string;
  runId?: string;
  stateDir?: string;
  json: boolean;
}

export function emitSessionCommandError(
  json: boolean,
  error: Record<string, unknown>,
  lines: string | string[],
): number {
  if (json) {
    console.error(JSON.stringify(error, null, 2));
  } else {
    for (const line of Array.isArray(lines) ? lines : [lines]) {
      console.error(line);
    }
  }
  return 1;
}

export function resolveSessionStateDir(stateDir?: string): string {
  return normalizeSessionStateDir(stateDir ?? process.env.BABYSITTER_STATE_DIR);
}

export function requireSessionScope(
  args: SessionCommandScopeArgs,
  options: { requireRunId?: boolean } = {},
): { sessionId: string; runId?: string; stateDir: string } | number {
  if (!args.sessionId) {
    return emitSessionCommandError(
      args.json,
      { error: "MISSING_SESSION_ID", message: "--session-id is required" },
      "Error: --session-id is required",
    );
  }
  if (options.requireRunId && !args.runId) {
    return emitSessionCommandError(
      args.json,
      { error: "MISSING_RUN_ID", message: "--run-id is required" },
      "Error: --run-id is required",
    );
  }
  return {
    sessionId: args.sessionId,
    runId: args.runId,
    stateDir: resolveSessionStateDir(args.stateDir),
  };
}
