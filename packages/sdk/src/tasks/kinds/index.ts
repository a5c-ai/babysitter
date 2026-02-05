import { JsonRecord } from "../../storage/types";
import { defineTask } from "../defineTask";
import {
  BreakpointTaskDefinitionOptions,
  BreakpointTaskOptions,
  DefinedTask,
  NodeTaskDefinitionOptions,
  NodeTaskOptions,
  OrchestratorTaskDefinitionOptions,
  OrchestratorTaskOptions,
  SleepTaskBuilderArgs,
  SleepTaskDefinitionOptions,
  TaskBuildContext,
  TaskIOHints,
  TaskValueFactory,
  TaskValueOrFactory,
} from "../types";
import { DEFAULTS } from "../../config/defaults";

/**
 * Default node task timeout.
 * @see DEFAULTS.nodeTaskTimeout for the centralized default
 */
const DEFAULT_NODE_TIMEOUT_MS = DEFAULTS.nodeTaskTimeout;
const DEFAULT_BREAKPOINT_LABEL = "breakpoint";
const DEFAULT_ORCHESTRATOR_LABEL = "orchestrator-task";
const DEFAULT_SLEEP_TASK_ID = "__sdk.sleep";
const REDACTION_KEYWORDS = ["SECRET", "TOKEN", "PASSWORD", "KEY"];

type EnvInput = Record<string, string | undefined>;

export function nodeTask<TArgs = unknown, TResult = unknown>(
  id: string,
  options: NodeTaskDefinitionOptions<TArgs>
): DefinedTask<TArgs, TResult> {
  if (!options || !options.entry) {
    throw new Error("nodeTask requires an entry option");
  }
  return defineTask<TArgs, TResult>(
    id,
    async (args, ctx) => {
      const [
        entry,
        title,
        description,
        helperLabels,
        helperMetadata,
        ioOverrides,
        nodeArgs,
        envInput,
        cwd,
        timeoutOverride,
      ] = await Promise.all([
        resolveRequiredValue(options.entry, args, ctx, "entry"),
        resolveOptionalValue(options.title, args, ctx),
        resolveOptionalValue(options.description, args, ctx),
        resolveLabelList(options.labels, args, ctx),
        resolveMetadata(options.metadata, args, ctx),
        resolveIoHints(options.io, args, ctx),
        resolveStringArray(options.args, args, ctx),
        resolveEnv(options.env, args, ctx),
        resolveOptionalValue(options.cwd, args, ctx),
        resolveNumber(options.timeoutMs, args, ctx),
      ]);

      const io = applyIoOverrides(buildDefaultNodeIo(ctx), ioOverrides);
      const { env, redacted } = sanitizeEnv(envInput);
      const metadata = appendRedactedEnvKeys(helperMetadata, redacted);
      const labels = mergeLabels(ctx, helperLabels);

      const nodeOptions = buildNodeOptions(entry, nodeArgs, env, cwd, timeoutOverride);
      return {
        kind: "node",
        title,
        description,
        labels,
        io,
        metadata,
        node: nodeOptions,
      };
    },
    { kind: "node" }
  );
}

export function breakpointTask<TArgs = unknown, TResult = void>(
  id: string,
  options: BreakpointTaskDefinitionOptions<TArgs> = {}
): DefinedTask<TArgs, TResult> {
  return defineTask<TArgs, TResult>(
    id,
    async (args, ctx) => {
      const [title, description, helperLabels, metadata, payload, confirmationRequired] = await Promise.all([
        resolveOptionalValue(options.title, args, ctx),
        resolveOptionalValue(options.description, args, ctx),
        resolveLabelList(options.labels, args, ctx),
        resolveMetadata(options.metadata, args, ctx),
        resolveOptionalValue(options.payload, args, ctx),
        resolveBoolean(options.confirmationRequired, args, ctx),
      ]);

      const labels = mergeLabels(ctx, helperLabels, DEFAULT_BREAKPOINT_LABEL);
      const breakpoint = buildBreakpointOptions(payload ?? args, confirmationRequired);
      const resolvedTitle = title ?? ctx.label ?? labels?.[0] ?? DEFAULT_BREAKPOINT_LABEL;

      return {
        kind: "breakpoint",
        title: resolvedTitle,
        description,
        labels,
        metadata,
        breakpoint,
      };
    },
    { kind: "breakpoint" }
  );
}

