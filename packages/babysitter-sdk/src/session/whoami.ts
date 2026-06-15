import {
  getHarnessCallerEnvVars,
  getSessionResolutionDetails,
} from "../harness/registry";
import {
  deriveProcessNames,
  findHarnessAncestorPid,
  getSessionMarkerPath,
  isSessionPidMarkerEnabled,
  readSessionMarker,
} from "../utils/sessionMarker";
import { isProcessAlive } from "../utils/processLiveness";
import { getAdapterByName } from "../harness";

export interface SessionWhoamiArgs {
  harness?: string;
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
  const details = getSessionResolutionDetails("claude-code");
  if (!details) {
    return resolveGenericHarness("claude-code");
  }
  const markerPath =
    details.ancestorPid !== null
      ? getSessionMarkerPath("claude-code", details.ancestorPid)
      : null;
  const envVar = process.env.AGENT_SESSION_ID;
  const envVarPresent = Boolean(envVar);
  let envVarMatches: boolean | null;
  if (!envVarPresent) {
    envVarMatches = null;
  } else if (!details.sessionId) {
    envVarMatches = null;
  } else {
    envVarMatches = envVar === details.sessionId;
  }

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
  let sessionId: string | undefined;
  try {
    const adapter = getAdapterByName(harness);
    sessionId = adapter?.resolveSessionId({});
  } catch {
    sessionId = undefined;
  }

  const markerEnabled = isSessionPidMarkerEnabled();
  const processNames = deriveProcessNames(harness);
  const ancestor = markerEnabled ? findHarnessAncestorPid(processNames) : undefined;
  const ancestorPid = markerEnabled ? (ancestor?.pid ?? null) : null;
  const ancestorAlive = markerEnabled && ancestorPid !== null ? isProcessAlive(ancestorPid) : null;
  const markerSessionId = markerEnabled ? readSessionMarker(harness) : undefined;
  const markerPath =
    markerEnabled && ancestorPid !== null ? getSessionMarkerPath(harness, ancestorPid) : null;
  const harnessEnvSessionId = getHarnessCallerEnvVars(harness)
    .map((key) => process.env[key])
    .find((value): value is string => Boolean(value));
  const babysitterEnvSessionId = process.env.AGENT_SESSION_ID;

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
  if (!envVarPresent) {
    envVarMatches = null;
  } else if (!finalSessionId) {
    envVarMatches = null;
  } else {
    envVarMatches = envVar === finalSessionId;
  }

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
  if (harness === "claude-code") {
    return resolveClaudeCode();
  }

  return resolveGenericHarness(harness);
}
