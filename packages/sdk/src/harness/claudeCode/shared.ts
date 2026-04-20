import * as path from "node:path";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { getGlobalStateDir } from "../../config";
import {
  findHarnessAncestorPid,
  getSessionMarkerPath,
  hasSessionMarkerCandidate,
  isSessionPidMarkerEnabled,
  readSessionMarker,
} from "../../utils/sessionMarker";
import { isProcessAlive } from "../../utils/processLiveness";

import { createHookLogger } from "../hooks/utils";

// Re-export shared utilities so existing internal consumers don't break.
export {
  type HookLogger,
  createHookLogger,
  readStdin,
  parseHookInput,
  safeStr,
  countPendingByKind,
  isOnlyBreakpoints,
  appendStopHookEvent,
  cleanupSession,
} from "../hooks/utils";

export interface ClaudeCodeStopHookInput {
  session_id?: string;
  transcript_path?: string;
  last_assistant_message?: string;
}

export interface ClaudeCodeSessionStartHookInput {
  session_id?: string;
}

function findClaudeAncestorPid(): number | undefined {
  const info = findHarnessAncestorPid(["claude"]);
  return info?.pid;
}

export function getCurrentSessionIdFilePath(): string | undefined {
  if (!isSessionPidMarkerEnabled()) {
    return undefined;
  }
  const ancestorPid = findClaudeAncestorPid();
  if (!ancestorPid) return undefined;
  return getSessionMarkerPath("claude-code", ancestorPid);
}

export function resolveCurrentSessionIdFromEnv(): string | undefined {
  return resolveSessionIdDetailed().sessionId;
}

export interface SessionResolutionDetails {
  sessionId?: string;
  resolvedFrom: "pid-marker" | "env-file" | "env-var" | "explicit" | "none";
  ancestorPid: number | null;
  ancestorAlive: boolean | null;
}

export function resolveSessionIdDetailed(explicit?: string): SessionResolutionDetails {
  if (explicit) {
    return {
      sessionId: explicit,
      resolvedFrom: "explicit",
      ancestorPid: null,
      ancestorAlive: null,
    };
  }

  const trustEnv =
    process.env.AGENT_TRUST_ENV_SESSION === "1" ||
    process.env.BABYSITTER_TRUST_ENV_SESSION === "1";
  const log = createHookLogger("babysitter-session-resolution");
  let ancestorDetails: Pick<SessionResolutionDetails, "ancestorPid" | "ancestorAlive"> | undefined;

  const getAncestorDetails = (): Pick<
    SessionResolutionDetails,
    "ancestorPid" | "ancestorAlive"
  > => {
    if (ancestorDetails) {
      return ancestorDetails;
    }

    if (!hasSessionMarkerCandidate("claude-code")) {
      ancestorDetails = {
        ancestorPid: null,
        ancestorAlive: null,
      };
      return ancestorDetails;
    }

    const ancestor = findHarnessAncestorPid(["claude"]);
    const ancestorPid = ancestor?.pid ?? null;
    ancestorDetails = {
      ancestorPid,
      ancestorAlive: ancestorPid !== null ? isProcessAlive(ancestorPid) : null,
    };
    return ancestorDetails;
  };

  const agentSessionId = process.env.AGENT_SESSION_ID;

  if (trustEnv && agentSessionId) {
    return {
      sessionId: agentSessionId,
      resolvedFrom: "env-var",
      ...getAncestorDetails(),
    };
  }

  if (!trustEnv) {
    const fromMarker = readSessionMarker("claude-code");
    if (fromMarker) {
      return {
        sessionId: fromMarker,
        resolvedFrom: "pid-marker",
        ...getAncestorDetails(),
      };
    }
  }

  const envFile = process.env.CLAUDE_ENV_FILE;
  if (envFile) {
    try {
      const content = readFileSync(envFile, "utf-8");
      const agentMatches = [...content.matchAll(/export AGENT_SESSION_ID="([^"]+)"/g)];
      const agentLast = agentMatches.at(-1)?.[1];
      if (agentLast) {
        return {
          sessionId: agentLast,
          resolvedFrom: "env-file",
          ...getAncestorDetails(),
        };
      }
    } catch {
      // non-fatal
    }
  }

  if (agentSessionId) {
    const stateFile = path.join(getGlobalStateDir(), `${agentSessionId}.md`);
    if (!existsSync(stateFile)) {
      log.warn(
        `AGENT_SESSION_ID=${agentSessionId} is set but no matching state file at ${stateFile} — likely stale from a prior Claude Code session. Run 'babysitter session:cleanup' or 'unset AGENT_SESSION_ID'.`,
      );
    }
    return {
      sessionId: agentSessionId,
      resolvedFrom: "env-var",
      ...getAncestorDetails(),
    };
  }

  return {
    sessionId: undefined,
    resolvedFrom: "none",
    ...getAncestorDetails(),
  };
}

export const __resolveCurrentSessionIdFromEnvForTests = resolveCurrentSessionIdFromEnv;

export function setBabysitterSessionIdInEnvFile(
  envFile: string,
  sessionId: string,
): void {
  appendFileSync(envFile, `export AGENT_SESSION_ID="${sessionId}"\n`);
}
