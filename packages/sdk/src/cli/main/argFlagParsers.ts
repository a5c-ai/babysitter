/**
 * Value-bearing flag parsers for CLI argument parsing.
 * Extracted from argFlags.ts for max-lines compliance.
 */

import type { ParsedArgs } from "./types";
import { resolveRunsDir } from "../../config";

type FlagParser = (parsed: ParsedArgs, args: string[], index: number) => number;

function expectFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function parsePositiveInteger(raw: string, flag: string): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return Math.floor(parsed);
}

function parseStatus(raw: string): "ok" | "error" {
  const normalized = raw.toLowerCase();
  if (normalized !== "ok" && normalized !== "error") {
    throw new Error(`--status must be "ok" or "error" (received: ${raw})`);
  }
  return normalized;
}

function parseSourceType(raw: string): "github" | "well-known" {
  if (raw !== "github" && raw !== "well-known") {
    throw new Error(`--source-type must be "github" or "well-known" (received: ${raw})`);
  }
  return raw;
}

function parseIntegerFlag(raw: string): number {
  return parseInt(raw, 10);
}

function readOptionalSessionId(args: string[], index: number): { sessionId?: string; index: number } {
  const next = args[index + 1];
  if (next && !next.startsWith("-")) {
    return { sessionId: next, index: index + 1 };
  }
  return { index };
}

