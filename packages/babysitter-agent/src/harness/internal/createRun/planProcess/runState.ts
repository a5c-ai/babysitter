import * as path from "node:path";
import { getAdapterByName } from "../../../";
import { createRun } from "@a5c-ai/babysitter-sdk";
import {
  BabysitterRuntimeError,
  ErrorCategory,
  type OrchestrationState,
  type SessionBindResult,
  AgentCoreSessionHandle,
} from "../utils";

type EnsureRunAndMaybeBindArgs = {
  processPath: string;
  prompt: string;
  runsDir: string;
  selectedHarnessName: string;
  maxIterations: number;
  interactive: boolean;
  verbose: boolean;
  json: boolean;
  phaseSession?: AgentCoreSessionHandle | null;
  state?: OrchestrationState;
  requireBoundSession?: boolean;
};

export async function ensureRunAndMaybeBindFromProcessDefinition(
  args: EnsureRunAndMaybeBindArgs,
): Promise<{
  runId: string;
  runDir: string;
  sessionBound?: SessionBindResult;
  createdRun: boolean;
  boundSession: boolean;
}> {
  const processId = path.basename(args.processPath, path.extname(args.processPath));
  let runId = args.state?.runId;
  let runDir = args.state?.runDir;
  let createdRun = false;

  if (!runId || !runDir) {
    const created = await createRun({
      runsDir: args.runsDir,
      harness: args.selectedHarnessName,
      process: {
        processId,
        importPath: path.resolve(args.processPath),
      },
      prompt: args.prompt,
      inputs: args.prompt ? { prompt: args.prompt } : undefined,
      ...(args.interactive === false ? { metadata: { nonInteractive: true } } : {}),
    });
    runId = created.runId;
    runDir = created.runDir;
    createdRun = true;
    if (args.state) {
      args.state.runId = created.runId;
      args.state.runDir = created.runDir;
    }
  }

  const adapter = getAdapterByName(args.selectedHarnessName);
  if (!adapter) {
    return { runId, runDir, sessionBound: args.state?.sessionBound, createdRun, boundSession: false };
  }

  if (args.state?.sessionBound) {
    return {
      runId,
      runDir,
      sessionBound: args.state.sessionBound,
      createdRun,
      boundSession: false,
    };
  }

  let sessionId = adapter.resolveSessionId({});
  if (!sessionId && args.selectedHarnessName === "agent-core") {
    sessionId = args.phaseSession?.sessionId;
  }
  if (!sessionId && args.requireBoundSession) {
    throw new BabysitterRuntimeError(
      "MissingHarnessSessionId",
      `Cannot resolve a session ID for harness ${args.selectedHarnessName}.`,
      { category: ErrorCategory.Configuration },
    );
  }
  if (!sessionId) {
    return { runId, runDir, sessionBound: args.state?.sessionBound, createdRun, boundSession: false };
  }

  const pluginRoot = adapter.resolvePluginRoot({});
  const stateDir = adapter.resolveStateDir({ pluginRoot });
  const sessionBound = await adapter.bindSession({
    sessionId,
    runId,
    runDir,
    pluginRoot,
    stateDir,
    runsDir: args.runsDir,
    maxIterations: args.maxIterations,
    prompt: args.prompt,
    verbose: args.verbose,
    json: args.json,
  });
  if (sessionBound.fatal) {
    throw new BabysitterRuntimeError(
      "SessionBindFatal",
      sessionBound.error ?? "Session binding failed fatally.",
      { category: ErrorCategory.External },
    );
  }
  if (args.state) {
    args.state.sessionBound = sessionBound;
  }

  return {
    runId,
    runDir,
    sessionBound,
    createdRun,
    boundSession: true,
  };
}

export async function createRunAndMaybeBindFromProcessDefinition(args: {
  processPath: string;
  prompt: string;
  runsDir: string;
  selectedHarnessName: string;
  maxIterations: number;
  interactive: boolean;
  verbose: boolean;
  json: boolean;
  phaseSession: AgentCoreSessionHandle | null;
}): Promise<{
  runId: string;
  runDir: string;
  sessionBound?: SessionBindResult;
}> {
  const { runId, runDir, sessionBound } = await ensureRunAndMaybeBindFromProcessDefinition(args);
  return { runId, runDir, sessionBound };
}
