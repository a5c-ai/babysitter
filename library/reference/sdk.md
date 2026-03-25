# @a5c-ai/babysitter-sdk — Event-Sourced Process Orchestration SDK

## 0. Overview

`@a5c-ai/babysitter-sdk` is a JavaScript/TypeScript SDK for **event‑sourced process orchestration**.

Core ideas:

* A **process** is just JS/TS code (sync or async) that calls **intrinsics** like `ctx.task`, `ctx.breakpoint`, `ctx.sleepUntil`.
* The process never executes external work directly. Instead, it **decides what should happen next**.
* When a process needs something done, the intrinsic either:

  * returns a previously recorded result from the **journal**, or
  * throws a **typed exception** that tells the orchestrator what to do next.
* The orchestrator (external to the SDK) dispatches the work and later calls back into the SDK with the result.
* All state is **event‑sourced** and **filesystem-based**, stored in a single run directory that is **git‑friendly and human‑readable**.

There is only one fundamental side‑effect primitive: **tasks**.

* “Agents” (LLM-powered tools, code assistants, etc.) are just **tasks** whose definition describes an external CLI invocation and prompt files.

The design favors:

* Deterministic replay (re-run from the top, short‑circuit at intrinsics via the journal)
* Git friendliness (append‑only per‑event files, readable JSON, artifacts separated from events)
* A small, composable core with room for richer DevEx later (CLI, helpers, testing harness).

---

## 1. Core Concepts

### 1.1 Run

A **run** is a single logical execution of a process. Each run lives under its own directory and is treated as an immutable historical record (except for appending events and artifacts).

A run directory contains:

* The process entrypoint (or a pointer to it)
* An **append‑only journal** of events
* A **derived state cache** (rebuildable; gitignored)
* Task definitions and results
* Optional blobs/artifacts referenced from events

Typical layout:

```text
runs/<runId>/
  run.json                 # metadata: run id, process id, entrypoint, revision, etc.
  inputs.json              # initial inputs (if not embedded in run.json)
  journal/
    000001.<ulid>.json     # one event per file, ordered by seq
    000002.<ulid>.json
    ...
  state/
    state.json             # derived index; gitignored
  tasks/
    <effectId>/
      task.json            # TaskDef as resolved at request time
      result.json          # normalized result (optional)
      stdout.txt           # optional
      stderr.txt           # optional
      artifacts/ ...
  blobs/
    <sha256>               # optional large content store
  process/
    index.js               # optional snapshot of process code (or workspace pointer)
```

> **Git behavior**
>
> * `journal/` is optimized for merges: one event per file, deterministic naming.
> * `state/` is gitignored; it is a derived cache.
> * `tasks/` and `blobs/` are reviewable but may be large; can be partially ignored depending on use case.

### 1.2 Process

A **process** is any JS/TS function, sync or async:

```ts
// process/my-process.ts

export async function process(inputs: any, ctx: ProcessContext): Promise<any> {
  const buildResult = await ctx.task(buildTask, { target: "app" });

  const [lintResult, testsResult] = await ctx.parallel.all([
    () => ctx.task(lintTask, { files: buildResult.files }),
    () => ctx.task(testTask, { suite: "smoke" }),
  ]);

  if (!lintResult.ok || !testsResult.ok) {
    await ctx.breakpoint({ reason: "lint/tests failed", lintResult, testsResult });
  }

  const review = await ctx.task(codeReviewAgentTask, {
    diffRef: buildResult.diffRef,
  });

  return { ok: true, reviewSummary: review.summary };
}
```

The process:

* Is deterministic with respect to:

  * `inputs`
  * previously recorded task results
  * `ctx.now()` (if used)
* May call any combination of intrinsics:

  * `ctx.task` (core primitive)
  * `ctx.breakpoint` (implemented via `ctx.task`)
  * `ctx.sleepUntil` (time gate)
  * `ctx.parallel.*` helpers for “batching” actions

The process **never executes tasks directly**. It only requests them.

### 1.3 Single Writer

For each run directory there is a **single writer** at a time:

* Only one orchestrator appends events to `journal/`.
* This simplifies correctness and lock handling.

Later, concurrency controls can be added if needed.

---

## 2. Execution Model: Intrinsics + Typed Exceptions

The key idea: intrinsics are normal functions that, on first call, compute a request and then **throw a typed exception**. The orchestrator catches it at the top level.

### 2.1 Intrinsic lifecycle

On each `orchestrateIteration`:

1. The SDK loads the run’s journal and reconstructs a **state index**:

   * `invocationKey -> { effectId, status, resultRef/error }`.

2. The process function is called from the beginning:

   ```ts
   try {
     const output = await process(inputs, ctx);
     // no exceptions => run completed
   } catch (e) {
     // typed exceptions for effects and parallel batches
   }
   ```

3. For each intrinsic call (e.g., `ctx.task`), the SDK:

   * Computes a **deterministic invocation identity** (see §3).
   * Looks up that invocation in the state index.
   * Behavior:

     * **If resolved** → return the previously recorded result.
     * **If requested but not resolved yet** → throw a `EffectPending` (or similar) exception.
     * **If never seen before** → compute a new TaskDef, record an `EFFECT_REQUESTED` event, and throw `EffectRequested`.

4. The top-level orchestration function catches the exception and turns it into a **next action** for the orchestrator to dispatch.

5. When the orchestrator finishes the work, it calls `commitEffectResult` with the `effectId` and result.

6. On subsequent iterations, replay short‑circuits at that intrinsic and returns the result immediately.

This achieves “resume from the last execution point” without VM-level continuations: resuming = **re-running from the start with more effects resolved**.

### 2.2 Exception types

SDK-defined exceptions include (names are illustrative):

* `EffectRequested` —

  * thrown when a new task is requested for the first time
  * contains: `effectId`, `invocationKey`, `taskSummary` (kind, label, etc.)

* `EffectPending` —

  * thrown when a previously requested task is still unresolved
  * contains: `effectId`, `invocationKey`, same `taskSummary`

* `ParallelPending` —

  * thrown by `ctx.parallel.*` when one or more underlying intrinsics still need work
  * contains: `effectIds[]`, batched `taskSummaries[]`

* `RunCompleted` (internal) —

  * not usually thrown; completion is represented by a normal return

