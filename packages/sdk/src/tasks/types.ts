import { JsonRecord } from "../storage/types";

// Known task kinds (custom kinds are also allowed as any string)
export type KnownTaskKind = "node" | "breakpoint" | "orchestrator_task" | "sleep";

// TaskKind accepts any string (including custom task kinds)
export type TaskKind = string;

export interface TaskIOHints {
  inputJsonPath?: string;
  outputJsonPath?: string;
  stdoutPath?: string;
  stderrPath?: string;
}

export interface NodeTaskOptions {
  entry: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  timeoutMs?: number;
}

export interface BreakpointTaskOptions {
  payload?: unknown;
  confirmationRequired?: boolean;
}

export interface OrchestratorTaskOptions {
  payload?: JsonRecord;
  resumeCommand?: string;
}

export interface SleepTaskOptions {
  iso: string;
  targetEpochMs: number;
}

export interface TaskDef {
  kind: TaskKind;
  title?: string;
  description?: string;
  labels?: string[];
  io?: TaskIOHints;
  metadata?: JsonRecord;
  node?: NodeTaskOptions;
  breakpoint?: BreakpointTaskOptions;
  orchestratorTask?: OrchestratorTaskOptions;
  sleep?: SleepTaskOptions;
  [key: string]: unknown;
}

export interface BlobWriteOptions {
  /**
   * Optional content-type metadata (reserved for future integrations).
   */
  contentType?: string;
  /**
   * Text encoding to use when serializing string payloads (default: utf8).
   */
  encoding?: BufferEncoding;
  /**
   * Force JSON serialization (default: true for objects, false for strings/Buffers).
   */
  asJson?: boolean;
}

export interface TaskBuildContext {
  effectId: string;
  invocationKey: string;
  /**
   * Stable id returned from defineTask (used for serialization + hashing).
   */
  taskId: string;
  /**
   * Active run identifier (matches run.json:id).
   */
  runId: string;
  /**
   * Absolute path to the run directory containing journal/tasks/etc.
   */
  runDir: string;
  /**
   * Absolute path to the effect-specific task directory (runs/<id>/tasks/<effectId>).
   */
  taskDir: string;
  /**
   * Absolute path to the run-level tasks directory (runs/<id>/tasks).
   * @deprecated Use taskDir instead.
   */
  tasksDir: string;
  /**
   * Optional label provided at invocation time.
   */
  label?: string;
  labels: string[];
  /**
   * Writes the provided payload under tasks/<effectId>/blobs and returns a run-relative POSIX path.
   */
  createBlobRef(name: string, value: unknown, options?: BlobWriteOptions): Promise<string>;
  /**
   * Resolves a task-scoped relative path to a run-relative POSIX string.
   */
  toTaskRelativePath(relativePath: string): string;
}

export type TaskValueFactory<TArgs, TValue> = (args: TArgs, ctx: TaskBuildContext) => TValue | Promise<TValue>;

export type TaskValueOrFactory<TArgs, TValue> = TValue | TaskValueFactory<TArgs, TValue>;

export type TaskImpl<TArgs = unknown, _TResult = unknown> = (
  args: TArgs,
  ctx: TaskBuildContext
) => TaskDef | Promise<TaskDef>;

export interface DefinedTask<TArgs = unknown, _TResult = unknown> {
  id: string;
  build(args: TArgs, ctx: TaskBuildContext): TaskDef | Promise<TaskDef>;
}

export interface TaskInvokeOptions {
  label?: string;
}

export interface TaskSerializerContext {
  runDir: string;
  effectId: string;
  taskId: string;
  invocationKey: string;
  stepId?: string;
}

export interface NodeTaskDefinitionOptions<TArgs = unknown> {
  entry: TaskValueOrFactory<TArgs, string>;
  title?: TaskValueOrFactory<TArgs, string | undefined>;
  description?: TaskValueOrFactory<TArgs, string | undefined>;
  labels?: TaskValueOrFactory<TArgs, string[] | undefined>;
  metadata?: TaskValueOrFactory<TArgs, JsonRecord | undefined>;
  io?: TaskValueOrFactory<TArgs, TaskIOHints | undefined>;
  env?: TaskValueOrFactory<TArgs, Record<string, string | undefined> | undefined>;
  cwd?: TaskValueOrFactory<TArgs, string | undefined>;
  args?: TaskValueOrFactory<TArgs, string[] | undefined>;
  timeoutMs?: TaskValueOrFactory<TArgs, number | undefined>;
}

export interface BreakpointTaskDefinitionOptions<TArgs = unknown> {
  title?: TaskValueOrFactory<TArgs, string | undefined>;
  description?: TaskValueOrFactory<TArgs, string | undefined>;
  labels?: TaskValueOrFactory<TArgs, string[] | undefined>;
  metadata?: TaskValueOrFactory<TArgs, JsonRecord | undefined>;
  payload?: TaskValueOrFactory<TArgs, unknown>;
  confirmationRequired?: TaskValueOrFactory<TArgs, boolean | undefined>;
}

export interface OrchestratorTaskDefinitionOptions<TArgs = JsonRecord> {
  title?: TaskValueOrFactory<TArgs, string | undefined>;
  description?: TaskValueOrFactory<TArgs, string | undefined>;
  labels?: TaskValueOrFactory<TArgs, string[] | undefined>;
  metadata?: TaskValueOrFactory<TArgs, JsonRecord | undefined>;
  payload?: TaskValueOrFactory<TArgs, JsonRecord | undefined>;
  resumeCommand?: TaskValueOrFactory<TArgs, string | undefined>;
}

export interface SleepTaskBuilderArgs {
  iso: string;
  targetEpochMs: number;
}

export interface SleepTaskDefinitionOptions<TArgs extends SleepTaskBuilderArgs = SleepTaskBuilderArgs> {
  title?: TaskValueOrFactory<TArgs, string | undefined>;
  description?: TaskValueOrFactory<TArgs, string | undefined>;
  labels?: TaskValueOrFactory<TArgs, string[] | undefined>;
  metadata?: TaskValueOrFactory<TArgs, JsonRecord | undefined>;
}
