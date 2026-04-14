/**
 * session:whoami — surface the current session resolution provenance for the
 * calling process. Used to diagnose PID-marker vs env-var skew when multiple
 * Claude Code (or other harness) instances share a shell environment.
 */

import {
  resolveSessionIdDetailed,
  type SessionResolutionDetails,
} from "../../harness/claudeCode";
import {
  findHarnessAncestorPid,
  getSessionMarkerPath,
  deriveProcessNames,
  readSessionMarker,
} from "../../utils/sessionMarker";
import { isProcessAlive } from "../../utils/processLiveness";
import { getAdapterByName } from "../../harness";
import { HARNESS_ENV_VARS } from "../../session/discovery";

export interface SessionWhoamiArgs {
  harness?: string;
  json?: boolean;
}

export interface SessionWhoamiResult {
  harness: string;
  sessionId: string | null;
  resolvedFrom: "pid-marker" | "env-file" | "env-var" | "explicit" | "none";
  ancestorPid: number | null;
  ancestorAlive: boolean | null;
  markerPath: string | null;
  envFilePath: string | null;
  envVarPresent: boolean;
  envVarMatches: boolean | null;
}

function resolveClaudeCode(): SessionWhoamiResult {
  const details: SessionResolutionDetails = resolveSessionIdDetailed();
  const markerPath =
    details.ancestorPid !== null
      ? getSessionMarkerPath("claude-code", details.ancestorPid)
      : null;
  const envVar = process.env.BABYSITTER_SESSION_ID;
  const envVarPresent = Boolean(envVar);
  let envVarMatches: boolean | null;
  if (!envVarPresent) envVarMatches = null;
  else if (!details.sessionId) envVarMatches = null;
  else envVarMatches = envVar === details.sessionId;

  return {
    harness: "claude-code",
    sessionId: details.sessionId ?? null,
    resolvedFrom: details.resolvedFrom,
    ancestorPid: details.ancestorPid,
    ancestorAlive: details.ancestorAlive,
    markerPath,
    envFilePath: process.env.CLAUDE_ENV_FILE ?? null,
    envVarPresent,
    envVarMatches,
  };
}

function resolveGenericHarness(harness: string): SessionWhoamiResult {
  // Adapter-based sessionId (best effort).
  let sessionId: string | undefined;
  try {
    const adapter = getAdapterByName(harness);
    sessionId = adapter?.resolveSessionId({});
  } catch {
    sessionId = undefined;
  }

  // PID-marker introspection for provenance.
  const processNames = deriveProcessNames(harness);
  const ancestor = findHarnessAncestorPid(processNames);
  const ancestorPid = ancestor?.pid ?? null;
  const ancestorAlive = ancestorPid !== null ? isProcessAlive(ancestorPid) : null;
  const markerSessionId = readSessionMarker(harness);
  const markerPath = ancestorPid !== null ? getSessionMarkerPath(harness, ancestorPid) : null;
  const harnessEnvSessionId = (HARNESS_ENV_VARS[harness] || [])
    .map((key) => process.env[key])
    .find((value): value is string => Boolean(value));
  const babysitterEnvSessionId = process.env.BABYSITTER_SESSION_ID;

  let resolvedFrom: SessionWhoamiResult["resolvedFrom"] = "none";
  let finalSessionId = sessionId ?? markerSessionId;
  if (sessionId && harnessEnvSessionId && sessionId === harnessEnvSessionId) {
    resolvedFrom = "env-var";
    finalSessionId = sessionId;
  } else if (sessionId && babysitterEnvSessionId && sessionId === babysitterEnvSessionId) {
    resolvedFrom = "env-var";
    finalSessionId = sessionId;
  } else if (markerSessionId && (!sessionId || sessionId === markerSessionId)) {
    resolvedFrom = "pid-marker";
    finalSessionId = markerSessionId;
  } else if (sessionId) {
    resolvedFrom = "env-var";
    finalSessionId = sessionId;
  }

  const envVar = babysitterEnvSessionId;
  const envVarPresent = Boolean(envVar);
  let envVarMatches: boolean | null;
  if (!envVarPresent) envVarMatches = null;
  else if (!finalSessionId) envVarMatches = null;
  else envVarMatches = envVar === finalSessionId;

  return {
    harness,
    sessionId: finalSessionId ?? null,
    resolvedFrom,
    ancestorPid,
    ancestorAlive,
    markerPath,
    envFilePath: null,
    envVarPresent,
    envVarMatches,
  };
}

export function runSessionWhoami(args: SessionWhoamiArgs): SessionWhoamiResult {
  const harness = args.harness ?? "claude-code";
  if (harness === "claude-code") return resolveClaudeCode();
  return resolveGenericHarness(harness);
}

export function handleSessionWhoami(args: SessionWhoamiArgs): number {
  const result = runSessionWhoami(args);
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`harness: ${result.harness}`);
    console.log(`sessionId: ${result.sessionId ?? "(none)"}`);
    console.log(`resolvedFrom: ${result.resolvedFrom}`);
    console.log(`ancestorPid: ${result.ancestorPid ?? "(none)"}`);
    console.log(`ancestorAlive: ${result.ancestorAlive ?? "(unknown)"}`);
    console.log(`markerPath: ${result.markerPath ?? "(none)"}`);
    console.log(`envFilePath: ${result.envFilePath ?? "(none)"}`);
    console.log(`envVarPresent: ${result.envVarPresent}`);
    console.log(`envVarMatches: ${result.envVarMatches ?? "(n/a)"}`);
  }
  return 0;
}