* `RunFailed` —

  * represented as a recorded `RUN_FAILED` event when an unhandled error escapes

User code never needs to construct these directly; they are part of the SDK internals.

---

## 3. Canonical Invocation Identity

A process can call the same task multiple times. A simple “function name” key is not enough.

We need a canonical identity that:

* is stable across replays of the **same run**, and
* distinguishes multiple calls to the same task in a single process execution.

### 3.1 Replay cursor / step id

During each `orchestrateIteration`, a `ReplayCursor` is created and advanced on every intrinsic attempt:

````ts
let stepCounter = 0;
function nextStepId(): string {
  stepCounter += 1;
  return `S${stepCounter.toString().padStart(6, "0")}`;
}
``

Each intrinsic call obtains a `stepId` via `nextStepId()`.

### 3.2 Process and task stable ids

- `processStableId`:
  - recommended: explicitly stored in `run.json`, e.g. `"processId": "a5c/ci-pipeline"`.
  - fallback: entrypoint path + export name.

- `taskStableId`:
  - recommended: explicitly provided when defining a task, e.g. `defineTask("lint", ...)`.
  - fallback: derived from module path + export name.

### 3.3 Invocation key

```text
invocationKey = <processStableId> + ":" + <stepId> + ":" + <taskStableId>
````

This key is used as the primary lookup for:

* whether a task invocation was already requested
* whether a result is available or an error should be re-thrown

> **Note**
> This assumes process code remains semantically stable for a given run.
> The SDK should store a `processRevision` (hash/commit) in `run.json` and warn if it changes across iterations.

---

## 4. Journal & State

### 4.1 Event types

Events are immutable JSON objects, stored one per file under `journal/`.

#### Common fields

```ts
type JournalEventBase = {
  seq: number;             // monotonically increasing per run
  id: string;              // ULID
  ts: string;              // ISO timestamp
  type: string;            // concrete event type
};
```

#### RUN_CREATED

```ts
type RunCreated = JournalEventBase & {
  type: "RUN_CREATED";
  payload: {
    runId: string;
    processId: string;
    processRevision?: string;  // hash or git commit
    entrypoint: {
      importPath: string;
      exportName: string;
    };
    inputsRef?: string;        // path to inputs.json
  };
};
```

#### EFFECT_REQUESTED

```ts
type EffectRequested = JournalEventBase & {
  type: "EFFECT_REQUESTED";
  payload: {
    effectId: string;         // ULID
    invocationKey: string;    // processId:stepId:taskId
    stepId: string;           // S000001, etc.
    taskId: string;           // taskStableId
    kind: string;             // e.g. "node", "breakpoint", "orchestrator_task"
    label?: string;           // user-facing label
    taskDefRef: string;       // tasks/<effectId>/task.json
    inputsRef?: string;       // optional, for large inputs
  };
};
```

#### EFFECT_RESOLVED

```ts
type EffectResolved = JournalEventBase & {
  type: "EFFECT_RESOLVED";
  payload: {
    effectId: string;
    status: "ok" | "error";
    resultRef?: string;       // tasks/<effectId>/result.json or blob ref
    error?: {
      name: string;
      message: string;
      stack?: string;
      data?: any;             // optional structured error info
    };
    stdoutRef?: string;
    stderrRef?: string;
    startedAt?: string;
    finishedAt?: string;
  };
};
```

#### RUN_COMPLETED

```ts
type RunCompleted = JournalEventBase & {
  type: "RUN_COMPLETED";
  payload: {
    outputRef?: string;       // optional pointer to final output
  };
};
```

#### RUN_FAILED

```ts
type RunFailed = JournalEventBase & {
  type: "RUN_FAILED";
  payload: {
    error: {
      name: string;
      message: string;
      stack?: string;
      data?: any;
    };
  };
};
```

### 4.2 Derived state

`state/state.json` is a derived index optimized for fast lookups:

```ts
type DerivedState = {
  lastSeq: number;
  effects: {
    [invocationKey: string]: {
      effectId: string;
      status: "requested" | "resolved_ok" | "resolved_error";
      kind: string;
      label?: string;
      resultRef?: string;
      error?: DerivedErrorSummary;
    };
  };
};
```

This file is:

* **gitignored** (rebuild from the journal if missing)
* used only as a performance optimization

---

## 5. Task System (Unified Primitive)

There are no separate “agents”. Everything is a **task**.

A task is defined in code and, when invoked by the process, returns a **TaskDef** that can be executed independently by some runner.

### 5.1 Task definition helpers

```ts
// sdk author-facing API sketch

export interface TaskDef {
  kind: "node" | "breakpoint" | "orchestrator_task" | string;
  title?: string;
  description?: string;

  node?: {
    entry: string;                // path to node script
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
    timeoutMs?: number;
  };

  io?: {
    inputJsonPath?: string;       // where inputs are written for the script
    outputJsonPath?: string;      // where script writes JSON output
  };

  labels?: string[];
}

export type TaskImpl<TArgs = any> = (
  args: TArgs,
  taskCtx: TaskBuildContext
) => TaskDef;

export function defineTask<TArgs = any, TResult = any>(
  id: string,
  impl: TaskImpl<TArgs>
): DefinedTask<TArgs, TResult> {
  // returns a callable with metadata; implementation omitted here
}
```

### 5.2 Example: simple Node task

```ts
// tasks/build.ts
import { defineTask } from "@a5c-ai/babysitter-sdk";

export const buildTask = defineTask<
  { target: string },
  { files: string[]; diffRef: string }
>("build", (args, taskCtx) => {
  const effectId = taskCtx.effectId;        // for writing prompt/inputs if needed

  return {
    kind: "node",
    title: `Build ${args.target}`,
    node: {
      entry: "scripts/build.js",
      args: ["--target", args.target, "--effectId", effectId],
    },
    io: {
      inputJsonPath: `tasks/${effectId}/input.json`,
      outputJsonPath: `tasks/${effectId}/result.json`,
    },
  } satisfies TaskDef;
});
```

### 5.3 Example: agent-like task (LLM code review)

```ts
// tasks/code-review.ts
import { defineTask } from "@a5c-ai/babysitter-sdk";

export const codeReviewAgentTask = defineTask<
  { diffRef: string },
  { summary: string; issues: any[] }
