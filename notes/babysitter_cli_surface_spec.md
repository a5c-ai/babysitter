Babysitter CLI Surface Spec (cli_tool)
======================================

Scope & Intent
--------------
- Define the external CLI (`babysitter`) that ships with `@a5c-ai/babysitter-sdk` and gives humans or automation a thin, deterministic shell around run folders produced by the SDK.
- Cover the commands already sketched in `sdk.md §12` and implemented in `packages/sdk/src/cli/*`: run lifecycle inspection, deterministic orchestration loops, task introspection/execution, and state-repair utilities.
- Keep the interface consistent across macOS, Linux, and Windows shells, honoring `cli_tool` domain guardrails (stable flags/defaults, explicit config precedence, and no sensitive payloads echoed to stdout).

Behavior
--------
1. **Global invocation**
   - Binary name `babysitter`. Subcommands follow `babysitter <area>:<verb>` (e.g., `run:continue`).
   - Supported top-level flags on every command: `--runs-dir <path>` (default `.`), `--json`, `--dry-run` (commands that mutate state must honor it), and `--verbose` (when set, log filesystem paths and resolved options to stderr).
   - Exit codes: `0` for success, `1` for expected user errors (bad args, missing run), `>1` for unexpected crashes. `--json` never changes exit semantics.
   - All paths returned to the user are normalized to POSIX separators relative to `<runDir>` even on Windows; CLI accepts either slash style as input.

2. **Run lifecycle management**
   - `run:create` writes `run.json`, optional `inputs.json`, and appends `RUN_CREATED` via the runtime API. Required flags: `--process-id`, `--entry`. Optional `--inputs`, `--run-id`, `--process-revision`, `--request`.
   - `run:status` prints `[run:status] state=<created|waiting|completed|failed> last=<TYPE#SEQ ISO> pending[...]` plus one line per pending kind; JSON mirrors `{ state, lastEvent, pendingByKind }`. Works even if journal/state files are missing by treating them as empty.
   - `run:events` streams journal entries with `--limit`, `--reverse`, `--filter-type`, and `--json`. Missing run directory or unreadable event files emit a single error line and exit `1`.
   - `run:rebuild-state` (surface for `rebuildStateCache`) locks the run, replays the journal, writes `state/state.json`, and prints/returns the rebuild reason, event counts, and resulting `stateVersion`.

3. **Orchestration control loops**
   - `run:continue` was removed; callers should loop `run:iterate`, execute pending effects externally, and commit via `task:post`.

4. **Task introspection and execution**
   - `task:list` reads the effect index and prints `- <effectId> [<kind> <status>] <label?> (taskId=<taskId>)`. Flags: `--pending`, `--kind`. JSON payload is `{ tasks: TaskListEntry[] }` where every entry includes refs for task/result/stdout/stderr with POSIX paths.
   - `task:show` pretty-prints `task.json` and `result.json` (or `(not yet written)` if pending) and mirrors the list entry in JSON mode.
   - `task:post` commits externally produced results for any effect kind. It validates the effect is still `requested`, writes `tasks/<effectId>/result.json`, and appends `EFFECT_RESOLVED` via `commitEffectResult`. `--dry-run` previews the mutation without committing. JSON response includes `{ status, committed, stdoutRef, stderrRef, resultRef }`.
   - Manual breakpoint resolution stays manual: `task:list` highlights `kind="breakpoint"`. Dedicated `breakpoint:resolve`/`sleep:list` commands are tracked separately and are not required to ship with this part.

5. **Output and UX conventions**
   - Human text is intentionally terse (single-line headers with prefixed command ids) for easy parsing in CI logs.
   - `--json` outputs single JSON documents (no streams) so scripts can `jq` them. All timestamps are ISO8601 strings, numbers stay numeric.
   - Errors include the command prefix, the resolved `<runDir>`, and the underlying message (`[run:events] unable to read run metadata at ...`). `--verbose` adds stack traces.
   - Secrets from task definitions are never echoed: CLI logs file refs instead of dumping blobs/result payloads unless `--verbose` is paired with `--json` and `BABYSITTER_ALLOW_SECRET_LOGS=true`.

Acceptance Criteria
-------------------
1. **Flag & path consistency** – Every command honors `--runs-dir`, validates required positional args, and prints actionable errors with non-zero exit codes when resolution fails. Tests cover Windows-style and POSIX-style inputs.
2. **Deterministic JSON contracts** – `run:create`, `run:status`, `run:events`, `run:iterate`, `task:list`, `task:show`, and `task:post` emit the schemas described above; snapshot tests guard against accidental drift.
3. **Safe automation loops** – orchestration loops are owned by the caller (skill/hook/worker). The CLI provides deterministic primitives (`run:iterate`, `task:list`, `task:post`) and never embeds task-execution policy.
4. **State repair tooling** – `run:rebuild-state` rebuilds derived state when `state/state.json` is missing or stale and reports the rebuild result in both human and JSON modes. Subsequent `run:status` reflects the rebuilt `stateVersion`.
5. **Process integration** – CLI surfaces are thin wrappers over runtime APIs (`createRun`, `orchestrateIteration`, `commitEffectResult`, `rebuildStateCache`). Unit tests stub these APIs to ensure argument translation and error propagation are correct.
6. **Documentation & help** – `babysitter --help` (or bare invocation) prints the usage block with all commands/flags. README/sdk.md tables stay in sync with the implementation.

Edge Cases
----------
- Missing or deleted run directories: commands fail fast with `[command] unable to read run metadata` and exit `1`.
- Empty journals: `run:status` reports `created` with `last=none` and `pending[total]=0`; `run:events --json` returns an empty array.
- Task output blobs larger than 1 MiB: `task:list` and `task:show` print refs to blob files rather than dumping whole payloads; `task:post --json` points to `stdoutRef`, `stderrRef`, and `resultRef`.
- Windows drive letters and UNC paths: `--runs-dir` and `<runDir>` may include drive prefixes; CLI resolves them but continues to emit POSIX-style refs in JSON/logs.

Non-Goals
---------
- Implementing interactive TUIs, dashboards, or VS Code surfaces (handled elsewhere in Babysitter).
- Remote/distributed task execution backends; CLI focuses on run iteration + result commits, not execution.
- New intrinsic kinds or scheduler policies; CLI simply reflects what the runtime reports.
- Packaging/distribution mechanics (npm publish, Homebrew formulas) and telemetry collection—tracked in separate operational docs.
- Auto-resolving breakpoints, orchestrator tasks, or sleep gates in this part; those require explicit manual commands or future automation.
