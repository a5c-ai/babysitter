import { AsyncLocalStorage } from "node:async_hooks";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { initI18n, t } from "./i18n.js";
import {
  type DriverProgress,
  type DriverResult,
  type ProjectionTodoPhase,
  MAX_CAPTURE_BYTES,
  OmpDeterministicDriver,
  reconstructBabysitterProjection,
  sanitizeDiagnosticText,
} from "./driver.js";

const PLUGIN_ROOT = path.resolve(__dirname, "..");

const PROJECTION_NAMESPACE = "babysitter";
export const TODO_PROJECTION_MIN_OMP_VERSION = "16.5.2";
const PROJECTION_PROGRESS_INTERVAL_MS = 250;

export type TodoProjectionGate = "available" | "missing_capability" | "version_mismatch";

export function getTodoProjectionGate(
  api: ProjectionExtensionAPI,
  hostVersion = api.hostVersion,
): TodoProjectionGate {
  if (typeof api.setTodoProjection !== "function") return "missing_capability";
  if (typeof hostVersion !== "string") return "version_mismatch";
  const parse = (value: string): [number, number, number] | null => {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value);
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
  };
  const actual = parse(hostVersion);
  const minimum = parse(TODO_PROJECTION_MIN_OMP_VERSION)!;
  if (!actual) return "version_mismatch";
  for (let index = 0; index < minimum.length; index += 1) {
    if (actual[index] > minimum[index]) return "available";
    if (actual[index] < minimum[index]) return "version_mismatch";
  }
  return "available";
}


type ProjectionExtensionAPI = ExtensionAPI & {
  setTodoProjection?: (namespace: string, phases: readonly ProjectionTodoPhase[] | undefined) => void;
  /** Optional host-declared version used to reject incompatible backports. */
  hostVersion?: string;
};

interface DriverToolDetails {
  state: "running" | DriverResult["state"];
  progress?: DriverProgress;
  result?: DriverResult;
}

interface SessionStatePayload {
  found?: boolean;
  state?: {
    runId?: string;
    runDir?: string;
  };
}

interface SessionStateCommandResult {
  code: number;
  stdout: string;
}

function progressText(progress: DriverProgress): string {
  const effect = progress.effectId ? ` ${progress.effectId}` : "";
  const counters = progress.stdoutBytes !== undefined || progress.stderrBytes !== undefined
    ? ` · stdout ${progress.stdoutBytes ?? 0} B${progress.stdoutTruncated ? "+" : ""} · stderr ${progress.stderrBytes ?? 0} B${progress.stderrTruncated ? "+" : ""}`
    : "";
  return `Babysitter${effect} · ${progress.stage.replaceAll("_", " ")} · ${progress.message}${counters}`;
}

class ReadOnlyProjectionText {
  constructor(private readonly text: string) {}

  render(_width: number): string[] {
    return this.text.split("\n");
  }

  invalidate(): void {}
}

const COMMANDS = [
  "assimilate",
  "call",
  "cleanup",
  "contrib",
  "doctor",
  "forever",
  "help",
  "observe",
  "plan",
  "plugins",
  "project-install",
  "resume",
  "retrospect",
  "user-install",
  "yolo",
] as const;

function toSkillPrompt(name: string, args: string): string {
  return `/skill:${name}${args ? ` ${args}` : ""}`;
}




export interface StdinExecutionResult {
  code: number;
  stdout: string;
  stderr: string;
  killed: boolean;
}

export interface BabysitterSpawnSpec {
  command: string;
  args: string[];
}

export async function resolveBabysitterSpawn(
  args: string[],
  platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  nodeExecutable = process.execPath,
): Promise<BabysitterSpawnSpec> {
  if (platform !== "win32") return { command: "babysitter", args };

  const pathValue = env.Path || env.PATH || "";
  const pathDirs = pathValue
    .split(path.delimiter)
    .map((entry) => entry.replace(/^"(.*)"$/, "$1"))
    .filter(Boolean);
  const exists = async (candidate: string): Promise<boolean> => {
    try {
      await fs.access(candidate);
      return true;
    } catch {
      return false;
    }
  };
  for (const pathDir of pathDirs) {
    for (const extension of [".exe", ".com"]) {
      const candidate = path.join(pathDir, `babysitter${extension}`);
      if (await exists(candidate)) return { command: candidate, args };
    }
    const hasNpmShim = await exists(path.join(pathDir, "babysitter.cmd"))
      || await exists(path.join(pathDir, "babysitter.bat"));
    if (!hasNpmShim) continue;
    const cliCandidates = [
      path.resolve(pathDir, "..", "@a5c-ai", "babysitter", "bin", "babysitter.js"),
      path.join(pathDir, "node_modules", "@a5c-ai", "babysitter", "bin", "babysitter.js"),
    ];
    for (const cliPath of cliCandidates) {
      if (await exists(cliPath)) return { command: nodeExecutable, args: [cliPath, ...args] };
    }
  }
  throw new Error("Unable to resolve an argument-safe Babysitter executable from PATH");
}

interface ProcessTerminationResult {
  killed: boolean;
  diagnostic?: string;
}

interface PosixProcessMetadata {
  parentPid: number;
  processGroupId: number;
  state: string;
  startedAt: string;
}

const PROCESS_TREE_ROUNDS = 3;
const PROCESS_TREE_SETTLE_MS = 10;
const PROCESS_TABLE_TIMEOUT_MS = 300;
const PROCESS_TABLE_MAX_BYTES = 4 * 1024 * 1024;
const PROCESS_TREE_MAX_NODES = 32_768;