export const FLAG_PARSERS: Record<string, FlagParser> = {
  "--runs-dir": (parsed, args, index) => {
    parsed.runsDir = resolveRunsDir({ override: expectFlagValue(args, index + 1, "--runs-dir") });
    return index + 1;
  },
  "--kind": (parsed, args, index) => {
    parsed.kindFilter = expectFlagValue(args, index + 1, "--kind");
    return index + 1;
  },
  "--limit": (parsed, args, index) => {
    parsed.limit = parsePositiveInteger(expectFlagValue(args, index + 1, "--limit"), "--limit");
    return index + 1;
  },
  "--iteration": (parsed, args, index) => {
    parsed.iteration = parsePositiveInteger(expectFlagValue(args, index + 1, "--iteration"), "--iteration");
    return index + 1;
  },
  "--filter-type": (parsed, args, index) => {
    parsed.filterType = expectFlagValue(args, index + 1, "--filter-type");
    return index + 1;
  },
  "--status": (parsed, args, index) => {
    parsed.taskStatus = parseStatus(expectFlagValue(args, index + 1, "--status"));
    return index + 1;
  },
  "--value": (parsed, args, index) => {
    parsed.valuePath = expectFlagValue(args, index + 1, "--value");
    return index + 1;
  },
  "--value-inline": (parsed, args, index) => {
    parsed.valueInline = expectFlagValue(args, index + 1, "--value-inline");
    return index + 1;
  },
  "--error": (parsed, args, index) => {
    parsed.errorPath = expectFlagValue(args, index + 1, "--error");
    return index + 1;
  },
  "--stdout-ref": (parsed, args, index) => {
    parsed.stdoutRef = expectFlagValue(args, index + 1, "--stdout-ref");
    return index + 1;
  },
  "--stderr-ref": (parsed, args, index) => {
    parsed.stderrRef = expectFlagValue(args, index + 1, "--stderr-ref");
    return index + 1;
  },
  "--stdout-file": (parsed, args, index) => {
    parsed.stdoutFile = expectFlagValue(args, index + 1, "--stdout-file");
    return index + 1;
  },
  "--stderr-file": (parsed, args, index) => {
    parsed.stderrFile = expectFlagValue(args, index + 1, "--stderr-file");
    return index + 1;
  },
  "--started-at": (parsed, args, index) => {
    parsed.startedAt = expectFlagValue(args, index + 1, "--started-at");
    return index + 1;
  },
  "--finished-at": (parsed, args, index) => {
    parsed.finishedAt = expectFlagValue(args, index + 1, "--finished-at");
    return index + 1;
  },
  "--metadata": (parsed, args, index) => {
    parsed.metadataPath = expectFlagValue(args, index + 1, "--metadata");
    return index + 1;
  },
  "--invocation-key": (parsed, args, index) => {
    parsed.invocationKey = expectFlagValue(args, index + 1, "--invocation-key");
    return index + 1;
  },
  "--process-id": (parsed, args, index) => {
    parsed.processId = expectFlagValue(args, index + 1, "--process-id");
    return index + 1;
  },
  "--entry": (parsed, args, index) => {
    parsed.entrySpecifier = expectFlagValue(args, index + 1, "--entry");
    return index + 1;
  },
  "--inputs": (parsed, args, index) => {
    parsed.inputsPath = expectFlagValue(args, index + 1, "--inputs");
    return index + 1;
  },
  "--run-id": (parsed, args, index) => {
    const runId = expectFlagValue(args, index + 1, "--run-id");
    parsed.runIdOverride = runId;
    parsed.runIds = [...(parsed.runIds ?? []), runId];
    return index + 1;
  },
  "--process-revision": (parsed, args, index) => {
    parsed.processRevision = expectFlagValue(args, index + 1, "--process-revision");
    return index + 1;
  },
  "--request": (parsed, args, index) => {
    parsed.requestId = expectFlagValue(args, index + 1, "--request");
    return index + 1;
  },
  "--session-id": (parsed, args, index) => {
    const result = readOptionalSessionId(args, index);
    parsed.sessionId = result.sessionId;
    return result.index;
  },
  "--state-dir": (parsed, args, index) => {
    parsed.stateDir = expectFlagValue(args, index + 1, "--state-dir");
    return index + 1;
  },
  "--max-iterations": (parsed, args, index) => {
    parsed.maxIterations = parsePositiveInteger(expectFlagValue(args, index + 1, "--max-iterations"), "--max-iterations");
    return index + 1;
  },
  "--prompt": (parsed, args, index) => {
    parsed.prompt = expectFlagValue(args, index + 1, "--prompt");
    return index + 1;
  },
  "--workspace": (parsed, args, index) => {
    parsed.workspace = expectFlagValue(args, index + 1, "--workspace");
    return index + 1;
  },
  "--daemon-dir": (parsed, args, index) => {
    parsed.daemonDir = expectFlagValue(args, index + 1, "--daemon-dir");
    return index + 1;
  },
  "--config": (parsed, args, index) => FLAG_PARSERS["--config-path"](parsed, args, index),
  "--config-path": (parsed, args, index) => {
    parsed.configPath = expectFlagValue(args, index + 1, "--config-path");
    return index + 1;
  },
  "--grace-period-ms": (parsed, args, index) => {
    parsed.gracePeriodMs = parseIntegerFlag(expectFlagValue(args, index + 1, "--grace-period-ms"));
    return index + 1;
  },
  "--transport": (parsed, args, index) => {
    parsed.transport = expectFlagValue(args, index + 1, "--transport");
    return index + 1;
  },
  "--port": (parsed, args, index) => {
    parsed.port = parseIntegerFlag(expectFlagValue(args, index + 1, "--port"));
    return index + 1;
  },
  "--host": (parsed, args, index) => {
    parsed.host = expectFlagValue(args, index + 1, "--host");
    return index + 1;
  },
  "--auth-token": (parsed, args, index) => {
    parsed.authToken = expectFlagValue(args, index + 1, "--auth-token");
    return index + 1;
  },
  "--ws-ping-interval": (parsed, args, index) => {
    parsed.wsPingInterval = parseIntegerFlag(expectFlagValue(args, index + 1, "--ws-ping-interval"));
    return index + 1;
  },
  "--ws-grace-period": (parsed, args, index) => {
    parsed.wsGracePeriod = parseIntegerFlag(expectFlagValue(args, index + 1, "--ws-grace-period"));
    return index + 1;
  },
  "--ws-max-mps": (parsed, args, index) => {
    parsed.wsMaxMps = parseIntegerFlag(expectFlagValue(args, index + 1, "--ws-max-mps"));
    return index + 1;
  },
  "--model": (parsed, args, index) => {
    parsed.model = expectFlagValue(args, index + 1, "--model");
    return index + 1;
  },
  "--last-iteration-at": (parsed, args, index) => {
    parsed.lastIterationAt = expectFlagValue(args, index + 1, "--last-iteration-at");
    return index + 1;
  },
  "--iteration-times": (parsed, args, index) => {
    parsed.iterationTimes = expectFlagValue(args, index + 1, "--iteration-times");
    return index + 1;
  },
  "--timeout": (parsed, args, index) => {
    parsed.timeout = parsePositiveInteger(expectFlagValue(args, index + 1, "--timeout"), "--timeout");
    return index + 1;
  },
  "--transcript-path": (parsed, args, index) => {
    parsed.transcriptPath = expectFlagValue(args, index + 1, "--transcript-path");
    return index + 1;
  },
  "--hook-type": (parsed, args, index) => {
    parsed.hookType = expectFlagValue(args, index + 1, "--hook-type");
    return index + 1;
  },
  "--harness": (parsed, args, index) => {
    parsed.harness = expectFlagValue(args, index + 1, "--harness");
    return index + 1;
  },
  "--log-file": (parsed, args, index) => {
    parsed.logFile = expectFlagValue(args, index + 1, "--log-file");
    return index + 1;
  },
  "--cache-ttl": (parsed, args, index) => {
    parsed.cacheTtl = parsePositiveInteger(expectFlagValue(args, index + 1, "--cache-ttl"), "--cache-ttl");
    return index + 1;
  },
  "--source-type": (parsed, args, index) => {
    parsed.sourceType = parseSourceType(expectFlagValue(args, index + 1, "--source-type"));
    return index + 1;
  },
  "--url": (parsed, args, index) => {
    parsed.url = expectFlagValue(args, index + 1, "--url");
    return index + 1;
  },
  "--repo": (parsed, args, index) => {
    parsed.processLibraryRepo = expectFlagValue(args, index + 1, "--repo");
    return index + 1;
  },
  "--ref": (parsed, args, index) => {
    parsed.processLibraryRef = expectFlagValue(args, index + 1, "--ref");
    return index + 1;
  },
  "--process": (parsed, args, index) => FLAG_PARSERS["--process-path"](parsed, args, index),
  "--process-path": (parsed, args, index) => {
    parsed.processPath = expectFlagValue(args, index + 1, "--process-path");
    return index + 1;
  },
  "--input": (parsed, args, index) => {
    parsed.profileInputPath = expectFlagValue(args, index + 1, "--input");
    return index + 1;
  },
  "--dir": (parsed, args, index) => {
    const dir = expectFlagValue(args, index + 1, "--dir");
    parsed.profileDir = dir;
    parsed.processLibraryDir = dir;
    return index + 1;
  },
  "--plugin-name": (parsed, args, index) => {
    parsed.pluginName = expectFlagValue(args, index + 1, "--plugin-name");
    return index + 1;
  },
  "--plugin-version": (parsed, args, index) => {
    parsed.pluginVersion = expectFlagValue(args, index + 1, "--plugin-version");
    return index + 1;
  },
  "--marketplace-name": (parsed, args, index) => {
    parsed.marketplaceName = expectFlagValue(args, index + 1, "--marketplace-name");
    return index + 1;
  },
  "--marketplace-url": (parsed, args, index) => {
    parsed.marketplaceUrl = expectFlagValue(args, index + 1, "--marketplace-url");
    return index + 1;
  },
  "--marketplace-path": (parsed, args, index) => {
    parsed.marketplacePath = expectFlagValue(args, index + 1, "--marketplace-path");
    return index + 1;
  },
  "--marketplace-branch": (parsed, args, index) => {
    parsed.marketplaceBranch = expectFlagValue(args, index + 1, "--marketplace-branch");
    return index + 1;
  },
  "--type": (parsed, args, index) => {
    parsed.logType = expectFlagValue(args, index + 1, "--type");
    return index + 1;
  },
  "--message": (parsed, args, index) => {
    parsed.logMessage = expectFlagValue(args, index + 1, "--message");
    return index + 1;
  },
  "--label": (parsed, args, index) => {
    parsed.logLabel = expectFlagValue(args, index + 1, "--label");
    return index + 1;
  },
  "--level": (parsed, args, index) => {
    parsed.logLevel = expectFlagValue(args, index + 1, "--level");
    return index + 1;
  },
  "--source": (parsed, args, index) => {
    parsed.logSource = expectFlagValue(args, index + 1, "--source");
    return index + 1;
  },
  "--keep-days": (parsed, args, index) => {
    parsed.keepDays = parsePositiveInteger(expectFlagValue(args, index + 1, "--keep-days"), "--keep-days");
    return index + 1;
  },
  "--reason": (parsed, args, index) => {
    parsed.cancelReason = expectFlagValue(args, index + 1, "--reason");
    return index + 1;
  },
  "--action": (parsed, args, index) => {
    parsed.breakpointAction = expectFlagValue(args, index + 1, "--action");
    return index + 1;
  },
  "--note": (parsed, args, index) => {
    parsed.breakpointNote = expectFlagValue(args, index + 1, "--note");
    return index + 1;
  },
  "--tags": (parsed, args, index) => {
    parsed.breakpointTags = expectFlagValue(args, index + 1, "--tags");
    return index + 1;
  },
  "--expert": (parsed, args, index) => {
    parsed.breakpointExpert = expectFlagValue(args, index + 1, "--expert");
    return index + 1;
  },
  "--breakpoint-id": (parsed, args, index) => {
    parsed.breakpointIdArg = expectFlagValue(args, index + 1, "--breakpoint-id");
    return index + 1;
  },
  "--verbosity": (parsed, args, index) => {
    parsed.verbosity = expectFlagValue(args, index + 1, "--verbosity");
    return index + 1;
  },
};
