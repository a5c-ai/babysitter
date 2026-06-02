import * as path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { WorkspaceService } from "@a5c-ai/agent-mux-comm";
import { getAdapterByName } from "../../../";
import { createRun, getSessionMarkerPath, readSessionMarker } from "@a5c-ai/babysitter-sdk";
import { updateSessionContext } from "../../../../session/context";
import {
  BabysitterRuntimeError,
  ErrorCategory,
  type OrchestrationState,
  type SessionBindResult,
  AgentCoreSessionHandle,
} from "../utils";
import { normalizeBuiltInHarnessName } from "../../../builtInHarness";

type EnsureRunAndMaybeBindArgs = {
  processPath: string;
  prompt: string;
  workspace?: string;
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

function resolveWorktreeRepoAlias(context: Awaited<ReturnType<WorkspaceService["resolveSessionContext"]>>): string | undefined {
  const repoPath = context?.repo?.sourcePath ?? context?.repo?.targetPath;
  if (repoPath) {
    const basename = path.basename(repoPath);
    if (basename) {
      return basename;
    }
  }
  return context?.repo?.alias;
}

async function resolveSessionWorktreeContext(workspace: string) {
  const currentPath = path.resolve(workspace);
  const fallback = {
    workspacePath: currentPath,
    currentPath,
  };

  try {
    const context = await new WorkspaceService().resolveSessionContext({ cwd: currentPath });
    if (!context) {
      return fallback;
    }
    return {
      workspacePath: context.repo?.targetPath ?? context.workspaceDefaultCwd ?? context.workspaceRootPath,
      currentPath: context.currentPath ?? currentPath,
      mode: context.repo?.mode ?? context.workspaceMode,
      repoAlias: resolveWorktreeRepoAlias(context),
      branch: context.repo?.branch,
    };
  } catch {
    return fallback;
  }
}

function resolveCurrentSessionContextId(harness: string, boundSessionId: string): string {
  const harnessPid = Number.parseInt(process.env.BABYSITTER_HARNESS_PID ?? "", 10);
  if (Number.isFinite(harnessPid) && harnessPid > 0) {
    const markerPath = getSessionMarkerPath(harness, harnessPid);
    if (existsSync(markerPath)) {
      const markerSessionId = readFileSync(markerPath, "utf8").trim();
      if (markerSessionId) {
        return markerSessionId;
      }
    }
  }

  return readSessionMarker(harness) ?? boundSessionId;
}

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
  const selectedHarnessName = normalizeBuiltInHarnessName(args.selectedHarnessName);

  if (!runId || !runDir) {
    const created = await createRun({
      runsDir: args.runsDir,
      harness: selectedHarnessName,
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

  const adapter = getAdapterByName(selectedHarnessName);
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
  if (!sessionId && selectedHarnessName === "agent-core") {
    sessionId = args.phaseSession?.sessionId;
  }
  if (!sessionId && args.requireBoundSession) {
    throw new BabysitterRuntimeError(
      "MissingHarnessSessionId",
      `Cannot resolve a session ID for harness ${selectedHarnessName}.`,
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
  if (stateDir && args.workspace) {
    const worktree = await resolveSessionWorktreeContext(args.workspace);
    const sessionContextId = resolveCurrentSessionContextId(selectedHarnessName, sessionId);
    await updateSessionContext(stateDir, sessionContextId, {
      worktree,
    });
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
  workspace?: string;
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