function isSamePosixProcess(
  current: PosixProcessMetadata | undefined,
  expected: PosixProcessMetadata,
): boolean {
  return current?.parentPid === expected.parentPid
    && current.processGroupId === expected.processGroupId
    && current.startedAt === expected.startedAt;
}

function isZombieProcess(metadata: PosixProcessMetadata): boolean {
  return metadata.state.startsWith("Z");
}

function signalProcess(pid: number, signal: NodeJS.Signals): string | undefined {
  try {
    process.kill(pid, signal);
    return undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ESRCH") return undefined;
    return error instanceof Error ? error.message : String(error);
  }
}

async function readPosixProcessTable(): Promise<Map<number, PosixProcessMetadata>> {
  return await new Promise<Map<number, PosixProcessMetadata>>((resolve, reject) => {
    const ps = spawn("ps", ["-axo", "pid=,ppid=,pgid=,state=,lstart="], {
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    });
    const chunks: Buffer[] = [];
    let bytes = 0;
    let settled = false;
    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      ps.stdout.removeAllListeners();
      ps.removeAllListeners();
      if (error) {
        try { ps.kill("SIGKILL"); } catch { /* Process already exited. */ }
        reject(error);
        return;
      }
      try {
        const table = new Map<number, PosixProcessMetadata>();
        for (const line of Buffer.concat(chunks).toString("utf8").split(/\r?\n/)) {
          if (line.trim().length === 0) continue;
          const match = /^\s*([1-9]\d*)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+?)\s*$/.exec(line);
          if (!match) throw new Error("ps returned malformed process metadata");
          const pid = Number(match[1]);
          const parentPid = Number(match[2]);
          const processGroupId = Number(match[3]);
          const state = match[4];
          const startedAt = match[5];
          if (
            !Number.isSafeInteger(pid)
            || !Number.isSafeInteger(parentPid)
            || !Number.isSafeInteger(processGroupId)
            || table.has(pid)
          ) {
            throw new Error("ps returned invalid or duplicate process metadata");
          }
          table.set(pid, { parentPid, processGroupId, state, startedAt });
          if (table.size > PROCESS_TREE_MAX_NODES) {
            throw new Error("process table exceeded the bounded node limit");
          }
        }
        resolve(table);
      } catch (parseError) {
        reject(parseError);
      }
    };
    const timeout = setTimeout(
      () => finish(new Error(`ps process discovery exceeded ${PROCESS_TABLE_TIMEOUT_MS}ms`)),
      PROCESS_TABLE_TIMEOUT_MS,
    );
    timeout.unref();
    ps.stdout.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > PROCESS_TABLE_MAX_BYTES) {
        finish(new Error("ps process metadata exceeded the bounded capture limit"));
        return;
      }
      chunks.push(chunk);
    });
    ps.once("error", (error) => finish(error));
    ps.once("close", (code) => {
      if (code !== 0) finish(new Error(`ps process discovery exited with code ${code ?? "unknown"}`));
      else finish();
    });
  });
}

function rootedDescendants(
  table: Map<number, PosixProcessMetadata>,
  rootPid: number,
): Array<{ pid: number; depth: number }> {
  if (!table.has(rootPid)) return [];
  const children = new Map<number, number[]>();
  for (const [pid, metadata] of table) {
    const siblings = children.get(metadata.parentPid);
    if (siblings) siblings.push(pid);
    else children.set(metadata.parentPid, [pid]);
  }
  const descendants: Array<{ pid: number; depth: number }> = [];
  const queue = [{ pid: rootPid, depth: 0 }];
  for (let index = 0; index < queue.length; index += 1) {
    if (queue.length > PROCESS_TREE_MAX_NODES) throw new Error("process tree exceeded the bounded node limit");
    const current = queue[index];
    for (const pid of children.get(current.pid) ?? []) {
      const descendant = { pid, depth: current.depth + 1 };
      descendants.push(descendant);
      queue.push(descendant);
    }
  }
  return descendants;
}

async function terminateWindowsProcessTree(child: ChildProcessWithoutNullStreams): Promise<ProcessTerminationResult> {
  const pid = child.pid;
  if (!pid) return { killed: false, diagnostic: "spawned process has no PID" };
  const fallback = (): ProcessTerminationResult => {
    try { child.kill("SIGKILL"); } catch { /* Process already exited. */ }
    return { killed: true };
  };
  try {
    return await new Promise<ProcessTerminationResult>((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      let settled = false;
      const finish = (result: ProcessTerminationResult): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        killer.removeAllListeners();
        killer.unref();
        resolve(result);
      };
      const timeout = setTimeout(() => {
        try { killer.kill("SIGKILL"); } catch { /* Killer already exited. */ }
        finish(fallback());
      }, PROCESS_TABLE_TIMEOUT_MS);
      timeout.unref();
      killer.once("error", () => finish(fallback()));
      killer.once("close", (code) => finish(code === 0 ? { killed: true } : fallback()));
    });
  } catch {
    return fallback();
  }
}