export function orchestratorTask<TArgs = JsonRecord, TResult = unknown>(
  id: string,
  options: OrchestratorTaskDefinitionOptions<TArgs> = {}
): DefinedTask<TArgs, TResult> {
  return defineTask<TArgs, TResult>(
    id,
    async (args, ctx) => {
      const [title, description, helperLabels, metadata, payload, resumeCommand] = await Promise.all([
        resolveOptionalValue(options.title, args, ctx),
        resolveOptionalValue(options.description, args, ctx),
        resolveLabelList(options.labels, args, ctx),
        resolveMetadata(options.metadata, args, ctx),
        resolvePayload(options.payload, args, ctx),
        resolveOptionalValue(options.resumeCommand, args, ctx),
      ]);

      const labels = mergeLabels(ctx, helperLabels, DEFAULT_ORCHESTRATOR_LABEL);
      const orchestrator = buildOrchestratorOptions(payload ?? pickJsonRecord(args), resumeCommand);
      const mergedMetadata = ensureMetadata(metadata);
      mergedMetadata.orchestratorTask = true;
      const resolvedTitle = title ?? ctx.label ?? labels?.[0] ?? DEFAULT_ORCHESTRATOR_LABEL;

      return {
        kind: "orchestrator_task",
        title: resolvedTitle,
        description,
        labels,
        metadata: mergedMetadata,
        orchestratorTask: orchestrator,
      };
    },
    { kind: "orchestrator_task" }
  );
}

export function sleepTask<TArgs extends SleepTaskBuilderArgs = SleepTaskBuilderArgs>(
  id = DEFAULT_SLEEP_TASK_ID,
  options: SleepTaskDefinitionOptions<TArgs> = {}
): DefinedTask<TArgs, void> {
  return defineTask<TArgs, void>(
    id,
    async (args, ctx) => {
      const [title, description, helperLabels, metadata] = await Promise.all([
        resolveOptionalValue(options.title, args, ctx),
        resolveOptionalValue(options.description, args, ctx),
        resolveLabelList(options.labels, args, ctx),
        resolveMetadata(options.metadata, args, ctx),
      ]);

      const iso = args.iso;
      const targetEpochMs = args.targetEpochMs;
      if (typeof iso !== "string" || !iso.length) {
        throw new Error("sleepTask requires args.iso to be a non-empty ISO string");
      }
      if (typeof targetEpochMs !== "number" || !Number.isFinite(targetEpochMs)) {
        throw new Error("sleepTask requires args.targetEpochMs to be a finite number");
      }
      const labels = mergeLabels(ctx, helperLabels, `sleep:${iso}`);
      const mergedMetadata = ensureMetadata(metadata);
      mergedMetadata.iso = iso;
      mergedMetadata.targetEpochMs = targetEpochMs;
      const resolvedTitle = title ?? `sleep:${iso}`;

      return {
        kind: "sleep",
        title: resolvedTitle,
        description,
        labels,
        metadata: mergedMetadata,
        sleep: { iso, targetEpochMs },
      };
    },
    { kind: "sleep" }
  );
}

async function resolveOptionalValue<TArgs, TValue>(
  source: TaskValueOrFactory<TArgs, TValue | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<TValue | undefined> {
  if (source === undefined || source === null) return undefined;
  const value = isFactory(source) ? await source(args, ctx) : source;
  return value === null ? undefined : value;
}

async function resolveRequiredValue<TArgs>(
  source: TaskValueOrFactory<TArgs, string>,
  args: TArgs,
  ctx: TaskBuildContext,
  field: string
): Promise<string> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`nodeTask requires a non-empty ${field}`);
  }
  return value;
}

