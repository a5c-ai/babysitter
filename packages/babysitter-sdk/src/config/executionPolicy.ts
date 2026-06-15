/**
 * Execution-policy gates (#949).
 *
 * Two GLOBAL, default-OFF switches control whether babysitter auto-performs work
 * versus merely emitting effects as pending for a host harness to perform:
 *
 *   - BABYSITTER_CROSS_SUBAGENTS — gates cross-harness agent/skill dispatch.
 *   - BABYSITTER_EXECUTE_TASKS   — gates shell/node task auto-execution.
 *
 * Both are read from `process.env` at CALL time (not module-load) so tests and
 * runtimes can toggle them dynamically. Truthy is "1" or "true"
 * (case-insensitive); everything else (including unset and "") is false.
 */

export const CROSS_SUBAGENTS_ENV_VAR = "BABYSITTER_CROSS_SUBAGENTS";
export const EXECUTE_TASKS_ENV_VAR = "BABYSITTER_EXECUTE_TASKS";

function parseBool(raw: string | undefined): boolean {
  if (raw === undefined) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

/**
 * True when cross-harness agent/skill auto-dispatch is enabled.
 * Default OFF.
 */
export function crossSubagentsEnabled(): boolean {
  return parseBool(process.env[CROSS_SUBAGENTS_ENV_VAR]);
}

/**
 * True when shell/node task auto-execution is enabled.
 * Default OFF.
 */
export function executeTasksEnabled(): boolean {
  return parseBool(process.env[EXECUTE_TASKS_ENV_VAR]);
}