>("code-review-agent", (args, taskCtx) => {
  const effectId = taskCtx.effectId;
  const agentCli = process.env.A5C_AGENT_CMD ?? "claude-code";

  // The orchestrator or a helper can write the actual prompt
  // file based on diffRef, or this impl could do it via taskCtx.

  return {
    kind: "node",
    title: "Agent code review",
    description: "Run LLM-based code review on a diff",
    node: {
      entry: "scripts/run-agent-review.js",
      args: [
        "--agent-cli", agentCli,
        "--diff-ref", args.diffRef,
        "--effect-id", effectId,
      ],
    },
    io: {
      inputJsonPath: `tasks/${effectId}/input.json`,
      outputJsonPath: `tasks/${effectId}/result.json`,
    },
    labels: ["agent", "code-review"],
  };
});
```

---

## 6. Process Context & Intrinsics API

### 6.1 ProcessContext

```ts
export interface ProcessContext {
  now(): Date;                               // uses provided `now` or Date.now

  task<TArgs, TResult>(
    taskFn: DefinedTask<TArgs, TResult>,
    args: TArgs,
    options?: { label?: string }
  ): Promise<TResult> | TResult;

  breakpoint<T = any>(payload: T): Promise<void> | void;

  sleepUntil(isoOrEpochMs: string | number): Promise<void> | void;

  orchestratorTask<TArgs, TResult>(
    payload: TArgs,
    options?: { label?: string }
  ): Promise<TResult> | TResult;

  parallel: {
    all<T>(thunks: Array<() => T | Promise<T>>): Promise<T[]> | T[];
    map<TItem, TOut>(
      items: TItem[],
      fn: (item: TItem) => TOut | Promise<TOut>
    ): Promise<TOut[]> | TOut[];
  };

  // optional helpers for logging, tracing, blobs, etc.
  log?(...args: any[]): void;
}
```

### 6.2 Intrinsic behavior details

#### `ctx.task(taskFn, args, options?)`

* Computes `stepId` via the replay cursor.
* Computes `invocationKey` from:

  * processId (from run.json)
  * stepId
  * `taskFn.id` (from `defineTask`)
* Looks up invocation in derived state:

  * **resolved_ok** → reads resultRef, returns parsed result
  * **resolved_error** → reconstructs error and throws it into process code
  * **requested** → throws `EffectPending` with the cached TaskDef
  * **missing** (first time) →

    * computes `effectId`
    * calls `taskFn(args, taskBuildCtx)` to get TaskDef
    * writes `tasks/<effectId>/task.json`
    * appends `EFFECT_REQUESTED`
    * throws `EffectRequested`

#### `ctx.breakpoint(payload)`

Implemented via a task, but with a dedicated `kind`:

```ts
await ctx.task(breakpointTask, { payload }, { label: "breakpoint" });
```

Labels default to `"breakpoint"`, but you can override them via `options.label` or by passing `payload.label`. The SDK prefers the explicit option, then payload label, then the fallback.

The runner for `kind="breakpoint"` is typically a CLI or UI that:

* displays the payload
* waits for human action
* writes result (optional) and marks effect as resolved

#### `ctx.sleepUntil(isoOrEpochMs)`

* Evaluates `until = new Date(isoOrEpochMs)`.
* If `now() < until` and no prior effect exists → requests a dedicated `kind="sleep"` task (with metadata `{ targetEpochMs, iso }`) and throws `EffectRequested`.
* Replays before the deadline reuse the stored TaskDef and throw `EffectPending`.
* Once `now() >= until` → returns immediately without requesting new events so the run can continue.

#### `ctx.orchestratorTask(payload)`

Sugar that calls a dedicated task:

```ts
await ctx.task(orchestratorTaskDef, payload, { label: "orchestrator-task" });
```

The orchestrator can choose to route such tasks to itself rather than an external worker, but from the process perspective it’s just another task.

These tasks always use `kind="orchestrator_task"` plus `metadata.orchestratorTask = true`. Labels default to `"orchestrator-task"` but respect `options.label` so runs can expose friendly names in the UI.

---

## 7. Parallel Helpers

Parallelism here means: “decide multiple actions in one iteration so the orchestrator can dispatch them concurrently.”

### 7.1 `ctx.parallel.all`

```ts
const [buildResult, lintResult] = await ctx.parallel.all([
  () => ctx.task(buildTask, { target: "app" }, { label: "build" }),
  () => ctx.task(lintTask, { target: "app" }, { label: "lint" }),
]);
```

Behavior:

* Executes each thunk in order.
* For each thunk:

  * if it returns normally → collects the value
  * if it throws an `EffectRequested`/`EffectPending` → collects the effect description instead of failing
  * if it throws a non‑effect error → propagates immediately (so process can catch it)
* After all thunks:

  * if no pending effects → returns the array of values
  * if there are pending effects → throws `ParallelPending` containing all `effectIds` and their TaskDefs/summaries
* Pending effects are deduplicated by `effectId` but retain the original thunk order so orchestrator output stays deterministic.

`orchestrateIteration` catches `ParallelPending` and turns it into:

```ts
{
  status: "waiting",
  nextActions: [ /* batched tasks */ ],
}
```

### 7.2 `ctx.parallel.map`

Sugar over `all`:

```ts
const results = await ctx.parallel.map(files, file =>
  ctx.task(lintFileTask, { file }, { label: `lint:${file}` })
);
```

Implementation is equivalent to mapping items into thunks and delegating to `parallel.all`.

---

## 8. Orchestration API

The SDK exposes a small surface for orchestrators.

### 8.1 Run management

```ts
interface CreateRunOptions {
  baseDir: string;                        // e.g. "./runs"
  runId?: string;                         // if omitted, generated ULID
  process: {
    processId: string;                    // stable id for the process
    importPath: string;                   // relative to runDir or workspace
    exportName: string;                   // default: "process"
  };
  inputs?: any;                           // initial inputs; also written to inputs.json
}

