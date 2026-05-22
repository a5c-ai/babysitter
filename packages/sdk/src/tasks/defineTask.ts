import { DuplicateTaskIdError, globalTaskRegistry } from "./registry";
import { DefinedTask, TaskBuildContext, TaskDef, TaskImpl } from "./types";

export interface DefineTaskOptions {
  description?: string;
  labels?: string[];
  kind?: string;
  source?: string;
}

/**
 * Backward-compatible single-object form accepted by defineTask.
 * Two flavors are recognized:
 *   1. Static TaskDef shape: { id|name, kind, title, labels, ...rest } — the
 *      whole object (minus id/name/run/source/inputs/outputs) is treated as a
 *      static TaskDef returned for every invocation.
 *   2. Run-function shape: { id|name, run(args, ctx) -> TaskDef|Promise<TaskDef>,
 *      description?, labels?, kind?, source?, inputs?, outputs? } — `run` is
 *      used as the impl. `inputs`/`outputs` schemas are stored as metadata for
 *      tooling but are not enforced at runtime.
 *
 * This shape is used by ~75 library/contrib and library/methodologies files
 * authored against an earlier SDK API; supporting it here keeps those processes
 * runnable without per-file rewrites.
 */
export interface DefineTaskObjectSpec<TArgs = unknown, TResult = unknown> {
  id?: string;
  name?: string;
  description?: string;
  labels?: string[];
  kind?: string;
  source?: string;
  run?: TaskImpl<TArgs, TResult>;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  // Any other field is treated as part of the static TaskDef in flavor (1).
  [key: string]: unknown;
}

export function defineTask<TArgs = unknown, TResult = unknown>(
  id: string,
  impl: TaskImpl<TArgs, TResult>,
  options?: DefineTaskOptions
): DefinedTask<TArgs, TResult>;
export function defineTask<TArgs = unknown, TResult = unknown>(
  spec: DefineTaskObjectSpec<TArgs, TResult>
): DefinedTask<TArgs, TResult>;
export function defineTask<TArgs = unknown, TResult = unknown>(
  idOrSpec: string | DefineTaskObjectSpec<TArgs, TResult>,
  maybeImpl?: TaskImpl<TArgs, TResult>,
  maybeOptions: DefineTaskOptions = {}
): DefinedTask<TArgs, TResult> {
  // Object-form dispatch: defineTask({ id|name, ..., run? })
  if (typeof idOrSpec === "object" && idOrSpec !== null) {
    return defineTaskFromObject<TArgs, TResult>(idOrSpec);
  }

  const id = idOrSpec;
  const impl = maybeImpl as TaskImpl<TArgs, TResult>;
  const options = maybeOptions;

  if (typeof impl !== "function") {
    throw new Error(
      "defineTask positional form requires (id, impl) where impl is a function returning a TaskDef"
    );
  }

  const taskId = normalizeTaskId(id);
  registerTaskId(taskId, options);

  const defined: DefinedTask<TArgs, TResult> = {
    id: taskId,
    async build(args: TArgs, ctx: TaskBuildContext): Promise<TaskDef> {
      const taskDef = await Promise.resolve(impl(args, ctx));
      const normalized = normalizeTaskDef(taskDef);
      const mergedLabels = [...(options.labels ?? []), ...(normalized.labels ?? [])];
      globalTaskRegistry.recordDefinitionMetadata(taskId, {
        kind: normalized.kind,
        description: normalized.description ?? options.description,
        labels: mergedLabels,
      });
      return normalized;
    },
  };

  return Object.freeze(defined);
}

function registerTaskId(taskId: string, options: DefineTaskOptions) {
  try {
    globalTaskRegistry.registerDefinition({
      id: taskId,
      kind: options.kind,
      description: options.description,
      labels: options.labels ?? [],
      source: options.source,
    });
  } catch (error) {
    if (error instanceof DuplicateTaskIdError) {
      throw error;
    }
    throw new DuplicateTaskIdError(taskId);
  }
}

function normalizeTaskId(id: string): string {
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("defineTask requires a non-empty string id");
  }
  return id.trim();
}

function defineTaskFromObject<TArgs, TResult>(
  spec: DefineTaskObjectSpec<TArgs, TResult>
): DefinedTask<TArgs, TResult> {
  const taskId = spec.id ?? spec.name;
  if (typeof taskId !== "string" || !taskId.trim()) {
    throw new Error(
      "defineTask object form requires a non-empty `id` or `name` string"
    );
  }

  const options: DefineTaskOptions = {
    description: spec.description,
    labels: spec.labels,
    kind: spec.kind,
    source: spec.source,
  };

  let impl: TaskImpl<TArgs, TResult>;
  if (typeof spec.run === "function") {
    // Flavor (2): defineTask({ id|name, run, ... })
    impl = spec.run;
  } else {
    // Flavor (1): static TaskDef. Everything except SDK-recognized envelope
    // fields becomes the static TaskDef.
    const {
      id: _id,
      name: _name,
      run: _run,
      inputs: _inputs,
      outputs: _outputs,
      source: _source,
      ...rest
    } = spec;
    void _id;
    void _name;
    void _run;
    void _inputs;
    void _outputs;
    void _source;
    const staticTaskDef = rest as TaskDef;
    impl = (() => staticTaskDef) as TaskImpl<TArgs, TResult>;
  }

  return defineTask<TArgs, TResult>(taskId, impl, options);
}

function normalizeTaskDef(taskDef: TaskDef): TaskDef {
  if (!taskDef || typeof taskDef !== "object") {
    throw new Error("Task implementations must return a TaskDef object");
  }
  const labels = Array.isArray(taskDef.labels)
    ? taskDef.labels.filter((label): label is string => typeof label === "string" && Boolean(label.trim()))
    : undefined;
  if (labels) {
    taskDef.labels = Array.from(new Set(labels.map((label) => label.trim())));
  }
  return taskDef;
}