async function resolveLabelList<TArgs>(
  source: TaskValueOrFactory<TArgs, string[] | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<string[] | undefined> {
  const values = await resolveOptionalValue(source, args, ctx);
  if (!Array.isArray(values)) {
    return undefined;
  }
  return normalizeLabels(values);
}

async function resolveMetadata<TArgs>(
  source: TaskValueOrFactory<TArgs, JsonRecord | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<JsonRecord | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (!isJsonRecord(value)) {
    return undefined;
  }
  return { ...value };
}

async function resolveIoHints<TArgs>(
  source: TaskValueOrFactory<TArgs, TaskIOHints | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<TaskIOHints | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (!value) return undefined;
  return { ...value };
}

async function resolveStringArray<TArgs>(
  source: TaskValueOrFactory<TArgs, string[] | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<string[] | undefined> {
  const values = await resolveOptionalValue(source, args, ctx);
  if (!Array.isArray(values)) {
    return undefined;
  }
  return values.slice();
}

async function resolveEnv<TArgs>(
  source: TaskValueOrFactory<TArgs, EnvInput | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<EnvInput | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (!value || typeof value !== "object") {
    return undefined;
  }
  return { ...value };
}

async function resolveNumber<TArgs>(
  source: TaskValueOrFactory<TArgs, number | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<number | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

async function resolveBoolean<TArgs>(
  source: TaskValueOrFactory<TArgs, boolean | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<boolean | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (typeof value !== "boolean") {
    return undefined;
  }
  return value;
}

async function resolvePayload<TArgs>(
  source: TaskValueOrFactory<TArgs, JsonRecord | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<JsonRecord | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (!isJsonRecord(value)) {
    return undefined;
  }
  return { ...value };
}

function isFactory<TArgs, TValue>(value: TaskValueOrFactory<TArgs, TValue>): value is TaskValueFactory<TArgs, TValue> {
  return typeof value === "function";
}

function normalizeLabels(values?: string[]): string[] | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const label of values) {
    if (typeof label !== "string") continue;
    const trimmed = label.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized.length ? normalized : undefined;
}

function mergeLabels(ctx: TaskBuildContext, helperLabels?: string[], fallback?: string): string[] | undefined {
  const combined: string[] = [];
  combined.push(...(normalizeLabels(ctx.labels) ?? []));
  combined.push(...(helperLabels ?? []));
  const normalized = normalizeLabels(combined);
  const fallbackLabel = typeof fallback === "string" ? fallback.trim() : undefined;
  if ((!ctx.label || !ctx.label.trim()) && (!normalized || normalized.length === 0) && fallbackLabel) {
    return [fallbackLabel];
  }
  return normalized;
}

function buildDefaultNodeIo(ctx: TaskBuildContext): TaskIOHints {
  return {
    inputJsonPath: ctx.toTaskRelativePath("inputs.json"),
    outputJsonPath: ctx.toTaskRelativePath("result.json"),
    stdoutPath: ctx.toTaskRelativePath("stdout.log"),
    stderrPath: ctx.toTaskRelativePath("stderr.log"),
  };
}

function applyIoOverrides(base: TaskIOHints, override?: TaskIOHints): TaskIOHints {
  if (!override) {
    return base;
  }
  return {
    ...base,
    ...override,
  };
}

function sanitizeEnv(input?: EnvInput): { env?: Record<string, string>; redacted: string[] } {
  if (!input) {
    return { redacted: [] };
  }
  const env: Record<string, string> = {};
  const redacted: string[] = [];
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = typeof rawKey === "string" ? rawKey.trim() : "";
    if (!key) continue;
    if (rawValue === undefined || rawValue === null) {
      continue;
    }
    const value = typeof rawValue === "string" ? rawValue : String(rawValue);
    if (shouldRedactEnvKey(key)) {
      redacted.push(key);
      continue;
    }
    env[key] = value;
  }
  redacted.sort((a, b) => a.localeCompare(b));
  return {
    env: Object.keys(env).length ? env : undefined,
    redacted,
  };
}

function shouldRedactEnvKey(key: string): boolean {
  const upper = key.toUpperCase();
  if (upper === "NODE_AUTH_TOKEN") {
    return true;
  }
  return REDACTION_KEYWORDS.some((keyword) => upper.includes(keyword));
}

function appendRedactedEnvKeys(metadata: JsonRecord | undefined, keys: string[]): JsonRecord | undefined {
  if (!keys.length) {
    return metadata;
  }
  const result = ensureMetadata(metadata);
  const existingValue = result.redactedEnvKeys;
  const existing: string[] = Array.isArray(existingValue)
    ? existingValue.filter((v): v is string => typeof v === "string")
    : [];
  const merged = Array.from(new Set<string>([...existing, ...keys]));
  merged.sort((a, b) => a.localeCompare(b));
  result.redactedEnvKeys = merged;
  return result;
}

function ensureMetadata(metadata?: JsonRecord): JsonRecord {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return { ...metadata };
  }
  return {};
}

function buildNodeOptions(
  entry: string,
  args: string[] | undefined,
  env: Record<string, string> | undefined,
  cwd: string | undefined,
  timeoutOverride: number | undefined
): NodeTaskOptions {
  const nodeOptions: NodeTaskOptions = { entry };
  if (args !== undefined) {
    nodeOptions.args = args;
  }
  if (env) {
    nodeOptions.env = env;
  }
  if (typeof cwd === "string" && cwd.length) {
    nodeOptions.cwd = cwd;
  }
  nodeOptions.timeoutMs = typeof timeoutOverride === "number" ? timeoutOverride : DEFAULT_NODE_TIMEOUT_MS;
  return nodeOptions;
}

function buildBreakpointOptions(payload: unknown, confirmationRequired?: boolean): BreakpointTaskOptions {
  const breakpoint: BreakpointTaskOptions = {};
  if (payload !== undefined) {
    breakpoint.payload = payload;
  }
  if (confirmationRequired !== undefined) {
    breakpoint.confirmationRequired = confirmationRequired;
  }
  return breakpoint;
}

function buildOrchestratorOptions(payload?: JsonRecord, resumeCommand?: string): OrchestratorTaskOptions {
  const orchestrator: OrchestratorTaskOptions = {};
  if (payload) {
    orchestrator.payload = payload;
  }
  if (resumeCommand) {
    orchestrator.resumeCommand = resumeCommand;
  }
  return orchestrator;
}

function pickJsonRecord(value: unknown): JsonRecord | undefined {
  if (!isJsonRecord(value)) {
    return undefined;
  }
  return { ...value };
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
