# Runtime And Layout

This page is the short runtime model for contributors who need to reason about replay, run state, or journal repair.

## Deterministic Replay Loop

The core orchestration flow spans the SDK runtime and storage layers:

1. Acquire `run.lock`.
2. Build the replay engine from `run.json`, the journal, and the derived state cache.
3. Import the process entrypoint.
4. Run the process inside `withProcessContext(...)`.
5. When the process requests an unresolved effect, the runtime throws an effect-pending exception instead of executing side effects inline.
6. External orchestration resolves effects and posts results through `babysitter task:post`.
7. The next iteration replays resolved effects and advances deterministically.

Relevant source roots:

- [`packages/sdk/src/runtime/`](../../packages/sdk/src/runtime)
- [`packages/sdk/src/storage/`](../../packages/sdk/src/storage)
- [`packages/sdk/src/tasks/`](../../packages/sdk/src/tasks)

## Run Directory Layout

Default layout under the active runs root:

```text
<runsRoot>/<runId>/
├── run.json
├── inputs.json
├── run.lock
├── journal/
├── tasks/<effectId>/
├── state/state.json
├── blobs/
└── process/
```

Use the active runs root from [Command Surfaces](./command-surfaces.md): global `~/.a5c/runs` by default, repo-local only when configured or when probing legacy runs.

## Bare Runs and Process Assignment

A run can be created without `--entry`, producing a **bare run** whose `entrypoint.importPath` is `"bare-run"`. Bare runs reserve a run directory and journal but cannot be iterated until a process is attached.

To attach a process, use:

```bash
babysitter run:assign-process <runDir> --entry <path>#<export> [--process-id <id>] --json
```

This updates `run.json` via `writeRunMetadata()` and appends a `PROCESS_ASSIGNED` journal event. After assignment the run can proceed through normal `run:iterate` cycles. The `orchestrateIteration` runtime guards against iterating a bare run that has not yet been assigned a process.

The `instructions:babysit-skill` command dynamically reports existing bare runs so that the orchestrating agent can decide whether to assign a process or create a new run.

## Journal Event Model

The event stream is append-only and centers on:

- `RUN_CREATED`
- `PROCESS_ASSIGNED`
- `EFFECT_REQUESTED`
- `EFFECT_RESOLVED`
- `RUN_COMPLETED`
- `RUN_HALTED`
- `RUN_FAILED`
- `PROCESS_RUNTIME_ERROR`

The state cache is derived data. If it drifts from the journal, repair with `run:rebuild-state`. If process code threw and the journal contains `PROCESS_RUNTIME_ERROR`, use `run:recover-process-error` to clear that typed marker and optionally patch the offending task result. If journal entries are malformed or partially written, use `run:repair-journal` carefully after inspecting the affected run. If external verification proves a divergent run should be sealed rather than repaired, use `run:halt <runDir> --reason <text>`; it appends one audited terminal event through the journal API and rebuilds state with reason `manual_seal`.

## Effects

Processes request work through `ProcessContext` intrinsics such as:

- `ctx.task()`
- `ctx.breakpoint()`
- `ctx.sleepUntil()`
- `ctx.orchestratorTask()`
- `ctx.hook()`
- `ctx.onCleanup()`
- `ctx.parallel.all()` and `ctx.parallel.map()`

Those APIs are part of the SDK runtime contract, not ad hoc process behavior. Changes here need replay, serialization, and state-cache discipline.

Use `ctx.onCleanup()` for process-local scratch cleanup such as removing
`/tmp/<descriptive-name>/` clones. Cleanup callbacks are functions, so they must
remain in runtime memory only and must not be serialized into task definitions,
journals, or state cache entries.

Subagent scratch work must not live under `<runDir>/work`. Runtime task
resolution emits a non-destructive warning when `<runDir>/work` exists and is
non-empty; the SDK reports the leak but does not delete user data.