async function terminatePosixProcessTree(child: ChildProcessWithoutNullStreams): Promise<ProcessTerminationResult> {
  const rootPid = child.pid;
  if (!rootPid) return { killed: false, diagnostic: "spawned process has no PID" };
  const rootParentPid = process.pid;
  const failures: string[] = [];
  const knownProcesses = new Map<number, PosixProcessMetadata>();
  let rootIdentity: PosixProcessMetadata | undefined;
  let initialDiscoveryDiagnostic: string | undefined;
  let groupStopAttempted = false;
  let discoveryEstablished = false;

  try {
    const metadata = (await readPosixProcessTable()).get(rootPid);
    if (
      metadata?.parentPid === rootParentPid
      && metadata.processGroupId === rootPid
      && !isZombieProcess(metadata)
    ) {
      rootIdentity = metadata;
      knownProcesses.set(rootPid, metadata);
    } else {
      initialDiscoveryDiagnostic = "direct-child identity could not be revalidated before termination";
    }
  } catch (error) {
    initialDiscoveryDiagnostic =
      `initial process discovery failed: ${error instanceof Error ? error.message : String(error)}`;
  }
  if (rootIdentity) {
    groupStopAttempted = true;
    const groupStopFailure = signalProcess(-rootPid, "SIGSTOP");
    if (groupStopFailure) failures.push(`process-group stop failed: ${groupStopFailure}`);
  }

  for (let round = 0; round < PROCESS_TREE_ROUNDS; round += 1) {
    try {
      const table = await readPosixProcessTable();
      const currentRoot = table.get(rootPid);
      if (!rootIdentity) {
        if (
          currentRoot?.parentPid !== rootParentPid
          || currentRoot.processGroupId !== rootPid
          || isZombieProcess(currentRoot)
        ) {
          failures.push(initialDiscoveryDiagnostic ?? "direct-child identity could not be revalidated before termination");
          break;
        }
        rootIdentity = currentRoot;
        knownProcesses.set(rootPid, currentRoot);
      } else if (!isSamePosixProcess(currentRoot, rootIdentity) || !currentRoot || isZombieProcess(currentRoot)) {
        failures.push("direct-child identity could not be revalidated after process-group stop");
        break;
      }
      if (!groupStopAttempted) {
        groupStopAttempted = true;
        const groupStopFailure = signalProcess(-rootPid, "SIGSTOP");
        if (groupStopFailure) failures.push(`process-group stop failed: ${groupStopFailure}`);
        continue;
      }
      discoveryEstablished = true;
      const descendants = rootedDescendants(table, rootPid);
      for (const { pid } of descendants) {
        const metadata = table.get(pid);
        if (metadata) knownProcesses.set(pid, metadata);
      }
      for (const { pid } of descendants.sort((left, right) => left.depth - right.depth)) {
        const metadata = table.get(pid);
        if (!metadata || isZombieProcess(metadata)) continue;
        const error = signalProcess(pid, "SIGSTOP");
        if (error) failures.push(`failed to stop descendant ${pid}: ${error}`);
      }
      await new Promise<void>((resolve) => setTimeout(resolve, PROCESS_TREE_SETTLE_MS));
      const revalidatedTable = await readPosixProcessTable();
      const revalidatedRoot = revalidatedTable.get(rootPid);
      if (!isSamePosixProcess(revalidatedRoot, rootIdentity) || !revalidatedRoot || isZombieProcess(revalidatedRoot)) {
        failures.push("direct-child identity could not be revalidated before descendant kill");
        break;
      }
      const killableDescendants = rootedDescendants(revalidatedTable, rootPid);
      for (const { pid } of killableDescendants) {
        const metadata = revalidatedTable.get(pid);
        if (metadata) knownProcesses.set(pid, metadata);
      }
      for (const { pid } of killableDescendants.sort((left, right) => left.depth - right.depth)) {
        const metadata = revalidatedTable.get(pid);
        if (!metadata || isZombieProcess(metadata)) continue;
        const error = signalProcess(pid, "SIGSTOP");
        if (error) failures.push(`failed to re-stop descendant ${pid}: ${error}`);
      }
      for (const { pid } of killableDescendants.sort((left, right) => right.depth - left.depth)) {
        const metadata = revalidatedTable.get(pid);
        if (!metadata || isZombieProcess(metadata)) continue;
        const error = signalProcess(pid, "SIGKILL");
        if (error) failures.push(`failed to kill descendant ${pid}: ${error}`);
      }
    } catch (error) {
      failures.push(`process discovery failed: ${error instanceof Error ? error.message : String(error)}`);
      break;
    }
  }

  try {
    const finalRoot = (await readPosixProcessTable()).get(rootPid);
    if (rootIdentity && isSamePosixProcess(finalRoot, rootIdentity) && finalRoot && !isZombieProcess(finalRoot)) {
      const groupKillFailure = signalProcess(-rootPid, "SIGKILL");
      if (groupKillFailure) failures.push(`process-group kill failed: ${groupKillFailure}`);
      const rootKillFailure = signalProcess(rootPid, "SIGKILL");
      if (rootKillFailure) failures.push(`direct-child kill failed: ${rootKillFailure}`);
    } else if (!rootIdentity) {
      failures.push(initialDiscoveryDiagnostic ?? "direct-child identity could not be revalidated before final kill");
    }
  } catch (error) {
    failures.push(`final process discovery failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  for (let round = 0; round < PROCESS_TREE_ROUNDS; round += 1) {
    await new Promise<void>((resolve) => setTimeout(resolve, PROCESS_TREE_SETTLE_MS));
    try {
      const table = await readPosixProcessTable();
      const remaining = [...knownProcesses].filter(([pid, expected]) => {
        const metadata = table.get(pid);
        return isSamePosixProcess(metadata, expected) && metadata !== undefined && !isZombieProcess(metadata);
      }).map(([pid]) => pid);
      if (remaining.length === 0) {
        return discoveryEstablished && failures.length === 0
          ? { killed: true }
          : { killed: false, diagnostic: failures.join("; ") || "process-tree discovery could not be established" };
      }
      if (round === PROCESS_TREE_ROUNDS - 1) {
        failures.push(`termination could not confirm exit of PIDs ${remaining.join(", ")}`);
      }
    } catch (error) {
      failures.push(`termination confirmation failed: ${error instanceof Error ? error.message : String(error)}`);
      break;
    }
  }
  return { killed: false, diagnostic: failures.join("; ") || "process-tree termination could not be confirmed" };
}

async function terminateStdinProcessTree(child: ChildProcessWithoutNullStreams): Promise<ProcessTerminationResult> {
  return process.platform === "win32"
    ? await terminateWindowsProcessTree(child)
    : await terminatePosixProcessTree(child);
}

export async function execBabysitterWithStdin(
  args: string[],
  cwd: string,
  stdin: Buffer,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<StdinExecutionResult> {
  if (signal?.aborted) {
    return { code: 1, stdout: "", stderr: "Babysitter stdin execution aborted", killed: false };
  }
  let spec: BabysitterSpawnSpec;
  try {
    spec = await resolveBabysitterSpawn(args);
  } catch (error) {
    return {
      code: 1,
      stdout: "",
      stderr: `Babysitter stdin spawn failed: ${error instanceof Error ? error.message : String(error)}`,
      killed: false,
    };
  }
  let child: ChildProcessWithoutNullStreams;
  try {
    child = spawn(spec.command, spec.args, {
      cwd,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      detached: process.platform !== "win32",
    });
  } catch (error) {
    return {
      code: 1,
      stdout: "",
      stderr: `Babysitter stdin spawn failed: ${error instanceof Error ? error.message : String(error)}`,
      killed: false,
    };
  }

  return await new Promise<StdinExecutionResult>((resolve) => {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled = false;
    let terminating = false;
    let closedCode: number | null | undefined;
    let stdinSettled = false;
    let timeout: NodeJS.Timeout;

    const finish = (code: number, killed: boolean, diagnostic?: string): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
      child.stdout.off("data", onStdout);
      child.stderr.off("data", onStderr);
      child.stdin.off("error", onStdinError);
      child.off("error", onSpawnError);
      child.off("close", onClose);
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const capturedStderr = Buffer.concat(stderrChunks).toString("utf8");
      let stderr = capturedStderr;
      if (diagnostic) {
        const separator = capturedStderr.length > 0 ? "\n" : "";
        const diagnosticBytes = Buffer.from(`${separator}${diagnostic}`, "utf8");
        const retained = Buffer.concat([
          Buffer.from(capturedStderr, "utf8").subarray(0, Math.max(0, MAX_CAPTURE_BYTES - diagnosticBytes.length)),
          diagnosticBytes.subarray(0, MAX_CAPTURE_BYTES),
        ]);
        stderr = retained.subarray(0, MAX_CAPTURE_BYTES).toString("utf8");
      }
      resolve({ code, stdout, stderr, killed });
    };
    const failClosed = (diagnostic: string): void => {
      if (settled || terminating) return;
      terminating = true;
      void terminateStdinProcessTree(child)
        .catch((error): ProcessTerminationResult => ({
          killed: false,
          diagnostic: error instanceof Error ? error.message : String(error),
        }))
        .then((termination) => {
          child.stdin.destroy();
          child.stdout.destroy();
          child.stderr.destroy();
          const terminationDiagnostic = termination.diagnostic
            ? `${diagnostic}; process-tree termination could not be confirmed: ${termination.diagnostic}`
            : diagnostic;
          finish(1, termination.killed, terminationDiagnostic);
        });
    };
    const capture = (target: "stdout" | "stderr", chunk: Buffer): void => {
      if (settled || terminating) return;
      const chunks = target === "stdout" ? stdoutChunks : stderrChunks;
      const used = target === "stdout" ? stdoutBytes : stderrBytes;
      const remaining = MAX_CAPTURE_BYTES - used;
      if (remaining > 0) chunks.push(chunk.subarray(0, remaining));
      if (target === "stdout") stdoutBytes += Math.min(chunk.length, remaining);
      else stderrBytes += Math.min(chunk.length, remaining);
      if (chunk.length > remaining) {
        failClosed(`Babysitter stdin ${target} exceeded the ${MAX_CAPTURE_BYTES}-byte capture limit`);
      }
    };
    const onStdout = (chunk: Buffer): void => capture("stdout", chunk);
    const onStderr = (chunk: Buffer): void => capture("stderr", chunk);
    const onAbort = (): void => failClosed("Babysitter stdin execution aborted");
    const onStdinError = (error: Error): void => {
      failClosed(`Babysitter stdin write failed: ${error.message}`);
    };
    const onSpawnError = (error: Error): void => {
      if (!terminating) finish(1, false, `Babysitter stdin spawn failed: ${error.message}`);
    };
    const onClose = (code: number | null): void => {
      closedCode = code;
      if (!terminating && stdinSettled) finish(code ?? 1, false);
    };

    child.stdout.on("data", onStdout);
    child.stderr.on("data", onStderr);
    child.stdin.on("error", onStdinError);
    child.once("error", onSpawnError);
    child.once("close", onClose);
    signal?.addEventListener("abort", onAbort, { once: true });
    timeout = setTimeout(
      () => failClosed(`Babysitter stdin execution timed out after ${timeoutMs}ms`),
      timeoutMs,
    );
    timeout.unref();
    child.stdin.end(stdin, () => {
      stdinSettled = true;
      if (!terminating && closedCode !== undefined) finish(closedCode ?? 1, false);
    });
    if (signal?.aborted) onAbort();
  });
}

export default function activate(
  pi: ExtensionAPI,
  executeWithStdin: typeof execBabysitterWithStdin = execBabysitterWithStdin,
): void {
  initI18n(pi);
  const projectionApi = pi as ProjectionExtensionAPI;
  let activeContext: ExtensionContext | undefined;
  let ownedSessionId: string | undefined;
  let projectionGeneration = 0;
  let projectionOperationSequence = 0;
  let projectionWarningReported = false;
  let latestProgress: DriverProgress | undefined;
  let projectionOwner: { runDir: string; generation: number; operationId: string } | undefined;
  let pendingProjectionProgress: DriverProgress | undefined;
  let projectionFlushTimer: NodeJS.Timeout | undefined;
  let projectionFlushQueued = false;
  let projectionFlushPromise: Promise<void> | undefined;
  let projectionRefreshFailedOperationId: string | undefined;
  let driveQueue = Promise.resolve();
  const driveContext = new AsyncLocalStorage<ExtensionContext | undefined>();

  const enqueueDrive = async <T>(operation: () => Promise<T>): Promise<T> => {
    const predecessor = driveQueue;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    driveQueue = predecessor.catch(() => undefined).then(() => gate);
    await predecessor.catch(() => undefined);
    try {
      return await operation();
    } finally {
      release();
    }
  };
  let lastProjectionFlushAt = 0;

  const reportProjectionFailure = (
    error: unknown,
    stage: "clear" | "session_restore" | "operation_flush",
  ): void => {
    try {
      pi.logger.warn("Babysitter todo projection refresh was skipped", {
        category: "todo_projection_refresh_failed",
        stage,
        diagnostic: sanitizeDiagnosticText(error instanceof Error ? error.message : String(error)),
        fatal: false,
      });
    } catch {
      // Display diagnostics must not replace host lifecycle or tool outcomes.
    }
  };

  const clearNativeProjection = (stage: "clear" | "session_restore" | "operation_flush"): void => {
    if (getTodoProjectionGate(projectionApi) !== "available") return;
    try {
      projectionApi.setTodoProjection!(PROJECTION_NAMESPACE, undefined);
    } catch (error) {
      reportProjectionFailure(error, stage);
    }
  };

  const clearProjection = (): void => {
    projectionOwner = undefined;
    latestProgress = undefined;
    pendingProjectionProgress = undefined;
    projectionFlushQueued = false;
    clearTimeout(projectionFlushTimer);
    projectionFlushTimer = undefined;
    projectionRefreshFailedOperationId = undefined;
    projectionGeneration += 1;
    clearNativeProjection("clear");
    const ui = activeContext?.ui;
    try {
      ui?.setStatus(PROJECTION_NAMESPACE, undefined);
      ui?.setWidget(PROJECTION_NAMESPACE, undefined);
    } catch (error) {
      reportProjectionFailure(error, "clear");
    }
  };

  const refreshProjection = async (
    runDir: string,
    generation: number,
    operationId: string,
    stage: "session_restore" | "operation_flush",
  ): Promise<boolean> => {
    const stillOwnsProjection = (): boolean => {
      const owner = projectionOwner;
      return generation === projectionGeneration &&
        owner?.generation === generation &&
        owner.operationId === operationId &&
        owner.runDir === path.resolve(runDir);
    };
    try {
      const gate = getTodoProjectionGate(projectionApi);
      const phases = await reconstructBabysitterProjection(runDir);
      if (!stillOwnsProjection()) return false;
      if (gate !== "available") {
        const fallback = latestProgress && latestProgress.runDir === runDir
          ? progressText(latestProgress)
          : `Babysitter ${path.basename(runDir)} · ${phases[0]?.tasks.length ?? 0} effects`;
        activeContext?.ui.setStatus(PROJECTION_NAMESPACE, fallback);
        activeContext?.ui.setWidget(PROJECTION_NAMESPACE, [fallback]);
        if (!projectionWarningReported) {
          projectionWarningReported = true;
          pi.logger.warn("Babysitter todo projection is unavailable in this OMP version", {
            category: gate === "missing_capability" ? "todo_projection_unavailable" : "todo_projection_version_mismatch",
            hostVersion: projectionApi.hostVersion ?? "undeclared",
            minimumVersion: TODO_PROJECTION_MIN_OMP_VERSION,
            fatal: false,
          });
        }
        return true;
      }
      projectionApi.setTodoProjection?.(PROJECTION_NAMESPACE, phases);
      return true;
    } catch (error) {
      if (stillOwnsProjection()) {
        clearNativeProjection(stage);
        reportProjectionFailure(error, stage);
      }
      return false;
    }
  };

  const performProjectionProgressFlush = async (operationId: string | undefined): Promise<void> => {
    const progress = pendingProjectionProgress;
    if (!progress || !operationId || progress.operationId !== operationId) return;
    pendingProjectionProgress = undefined;
    const owner = projectionOwner;
    if (
      !owner ||
      owner.generation !== projectionGeneration ||
      owner.operationId !== operationId ||
      owner.runDir !== path.resolve(progress.runDir)
    ) return;
    latestProgress = progress;
    const text = progressText(progress);
    try {
      activeContext?.ui.setStatus(PROJECTION_NAMESPACE, text);
      activeContext?.ui.setWidget(PROJECTION_NAMESPACE, [text]);
    } catch (error) {
      reportProjectionFailure(error, "operation_flush");
    }
    if (projectionRefreshFailedOperationId === operationId) return;
    const refreshed = await refreshProjection(progress.runDir, owner.generation, owner.operationId, "operation_flush");
    if (!refreshed) projectionRefreshFailedOperationId = operationId;
  };

  const startProjectionProgressFlush = (operationId: string): Promise<void> => {
    if (projectionFlushPromise) return projectionFlushPromise;
    lastProjectionFlushAt = Date.now();
    const running = performProjectionProgressFlush(operationId).finally(() => {
      if (projectionFlushPromise === running) projectionFlushPromise = undefined;
      const pendingOperationId = pendingProjectionProgress?.operationId;
      if (pendingOperationId) scheduleProjectionProgressFlush(pendingOperationId);
    });
    projectionFlushPromise = running;
    return running;
  };

  const scheduleProjectionProgressFlush = (operationId: string): void => {
    if (projectionFlushPromise || projectionFlushQueued || projectionFlushTimer) return;
    const remaining = PROJECTION_PROGRESS_INTERVAL_MS - (Date.now() - lastProjectionFlushAt);
    if (lastProjectionFlushAt === 0 || remaining <= 0) {
      projectionFlushQueued = true;
      queueMicrotask(() => {
        if (!projectionFlushQueued) return;
        projectionFlushQueued = false;
        void startProjectionProgressFlush(operationId);
      });
      return;
    }
    projectionFlushTimer = setTimeout(() => {
      projectionFlushTimer = undefined;
      void startProjectionProgressFlush(operationId);
    }, remaining);
    projectionFlushTimer.unref();
  };

  const flushProjectionProgress = async (operationId: string | undefined): Promise<void> => {
    projectionFlushQueued = false;
    clearTimeout(projectionFlushTimer);
    projectionFlushTimer = undefined;
    if (projectionFlushPromise) await projectionFlushPromise;
    await performProjectionProgressFlush(operationId);
  };

  const driver = new OmpDeterministicDriver({
    cwd: process.cwd(),
    runCli: async (args, timeoutMs, signal, stdin) => {
      const cwd = driveContext.getStore()?.cwd ?? activeContext?.cwd ?? process.cwd();
      const result = stdin
        ? await executeWithStdin(args, cwd, stdin, timeoutMs ?? 120_000, signal)
        : await pi.exec("babysitter", args, {
            cwd,
            timeout: timeoutMs ?? 120_000,
            signal,
          });
      return {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
        killed: result.killed,
      };
    },
    onProgress: (progress) => {
      const owner = projectionOwner;
      if (
        !owner ||
        owner.generation !== projectionGeneration ||
        owner.operationId !== progress.operationId ||
        owner.runDir !== path.resolve(progress.runDir)
      ) return;
      pendingProjectionProgress = progress;
      scheduleProjectionProgressFlush(owner.operationId);
    },
    onProgressError: (error, progress) => {
      try {
        pi.logger.warn("Babysitter progress listener failed without affecting orchestration", {
          category: "progress_listener_failed",
          stage: progress.stage,
          diagnostic: sanitizeDiagnosticText(error instanceof Error ? error.message : String(error)),
        });
      } catch {
        // Host diagnostics must never fail the deterministic driver.
      }
    },
  });



  const agentRetryParameters = pi.zod.object({
    runDir: pi.zod.string(),
    effectId: pi.zod.string(),
    invocationKey: pi.zod.string(),
    ownerName: pi.zod.string(),
    dispatchToken: pi.zod.string(),
    model: pi.zod.string().optional(),
    reason: pi.zod.string(),
  });
  pi.registerTool<typeof agentRetryParameters>({
    name: "babysitter_agent_retry",
    label: "Authorize Babysitter agent retry",
    description: "Explicitly supersede a failed, aborted, or cancelled retained owner attempt. The prior owner becomes stale and cannot complete the new attempt.",
    parameters: agentRetryParameters,
    approval: "exec",
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const authorizationOperationId = projectionOwner?.operationId;
      const authorization = await driver.withProgressOperation(
        authorizationOperationId,
        () => driver.authorizeAgentRetry(params),
      );
      await flushProjectionProgress(authorizationOperationId);
      if (!authorization.handled || authorization.reason) {
        return {
          content: [{ type: "text", text: authorization.reason ?? "Retry authorization was not handled" }],
          details: authorization,
          isError: true,
        };
      }
      const continuation = await enqueueDrive(async () => {
        activeContext = ctx;
        driver.setWorkspaceCwd(typeof ctx?.cwd === "string" ? ctx.cwd : process.cwd());
        const continuationOperationId = projectionOwner?.operationId;
        try {
          return await driveContext.run(
            ctx,
            () => driver.drive(params.runDir, undefined, continuationOperationId),
          );
        } finally {
          await flushProjectionProgress(continuationOperationId);
        }
      });
      return {
        content: [{ type: "text", text: JSON.stringify(continuation, null, 2) }],
        details: { ...authorization, continuation },
      };
    },
  });

  pi.registerTool<typeof agentRetryParameters>({
    name: "babysitter_agent_cancel",
    label: "Cancel owned Babysitter agent attempt",
    description: "Explicitly mark the current retained owner attempt cancelled. A subsequent retry still requires babysitter_agent_retry authorization.",
    parameters: agentRetryParameters,
    approval: "exec",
    async execute(_toolCallId, params) {
      const operationId = projectionOwner?.operationId;
      try {
        const cancellation = await driver.withProgressOperation(
          operationId,
          () => driver.cancelAgentAttempt(params),
        );
        return {
          content: [{ type: "text", text: cancellation.reason ?? JSON.stringify(cancellation, null, 2) }],
          details: cancellation,
          ...(!cancellation.handled || cancellation.reason ? { isError: true } : {}),
        };
      } finally {
        await flushProjectionProgress(operationId);
      }
    },
  });

  const driveParameters = pi.zod.object({
    i: pi.zod.string().describe("Concise intent"),
    runDir: pi.zod.string().describe("Absolute Babysitter run directory"),
  });
  pi.registerTool<typeof driveParameters, DriverToolDetails>({
    name: "babysitter_drive",
    label: "Babysitter deterministic driver",
    description: "Deterministically execute and checkpoint Babysitter shell effects, post completed results, and iterate until an agent or human decision is required.",
    parameters: driveParameters,
    approval: "exec",
    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      return await enqueueDrive(async () => {
        activeContext = ctx;
        driver.setWorkspaceCwd(typeof ctx?.cwd === "string" ? ctx.cwd : process.cwd());
        latestProgress = undefined;
        pendingProjectionProgress = undefined;
        projectionFlushQueued = false;
        clearTimeout(projectionFlushTimer);
        projectionFlushTimer = undefined;
        lastProjectionFlushAt = 0;
        projectionRefreshFailedOperationId = undefined;
        const operationId = `drive:${projectionGeneration}:${++projectionOperationSequence}`;
        projectionOwner = {
          runDir: path.resolve(params.runDir),
          generation: projectionGeneration,
          operationId,
        };
        let toolProgress: DriverProgress | undefined;
        const unsubscribe = driver.onProgress((progress) => {
          if (progress.operationId !== operationId) return;
          toolProgress = progress;
          onUpdate?.({
            content: [{ type: "text", text: progressText(progress) }],
            details: { state: "running", progress } satisfies DriverToolDetails,
          });
        });
        try {
          const result = await driveContext.run(
            ctx,
            () => driver.drive(params.runDir, signal, operationId),
          );
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            details: {
              state: result.state,
              ...(toolProgress ? { progress: toolProgress } : {}),
            } satisfies DriverToolDetails,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: sanitizeDiagnosticText(error instanceof Error ? error.message : String(error)),
            }],
            details: {
              state: "operator_attention",
              ...(toolProgress ? { progress: toolProgress } : {}),
            } satisfies DriverToolDetails,
            isError: true,
          };
        } finally {
          await flushProjectionProgress(operationId);
          unsubscribe();
        }
      });
    },
    renderCall(args) {
      return new ReadOnlyProjectionText(`Babysitter deterministic driver · ${path.basename(args.runDir)}`);
    },
    renderResult(result, options) {
      const details = result.details as DriverToolDetails | undefined;
      const progress = details?.progress;
      const summary = progress
        ? progressText(progress)
        : `Babysitter · ${details?.result?.state ?? details?.state ?? (result.isError ? "operator attention" : "completed")}`;
      const text = options.expanded && progress
        ? `${summary}\n${progress.key} · update ${progress.sequence}`
        : summary;
      return new ReadOnlyProjectionText(text);
    },
  });

  pi.on("tool_call", async (event) => {
    if (event.toolName !== "task") return;
    const operationId = projectionOwner?.operationId;
    try {
      const decision = await driver.withProgressOperation(
        operationId,
        () => driver.claimAgentToolCall(event.input, event.toolCallId),
      );
      if (decision.block) return { block: true, reason: decision.reason };
    } finally {
      await flushProjectionProgress(operationId);
    }
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName !== "task") return;
    const operationId = projectionOwner?.operationId;
    const completionContext = ctx ?? activeContext;
    try {
      const completion = await driver.withProgressOperation(
        operationId,
        () => driveContext.run(completionContext, () => driver.completeAgentToolCall({
          toolCallId: event.toolCallId,
          input: event.input,
          details: event.details,
          isError: event.isError,
        })),
      );
      if (!completion.handled) return;
      if (completion.continuationRunDir) {
        const continuationRunDir = completion.continuationRunDir;
        void enqueueDrive(async () => {
          activeContext = completionContext;
          driver.setWorkspaceCwd(
            typeof completionContext?.cwd === "string" ? completionContext.cwd : process.cwd(),
          );
          const continuationOperationId = projectionOwner?.operationId;
          try {
            const continuation = await driveContext.run(
              completionContext,
              () => driver.drive(continuationRunDir, undefined, continuationOperationId),
            );
            await flushProjectionProgress(continuationOperationId);
            pi.sendUserMessage(
              `Babysitter deterministic continuation:\n${JSON.stringify(continuation, null, 2)}`,
            );
          } catch (error) {
            await flushProjectionProgress(continuationOperationId);
            pi.sendUserMessage(
              `Babysitter driver stopped: ${sanitizeDiagnosticText(error instanceof Error ? error.message : String(error))}`,
            );
          }
        });
      }
      if (!completion.reason) return;
      return {
        content: [...event.content, { type: "text", text: completion.reason }],
      };
    } catch (error) {
      return {
        content: [
          ...event.content,
          { type: "text", text: `Babysitter driver stopped: ${sanitizeDiagnosticText(error instanceof Error ? error.message : String(error))}` },
        ],
        isError: true,
      };
    } finally {
      await flushProjectionProgress(operationId);
    }
  });

  const restoreAssociatedProjection = async (
    sessionId: string,
    ctx: ExtensionContext,
    generation: number,
  ): Promise<void> => {
    let result: SessionStateCommandResult;
    try {
      result = await pi.exec("babysitter", ["session:state", "--session-id", sessionId, "--json"], {
        cwd: ctx.cwd,
        timeout: 30_000,
      });
    } catch {
      if (generation === projectionGeneration) {
        pi.logger.warn("Babysitter session projection restore was skipped", {
          category: "session_state_execution_failed",
          fatal: false,
        });
      }
      return;
    }
    if (generation !== projectionGeneration) return;
    if (result.code !== 0) {
      pi.logger.warn("Babysitter session projection restore was skipped", {
        category: "session_state_command_failed",
        fatal: false,
      });
      return;
    }
    let payload: SessionStatePayload;
    try {
      payload = JSON.parse(result.stdout) as SessionStatePayload;
    } catch {
      pi.logger.warn("Babysitter session projection restore was skipped", {
        category: "invalid_session_state",
        fatal: false,
      });
      return;
    }
    const runDir = payload.found === true && typeof payload.state?.runDir === "string"
      ? payload.state.runDir
      : undefined;
    if (runDir && generation === projectionGeneration) {
      projectionOwner = {
        runDir: path.resolve(runDir),
        generation,
        operationId: `restore:${generation}:${++projectionOperationSequence}`,
      };
    }
    if (runDir && projectionOwner?.generation === generation) {
      const owner = projectionOwner;
      const restored = await refreshProjection(runDir, generation, owner.operationId, "session_restore");
      if (
        !restored &&
        projectionOwner?.generation === generation &&
        projectionOwner.operationId === owner.operationId &&
        projectionOwner.runDir === path.resolve(runDir)
      ) {
        projectionOwner = undefined;
        latestProgress = undefined;
        pendingProjectionProgress = undefined;
      }
    }
  };

  const clearOwnedSessionEnvironment = (): void => {
    const sessionId = ownedSessionId;
    if (!sessionId) return;
    if (process.env.OMP_SESSION_ID === sessionId) delete process.env.OMP_SESSION_ID;
    if (process.env.BABYSITTER_SESSION_ID === sessionId) delete process.env.BABYSITTER_SESSION_ID;
    ownedSessionId = undefined;
  };

  const syncSessionEnvironment = (ctx: ExtensionContext): string | undefined => {
    activeContext = ctx;
    driver.setWorkspaceCwd(ctx.cwd);
    const sessionId = ctx.sessionManager.getSessionId();
    process.env.OMP_PLUGIN_ROOT = PLUGIN_ROOT;
    if (!sessionId) {
      clearOwnedSessionEnvironment();
      return undefined;
    }
    process.env.OMP_SESSION_ID = sessionId;
    process.env.BABYSITTER_SESSION_ID = sessionId;
    ownedSessionId = sessionId;
    return sessionId;
  };
  const initializeSession = async (ctx: ExtensionContext): Promise<void> => {
    clearProjection();
    const generation = projectionGeneration;
    const sessionId = syncSessionEnvironment(ctx);
    if (!sessionId) {
      pi.logger.warn("Babysitter OMP session binding was skipped", {
        category: "missing_session",
        fatal: false,
      });
      return;
    }
    await restoreAssociatedProjection(sessionId, ctx, generation);
  };

  pi.on("session_start", (_event, ctx) => initializeSession(ctx));
  pi.on("session_switch", (_event, ctx) => initializeSession(ctx));
  pi.on("session_branch", (_event, ctx) => initializeSession(ctx));
  pi.on("session_tree", (_event, ctx) => initializeSession(ctx));
  pi.on("session_shutdown", (_event, ctx) => {
    const sessionId = ctx.sessionManager.getSessionId();
    if (sessionId && ownedSessionId !== sessionId) return;
    clearProjection();
    clearOwnedSessionEnvironment();
    activeContext = undefined;
  });

  // Register slash commands after lifecycle binding. Merely loading the
  // extension must never invoke session setup or create a session-less run.
  const forwardBabysit = async (args: unknown, ctx: ExtensionContext) => {
    syncSessionEnvironment(ctx);
    pi.sendUserMessage(toSkillPrompt("babysit", String(args ?? "").trim()));
  };

  pi.registerCommand("babysit", {
    description: "Load the Babysitter orchestration skill",
    handler: forwardBabysit,
  });

  pi.registerCommand("babysitter", {
    description: "Alias for /babysit",
    handler: forwardBabysit,
  });

  for (const name of COMMANDS) {
    const forward = async (args: unknown, ctx: ExtensionContext) => {
      syncSessionEnvironment(ctx);
      pi.sendUserMessage(toSkillPrompt(name, String(args ?? "").trim()));
    };

    pi.registerCommand(name, {
      description: name === "doctor"
        ? t("command.doctor.description", "Open the Babysitter doctor skill")
        : `Open the Babysitter ${name} skill`,
      handler: forward,
    });

    pi.registerCommand(`babysitter:${name}`, {
      description: name === "doctor"
        ? t("command.doctor.aliasDescription", "Alias for /doctor")
        : `Alias for /${name}`,
      handler: forward,
    });
  }
}