function createRun(opts: CreateRunOptions): Promise<{ runDir: string }>;
```

This:

* creates `runs/<runId>/`
* writes `run.json`, `inputs.json`
* appends `RUN_CREATED`

### 8.2 Orchestrate iteration

```ts
interface OrchestrateOptions {
  runDir: string;
  process?: {
    importPath: string;
    exportName?: string;
  };                                    // if omitted, use run.json entrypoint
  inputs?: any;                          // optional override
  now?: Date;                            // if omitted, uses current time
  context?: any;                         // additional user context (non-persistent)
}

type IterationResult =
  | { status: "completed"; output: any }
  | { status: "waiting"; nextActions: EffectAction[] }
  | { status: "failed"; error: any };

function orchestrateIteration(
  opts: OrchestrateOptions
): Promise<IterationResult>;
```

`EffectAction` is an orchestrator-facing view:

```ts
interface EffectAction {
  effectId: string;
  invocationKey: string;
  taskId?: string;
  stepId?: string;
  kind: string;             // e.g. "node", "breakpoint", "orchestrator_task"
  label?: string;
  labels?: string[];
  taskDef: TaskDef;
  taskDefRef: string;
  inputsRef?: string;
  requestedAt?: string;
  schedulerHints?: {
    pendingCount?: number;        // total nextActions length (handy for schedulers)
    parallelGroupId?: string;     // present when emitted from ctx.parallel.*
    sleepUntilEpochMs?: number;   // populated for sleep gates
  };
}
```

`schedulerHints` give orchestration loops enough context to decide whether to keep polling (`pendingCount`), correlate batched work (`parallelGroupId`), or defer execution until a future deadline (`sleepUntilEpochMs`). These hints are additive; consumers can ignore fields they do not understand without breaking compatibility.

### 8.3 Commit effect result

```ts
interface CommitEffectResultOptions {
  runDir: string;
  effectId: string;
  result: {
    status: "ok" | "error";
    value?: any;                 // app-specific typed result, if ok
    error?: any;                 // structured error if status=error
    stdout?: string;
    stderr?: string;
  };
}

function commitEffectResult(
  opts: CommitEffectResultOptions
): Promise<void>;
```

Behavior:

* Writes `tasks/<effectId>/result.json` with `value` or normalized error
* Writes `stdout.txt` / `stderr.txt` if provided
* Appends `EFFECT_RESOLVED` event
* Updates `state/state.json` (best-effort)
* Emits a `commit.effect` metric for both success and rejection (`unknown_effect`, `already_resolved`, `invocation_mismatch`, `invalid_payload`, etc.) including whether stdout/stderr artifacts were written.

Error semantics:

* On next replay, `ctx.task(...)` for this invocation will:

  * return `value` if status=`ok`
  * throw an error reconstructed from `error` if status=`error`

User process code can catch these errors and implement its own compensation / recovery.

### 8.4 Lifecycle Hooks

The SDK automatically calls **lifecycle hooks** at key runtime events. Hooks are shell scripts that receive JSON payloads via stdin and can be used for logging, notifications, metrics collection, or custom integrations.

#### Automatic Hook Triggers

The SDK runtime automatically calls the following hooks:

| Hook Type | When Called | Payload |
|-----------|-------------|---------|
| `on-run-start` | After `RUN_CREATED` event in `createRun()` | `{ runId, processId, entry, inputs, timestamp }` |
| `on-iteration-start` | At the start of each `orchestrateIteration()` | `{ runId, iteration, timestamp }` |
| `on-run-complete` | After `RUN_COMPLETED` event | `{ runId, status: "completed", output, duration, timestamp }` |
| `on-run-fail` | After `RUN_FAILED` event | `{ runId, status: "failed", error, duration, timestamp }` |
| `on-iteration-end` | At the end of each iteration (finally block) | `{ runId, iteration, status, timestamp }` |
| `on-task-start` | Before executing a task | `{ runId, effectId, taskId, kind, timestamp }` |
| `on-task-complete` | After task execution completes | `{ runId, effectId, taskId, status, duration, timestamp }` |

#### Hook Discovery

Hooks are discovered in three locations (in priority order):

1. **Per-repo**: `.a5c/hooks/<hook-type>/*.sh` (project-specific)
2. **Per-user**: `~/.config/babysitter/hooks/<hook-type>/*.sh` (user-specific)
3. **Plugin**: `plugins/babysitter/hooks/<hook-type>/*.sh` (default logger hooks)

All matching hooks are executed in order. Hook failures are logged but do not break orchestration.

#### Example: Custom Logging Hook

Create `.a5c/hooks/on-run-complete/notify.sh`:

```bash
#!/bin/bash
set -euo pipefail

PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
STATUS=$(echo "$PAYLOAD" | jq -r '.status')

echo "Run $RUN_ID completed with status: $STATUS"
# Add custom notification logic here
```

Make it executable: `chmod +x .a5c/hooks/on-run-complete/notify.sh`

For complete hook documentation, see `plugins/babysitter/HOOKS.md`.

---

## 9. Examples

### 9.1 Minimal process with a single task

```ts
// process/hello.ts
import { defineTask, type ProcessContext } from "@a5c-ai/babysitter-sdk";

const helloTask = defineTask<
  { name: string },
  { greeting: string }
>("hello", (args, ctx) => {
  const effectId = ctx.effectId;
  return {
    kind: "node",
    title: `Greet ${args.name}`,
    node: {
      entry: "scripts/hello.js",
      args: ["--name", args.name, "--effect-id", effectId],
    },
    io: {
      inputJsonPath: `tasks/${effectId}/input.json`,
      outputJsonPath: `tasks/${effectId}/result.json`,
    },
  };
});

export async function process(inputs: any, ctx: ProcessContext) {
  const result = await ctx.task(helloTask, { name: inputs.name });
  return result.greeting;
}
```

### 9.2 CI pipeline with parallel steps and breakpoint

```ts
// process/ci-pipeline.ts
import {
  defineTask,
  type ProcessContext,
} from "@a5c-ai/babysitter-sdk";

// Assume buildTask, lintTask, testTask, codeReviewAgentTask are defined similarly to above

export async function process(inputs: any, ctx: ProcessContext) {
  const buildResult = await ctx.task(buildTask, { target: "app" }, {
    label: "build:app",
  });

  const [lintResult, testsResult] = await ctx.parallel.all([
    () => ctx.task(lintTask, { files: buildResult.files }, { label: "lint" }),
    () => ctx.task(testTask, { suite: "smoke" }, { label: "tests" }),
  ]);

  if (!lintResult.ok || !testsResult.ok) {
    await ctx.breakpoint({
      reason: "lint/tests failed",
      lintResult,
      testsResult,
    });
  }

  const review = await ctx.task(codeReviewAgentTask, {
    diffRef: buildResult.diffRef,
  }, { label: "code-review" });

  return {
    ok: true,
    reviewSummary: review.summary,
  };
}
```

### 9.3 Sleep gate

```ts
export async function process(inputs: any, ctx: ProcessContext) {
  const now = ctx.now();

  // Don’t do anything before 09:00 UTC today
  const gate = new Date(now);
  gate.setUTCHours(9, 0, 0, 0);

  await ctx.sleepUntil(gate.toISOString());

  return { startedAt: ctx.now().toISOString() };
}
```

On first iteration before 09:00, `sleepUntil` throws a pending effect, and the orchestrator can simply not re-run until a suitable time.

---

## 10. DevEx Considerations

### 10.1 Normal-feeling process code

* Processes look like ordinary async functions.
* Intrinsics return normal values once resolved; exceptions are only used for orchestration control flow.
* There is no need to teach users about generators or continuations.

### 10.2 Strong typing (TS-first)

* `defineTask<TArgs, TResult>` drives the type of `ctx.task(taskFn, args)`.
* The user gets typed autocomplete on task arguments and results.

### 10.3 Debugging and inspection

* Each task has:

  * a stable id (`taskId`)
  * a human label (`label`)
  * a kind (`"node"`, `"breakpoint"`, etc.)
* Journal events are small, typed, and stable; task definitions and results live in separate files.
* A future CLI (`@a5c-ai/babysitter-cli`) can:

  * show “current status” of a run
  * list pending tasks
  * pretty-print the last few events

### 10.4 Safety rails

* Store `processRevision` (hash/commit) in `run.json`.
* On each iteration, compare current process code hash to `processRevision`.
* If it changed, warn or fail-fast (configurable) to avoid silent identity shifts.

### 10.5 Test harness potential

A simple test harness layered on top of the SDK could:

* Run `orchestrateIteration` in a loop until `completed` or a max number of steps.
* Use an in-memory fake runner that resolves tasks based on kind/id (for unit testing process logic without external CLIs).

Example pseudo-API:

```ts
import { runToCompletionWithFakeRunner } from "@a5c-ai/babysitter-sdk/testing";

const { runDir } = await createRun({
  runsDir: tmpDir,
  process: {
    processId: "test/ci",
    importPath: "../process/ci-pipeline.js",
    exportName: "process",
  },
  inputs: { branch: "main" },
});

const result = await runToCompletionWithFakeRunner({
  runDir,
  resolve(action) {
    if (action.kind === "node" && action.taskId === "lint") {
      return { status: "ok", value: { status: "passed" } };
    }
    return undefined; // leave breakpoints/sleeps unresolved
  },
});

if (result.status === "waiting") {
  // inspect result.pending to see which actions remain
}
```

`runToCompletionWithFakeRunner` ships as part of `@a5c-ai/babysitter-sdk/testing` and:

* Accepts a `resolve(action)` callback that returns either `{ status: "ok", value }` or `{ status: "error", error }` (plus optional stdout/stderr/metadata) for actions you want to satisfy deterministically.
* Commits those fake results to the run directory, accumulating a log of executed actions so your tests can assert against them.
* Returns `{ status, output|error, pending, metadata, executed }`, giving you the same high-level surface as the CLI / orchestrator but without invoking real runners.
* Supports safety rails such as `maxIterations` (defaults to 100) and `onIteration` hooks for advanced inspection.

### 10.6 Deterministic docs + CLI walkthrough workflow

To keep the documentation and examples in sync with the shipped runtime/CLI, every edit to `sdk.md`, `README.md`, `docs/cli-examples.md`, or `packages/sdk/src/testing/README.md` should be paired with the deterministic harness jobs below (see `part7_test_plan.md` for the full matrix):

1. **Regenerate CLI walkthroughs**  
   `pnpm --filter @a5c-ai/babysitter-sdk run smoke:cli -- --runs-dir .a5c/runs/docs-cli --record docs/cli-examples/baselines`  
   Stores hashed stdout/JSON outputs under `_ci_artifacts/cli/<platform>/<node>/` so reviewers can diff transcripts.
2. **Compile/execute code fences**  
   `pnpm --filter @a5c-ai/babysitter-sdk run docs:snippets:extract && pnpm --filter @a5c-ai/babysitter-sdk run docs:snippets:tsc`  
   Optional `docs:snippets:test` runs snippets (e.g., fake runner how-tos) against the seeded harness fixtures.
3. **Verify fake-runner docs**  
   `pnpm --filter @a5c-ai/babysitter-sdk run docs:testing-readme` – executes the examples in `packages/sdk/src/testing/README.md`, ensuring `installFixedClock`, `installDeterministicUlids`, and `runToCompletionWithFakeRunner` behave as documented.

All outputs (hashes, logs, manifests) feed CI jobs on Node 18/20 for macOS, Linux, and Windows. The docs map in `README.md` points contributors to the authoritative sections, and `packages/sdk/src/testing/README.md` contains the harness details referenced above.

--- 

## 11. Reasoning Recap

**Why typed exceptions instead of generators/yields?**

* JS generator-based workflows (like some workflow engines) require users to adopt generator syntax and yield effects.
* Here, we keep user code as *plain async/sync functions*; all special behavior is hidden in intrinsics and orchestrateIteration.
* Exceptions naturally unwind to the top-level orchestrator, which is the only place that cares.

**Why event-sourced (per-event files) rather than mutable state?**

* Event sourcing gives a perfect audit log and time-travel behavior.
* Per-event files are extremely git-friendly: minimal conflicts, readable diffs.

**Why tasks-only (agents as tasks)?**

* Uniformity: one primitive covers “shell commands”, “LLM agents”, “human breakpoints”, and “orchestrator-level work”.
* Makes it easy to plug in new runner types without changing the process language.

**Why the replay cursor identity scheme?**

* We need a stable identity per call *occurrence*, not per function.
* The cursor gives deterministic `stepId`s based on execution order, as long as the process code is deterministic.
* Combined with processId + taskId, this is stable and unambiguous for a single run.

**Why external tasks (orchestrator-only dispatch)?**

* Keeps `@a5c-ai/babysitter-sdk` focused: it decides the next action, but doesn’t know how or where tasks run.
* Allows flexible runners: local Node, containers, remote queues, human UIs, etc.

This spec is the foundation for implementing `@a5c-ai/babysitter-sdk` as a small, deterministic, git‑friendly orchestration core with a clean path to richer tooling and CLI support later.

---

## 12. CLI Design — `@a5c-ai/babysitter-cli`

The CLI is the primary way to **interact with intrinsics** (tasks, breakpoints, sleep gates) and to drive runs without writing custom orchestration code.

> Looking for a concrete walkthrough? See [`docs/cli-examples.md`](docs/cli-examples.md) for an end-to-end session that runs `run:create`, `run:iterate`, `task:list`, and `task:post` side-by-side with a deterministic harness.

Binary name (placeholder): `babysitter`

### 12.1 CLI responsibilities

* Create and inspect runs
* Drive orchestration iterations (`orchestrateIteration`) step-by-step or in an automated mode
* Discover pending effects (tasks, breakpoints, etc.)
* Execute tasks using an external runner of your choice, then commit results via `task:post`
* Resolve breakpoints with human input
* Inspect journals, events, and state

### 12.2 Global options

* `--runs-dir <path>`: base directory for runs (default: `./runs`)
* `--cwd <path>`: working directory for process code
* `--json`: output results in JSON for scripting
* `--verbose`: more logging

### 12.3 Run lifecycle commands

#### `babysitter run:create`

Create a new run.

```bash
babysitter run:create \
  --process-id a5c/ci-pipeline \
  --entry ./process/ci-pipeline.js#process \
  --inputs ./inputs/ci-main.json
```

Flags:

* `--process-id <id>`: stable id, stored in `run.json`.
* `--entry <path#export>`: module path plus optional export name (default: `process`).
* `--inputs <path>`: JSON file with initial inputs.
* `--run-id <id>` (optional): override generated run id.
* `--process-revision <rev>` (optional): annotate the run with the runner's git sha, build number, etc.
* `--request <id>` (optional): custom request/correlation id recorded in `run.json` and `RUN_CREATED`.
* `--json`: emit `{"runId","runDir","entry"}` instead of the human log line (see Outputs).

Outputs:

* human mode prints `[run:create] runId=<id> runDir=<absolute path> entry=<importPath#export>`.
* `--json` prints the same data as a single JSON object so automation can parse it reliably.
* initializes `run.json`, `inputs.json`, and `RUN_CREATED` event (metadata includes `processId`, `entrypoint.importPath/exportName`, `layoutVersion`, optional `processRevision`, and `request`).

#### `babysitter run:status <runDir>`

Inspect a run's lifecycle summary: terminal state, the most recent journal entry, and how many effects remain unresolved by kind.

```bash
babysitter run:status runs/2026-01-09-001
```

Human output is always a single line:

```
[run:status] state=<created|waiting|completed|failed> last=<TYPE#SEQ ISO> pending[total]=<n> pending[node]=<x> pending[breakpoint]=<y> ...
```

`state` is derived from the latest `RUN_*` event plus the effect index: `waiting` is emitted while the index reports pending work, `completed` and `failed` reflect the final event type, and `created` is used when only `RUN_CREATED` exists. Terminal lifecycle events (`RUN_COMPLETED`/`RUN_FAILED`) always win even if pending effects remain, so operators can see that the run stopped progressing while still reviewing straggler counts. `last` echoes the event type, padded sequence number, and timestamp for the most recent journal entry (or `none` when a run has no events). `pending[total]` is always present and additional `pending[<kind>]` entries are printed in alphabetical order for every effect kind still waiting.

Status lines also append deterministic metadata pairs emitted by the runtime: `stateVersion=<n>` tracks the derived state revision, `journalHead=<seq#ulid>` identifies the latest event applied to that state, `stateRebuilt=true` appears when the CLI regenerates the cache on the fly, and the existing `pending[...]` rollups summarize unresolved work. These fields mirror what JSON consumers see so humans can correlate consecutive invocations without switching formats.

`--json` emits the machine-readable payload:

```json
{
  "state": "waiting",
  "lastEvent": { "seq": 3, "type": "EFFECT_REQUESTED", "recordedAt": "2026-01-09T10:20:10.111Z", "path": "journal/000003.ABCDEF.json", "data": { "effectId": "ef-node", "kind": "node" } },
  "pendingByKind": { "breakpoint": 1, "node": 2 }
}
```

`lastEvent` becomes `null` for empty journals. Paths are normalized to POSIX separators relative to `<runDir>`.

#### `babysitter run:events <runDir>`

Print the journal history with optional filtering, pagination, and reverse ordering. Each invocation prints a header plus one line per event:

```
[run:events] total=<all events> matching=<after filters> showing=<printed> [filter=<TYPE>] [limit=<n>] [order=desc]
- #000123 EFFECT_REQUESTED 2026-01-09T10:20:10.111Z
- #000124 EFFECT_RESOLVED  2026-01-09T10:20:12.222Z
```

Options:

* `--limit <n>`: cap the number of events that are printed (after filtering and reversing).
* `--reverse`: print events in newest-first order.
* `--filter-type <TYPE>`: case-insensitive filter for a specific journal type such as `EFFECT_REQUESTED`, `RUN_FAILED`, etc.

`--json` emits `{ "events": [ ... ], "metadata": { ... } }` where each entry matches the run status payload (`seq`, `ulid`, `type`, `recordedAt`, `filename`, `path`, `data`). The `metadata` block surfaces the same lifecycle pairs described above (`stateVersion`, `journalHead`, `stateRebuilt`, derived `pending[...]` counts) while the human-readable header continues to log the pagination info (`total`, `matching`, `showing`, filter/ordering hints). The limit, filter, and ordering flags apply before serialization so automation can replay slices deterministically.

If `<runDir>` cannot be read the command exits with code `1` and logs `[run:events] unable to read run metadata at <path>: <reason>` to help identify typos or cleaned-up runs.

#### `babysitter run:iterate <runDir>`

Execute exactly one iteration through the hook-driven orchestration loop. The CLI calls `on-iteration-start`, and if no hooks are configured, falls back to a single `orchestrateIteration` step.

#### `babysitter run:continue <runDir>`

This command has been removed in favor of a simpler model:

* loop `run:iterate` in your own orchestrator
* execute effects externally (hook/worker/agent)
* commit results back into the run with `task:post`

### 12.4 Task interaction commands

These commands operate on pending/resolved **effects** (tasks).

  #### `babysitter task:list <runDir>`
  
  List every effect for a run along with labels, status, and the on-disk files produced by the serializer. Human output starts with `[task:list] total=<n>` (or `pending=<n>` when `--pending` is set) followed by one line per task in the form `- <effectId> [<kind> <status>] <label?> (taskId=<taskId>)`. All file references are rendered as POSIX-relative paths from `<runDir>`, even on Windows.
  
  Options:
  
  * `--runs-dir <path>`: override the base directory used to resolve `<runDir>` (defaults to `.`).
  * `--pending`: only show pending tasks (`status === "requested"`).
  * `--kind <kind>`: filter by kind (e.g. `node`, `breakpoint`, `orchestrator_task`). Combine with `--pending` to home in on work that still needs action.
  * `--json`: emit machine-readable output.
  
  JSON output has the shape:
  
  ```
  {
    "tasks": [
      {
        "effectId": "...",
        "taskId": "...",
        "stepId": "...",
        "status": "requested|resolved_ok|resolved_error",
        "kind": "node|breakpoint|orchestrator_task|sleep|...",
        "label": "auto",
        "labels": ["auto", "..."],
        "taskDefRef": "tasks/<effectId>/task.json",
        "inputsRef": "tasks/<effectId>/inputs.json",
        "resultRef": "tasks/<effectId>/result.json" | null,
        "stdoutRef": "tasks/<effectId>/stdout.log" | null,
        "stderrRef": "tasks/<effectId>/stderr.log" | null,
        "requestedAt": "<iso>",
        "resolvedAt": "<iso | undefined>"
      }
    ]
  }
  ```
  
  Every path uses `/` separators and is relative to `<runDir>` so that callers can safely join the value onto whatever root they are inspecting. When a ref is not yet written it is emitted as `null` so JSON consumers can still rely on the schema.
  
  #### `babysitter task:show <runDir> <effectId>`
  
  Show full TaskDef and status for a specific effect. Human output mirrors the `task:list` header and then prints the associated refs plus pretty-printed JSON for `task.json` and `result.json` (or a `(not yet written)` marker when the task is still pending).
  
  Options:
  
  * `--runs-dir <path>`: override the base directory.
  * `--json`: emit machine-readable output.
  
  JSON output has the shape:
  
  ```
  {
    "effect": <TaskListEntry>,   // same record emitted by task:list --json
    "task": { ...task.json contents... },
    "result": { ...result.json contents... } | null
  }
  ```
  
  As with `task:list`, all refs in `effect` are POSIX-relative to `<runDir>`.
  
  ##### Redaction policy for task payloads
  
  To prevent accidental credential leakage, `task:*` commands never emit raw task/result blobs unless you explicitly opt in. The defaults are:
  
  * Human output (`task:show` without `--json`) prints `payloads: redacted (set BABYSITTER_ALLOW_SECRET_LOGS=true and rerun with --json --verbose to view task/result blobs)` plus the artifact refs so you can fetch the files manually.
  * JSON output always sets `task` and `result` to `null` unless redaction is disabled.
  
  Payloads become visible only when **all** of the following are true:
  
  1. You invoke `task:show` with both `--json` and `--verbose` (the guard intentionally keeps human-mode output redacted).
  2. `BABYSITTER_ALLOW_SECRET_LOGS` is set to a truthy value such as `true` or `1` in the CLI environment.
  
  When the guard is satisfied, the CLI returns the literal `task.json` and `result.json` contents inline so security reviewers or forensics tooling can reason about sensitive operations without re-reading the artifacts from disk. Any other combination falls back to redacted output.

#### `babysitter task:post <runDir> <effectId>`

Commit/post a task result after it was executed externally. The CLI validates that the effect exists and is still `status="requested"`, then appends `EFFECT_RESOLVED` + writes `tasks/<effectId>/result.json`.

Human output logs `[task:post] status=<ok|error>` followed by stdout/stderr/result refs (when present). `--json` returns `{ status, committed, stdoutRef, stderrRef, resultRef }`. Exit codes follow the status: `ok` returns `0`, while `error` returns `1`. `--dry-run` returns `status=skipped` and makes no on-disk changes.

Options:

* `--runs-dir <path>`: base runs directory (default current working dir)
* `--status <ok|error>`: required status for the posted result
* `--value <file>`: JSON file containing the value payload (for `--status ok`)
* `--error <file>`: JSON file containing `{name,message,stack?,data?}` (for `--status error`)
* `--stdout-ref <ref>` / `--stderr-ref <ref>`: point at already-written log files (run-relative refs)
* `--stdout-file <file>` / `--stderr-file <file>`: inline log contents from a file (CLI will write them under `tasks/<effectId>/`)
* `--metadata <file>`: JSON metadata attached to the result
* `--invocation-key <key>`: optional safety check (defaults to the effect's invocationKey)
* `--dry-run`, `--json`

### 12.5 Breakpoint interaction commands

Breakpoints are represented as tasks with `kind="breakpoint"`.

#### `babysitter breakpoint:list <runDir>`

Shortcut for `task:list --kind breakpoint --pending`.

#### `babysitter breakpoint:resolve <runDir> <effectId>`

Resolve a breakpoint by providing an answer.

Options:

* `--answer-json <path>`: JSON file containing answer payload
* `--answer '<json>'`: inline JSON

Behavior:

* writes `result.json` under `tasks/<effectId>/`
* appends `EFFECT_RESOLVED` with `status="ok"`

### 12.6 Sleep and scheduling commands

Sleep gates are represented as pending effects with a scheduled timestamp.

#### `babysitter sleep:list <runDir>`

List sleep gates (effects of kind `sleep` / `SLEEP_UNTIL`), showing:

* `effectId`
* `until` timestamp
* whether `now >= until`

#### `babysitter run:wake <runDir>`

Force a `run:iterate` even if no scheduler exists.

Options:

* `--now <iso>` for deterministic behavior

### 12.7 Higher-level commands (future)

Potential future commands for richer DevEx:

* `babysitter run:diff <runDir>`: show diff between two points in a run’s journal.
* `babysitter run:timeline <runDir>`: textual timeline of tasks and their durations.
* `babysitter run:inspect <runDir>`: interactive TUI for inspecting tasks, breakpoints, and results.

---

## 13. Ambient API & Decorators for Better DevEx

The previous sections used `ctx.task` / `ctx.sleepUntil` to emphasize mechanics. For developer experience, `@a5c-ai/babysitter-sdk` also exposes an **ambient API** that removes the need to thread `ctx` through process code.

### 13.1 Ambient run context

At orchestration time, the SDK establishes an ambient context (internally, via something like Node’s `AsyncLocalStorage` or equivalent). Within that context:

* Decorated task functions know how to talk to the current run.
* Helper intrinsics like `sleepUntil` and `breakpoint` can be imported as normal functions.

Outside of an orchestrated run (e.g. in unit tests or ad‑hoc scripts), these functions can:

* either execute in a “direct mode” (actually run the Node scripts), or
* throw a clear error explaining that they must be called under a run.

The exact behavior can be configurable.

The runtime exports explicit helpers for managing this scope:

* `withProcessContext(internalCtx, fn)` sets up the AsyncLocalStorage scope before invoking `fn` and always tears it down afterwards (even if `fn` throws).
* `getActiveProcessContext()` returns the current ambient context or `undefined` if none is active.
* `requireProcessContext()` returns the current context or throws `MissingProcessContextError` so callers get a deterministic failure instead of silently running outside a run.

These helpers are exported from `@a5c-ai/babysitter-sdk` and enable downstream code to call intrinsics (or helper decorators) without manually threading `ctx` through every function.

### 13.2 Task decorator-style API

Instead of writing `ctx.task(taskFn, args)`, a developer can import `task` once and define callables that automatically integrate with the orchestration machinery.

```ts
import { task, sleepUntil, breakpoint } from "@a5c-ai/babysitter-sdk";

// Define a task that produces a TaskDef
export const build = task<
  { target: string },
  { files: string[]; diffRef: string }
>("build", (args, tctx) => {
  const effectId = tctx.effectId;
  return {
    kind: "node",
    title: `Build ${args.target}`,
    node: {
      entry: "scripts/build.js",
      args: ["--target", args.target, "--effect-id", effectId],
    },
    io: {
      inputJsonPath: `tasks/${effectId}/input.json`,
      outputJsonPath: `tasks/${effectId}/result.json`,
    },
  };
});

// Process code can call build() directly, without ctx.task
export async function process(inputs: any) {
  const buildResult = await build({ target: "app" });

  const [lintResult, testsResult] = await Promise.all([
    lint({ files: buildResult.files }),
    tests({ suite: "smoke" }),
  ]);

  if (!lintResult.ok || !testsResult.ok) {
    await breakpoint({ reason: "lint/tests failed" });
  }

  await sleepUntil(new Date(Date.now() + 5000).toISOString());

  return { ok: true };
}
```

Here:

* `task(id, impl)` returns a callable function that, when called under orchestration, uses the ambient context to behave like `ctx.task`.
* `lint` and `tests` can be defined the same way.

Internally, `task(...)` is sugar over `defineTask` + an ambient-aware call wrapper.

### 13.3 Sleep and breakpoint as top-level functions

To remove the need for `ctx.sleepUntil` and `ctx.breakpoint`, the SDK exports ambient-aware helpers:

```ts
import { sleepUntil, breakpoint } from "@a5c-ai/babysitter-sdk";

export async function process(inputs: any) {
  await sleepUntil("2026-01-10T09:00:00.000Z");

  await breakpoint({ message: "Inspect inputs and approve" });

  // ...
}
```

Implementation concept:

* When called, `sleepUntil` looks up the current ambient run context.
* If found, it behaves exactly like `ctx.sleepUntil` (including typed exceptions for pending gates).
* If not found, behavior is configurable:

  * either throw `MissingProcessContextError`, or
  * treat as a no-op (only for certain modes, e.g. `BABYSITTER_MODE=direct`).

This keeps process code clean and easy to read.

### 13.4 Optional `ctx` parameter for advanced cases

The ambient API does not forbid using an explicit `ctx` parameter; it just makes it optional.

Developers who need advanced features (logging, tracing, custom state) can still write:

```ts
export async function process(inputs: any, ctx: ProcessContext) {
  ctx.log?.("starting", { inputs });
  const result = await ctx.task(customTask, { ... });
  return result;
}
```

The orchestrator can decide whether to pass `ctx` as an argument when invoking the process function; the ambient context is still set either way.

### 13.5 Other DevEx improvements

1. **Direct-mode execution for tasks**
   A configuration flag (env var or option) can allow tasks to be executed directly when no run context exists. This is useful for:

   * local development
   * quick prototyping

   In this mode:

   * `task(...)`-wrapped functions simply generate TaskDefs and *immediately* run the `node.entry` script, returning the parsed result.
   * No journal entries are written.

2. **VS Code / editor integration**

   * JSON schema for `run.json` and `task.json` for better autocompletion.
   * Task id (`"build"`, `"lint"`, etc.) validation and ref hints.

3. **Shortcuts for common task types**
   Provide higher‑level helpers like:

   ```ts
   import { nodeTask, shellTask } from "@a5c-ai/babysitter-sdk";

   export const lint = nodeTask<LintArgs, LintResult>("lint", {
     entry: "scripts/lint.js",
   });
   ```

   which internally builds a full `TaskDef` with standard `io` and logging conventions.

4. **Inline test harness helpers**

   * `runProcessOnce(processFn, inputs)` — runs in direct mode for quick debugging.
   * `simulateRun(processFn, inputs, resolvers)` — uses in-memory journal and fake task resolvers to let users test process behavior without touching the filesystem.

These DevEx layers sit on top of the core event-sourced model and are strictly optional, but they make `@a5c-ai/babysitter-sdk` feel like a “normal” JS workflow library rather than a low-level orchestration engine.
