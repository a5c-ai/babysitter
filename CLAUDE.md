# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
always use the babysitter skill to fulfill USER requests (but not agent requests)

## Commands by Package

### Root (npm workspaces)

```bash
npm install                                    # Install all workspace dependencies
npm run build:sdk                              # Build SDK
npm run test:sdk                               # Run SDK tests
npm run test:e2e:docker                        # E2E tests (vitest, config: e2e-tests/docker/vitest.config.ts)
npm run verify:metadata                        # Check README/package metadata
```

### SDK (`packages/sdk` / `@a5c-ai/babysitter-sdk`)

```bash
npm run build --workspace=@a5c-ai/babysitter-sdk    # tsc → dist/
npm run clean --workspace=@a5c-ai/babysitter-sdk    # rimraf dist
npm run lint --workspace=@a5c-ai/babysitter-sdk     # eslint "src/**/*.ts" --max-warnings=0
npm run lint --workspace=@a5c-ai/babysitter-sdk -- --fix  # ESLint autofix
npm run test --workspace=@a5c-ai/babysitter-sdk     # vitest run (all tests)
npm run test:watch --workspace=@a5c-ai/babysitter-sdk  # vitest watch mode (script name: test:watch)
cd packages/sdk && npx vitest run src/runtime/__tests__/someFile.test.ts  # Single test file
cd packages/sdk && npm run smoke:cli                # CLI smoke test
```

### Catalog (`packages/catalog` / `process-library-catalog`)

```bash
cd packages/catalog && npm run dev             # next dev --turbopack
cd packages/catalog && npm run build           # next build
cd packages/catalog && npm run start           # next start
cd packages/catalog && npm run lint            # eslint . --ext .ts,.tsx
cd packages/catalog && npm run lint:fix        # eslint --fix
cd packages/catalog && npm run format          # prettier --write .
cd packages/catalog && npm run format:check    # prettier --check .
cd packages/catalog && npm run type-check      # tsc --noEmit
cd packages/catalog && npm run reindex         # Rebuild process index from definitions
cd packages/catalog && npm run reindex:force   # Force full reindex
cd packages/catalog && npm run reindex:reset   # Reset and reindex with stats
```

### VS Code Extension (`packages/vscode-extension` / `babysitter-vscode`)

```bash
cd packages/vscode-extension && npm run build        # clean + tsc (also runs as vscode:prepublish lifecycle)
cd packages/vscode-extension && npm run clean        # rm -rf dist
cd packages/vscode-extension && npm run watch        # tsc --watch
cd packages/vscode-extension && npm run lint         # eslint . --ext .ts
cd packages/vscode-extension && npm run format       # prettier --write .
cd packages/vscode-extension && npm run format:check # prettier --check .
cd packages/vscode-extension && npm run package      # Create .vsix via vsce
cd packages/vscode-extension && npm test             # Build + unit + extension tests
cd packages/vscode-extension && npm run test:unit    # Build + mocha unit tests only
cd packages/vscode-extension && npm run test:unit:compiled   # Mocha unit tests (skip build, requires prior build)
cd packages/vscode-extension && npm run test:extension  # Build + extension tests only
cd packages/vscode-extension && npm run test:extension:compiled  # Extension tests (skip build, requires prior build)
cd packages/vscode-extension && npm run test:ci      # Headless CI (unit + extension)
cd packages/vscode-extension && npx mocha --ui tdd dist/unit/path/to/file.test.js  # Single unit test (must be compiled)
```

### E2E Tests (`e2e-tests/docker/`)

```bash
npm run test:e2e:docker    # vitest run --config e2e-tests/docker/vitest.config.ts
```

Config: `testTimeout: 30000`, `hookTimeout: 300000`, `fileParallelism: false`, JSON results to `e2e-artifacts/test-results.json`.

## Monorepo Packages

| Package | npm name | Role |
|---------|----------|------|
| `packages/sdk` | `@a5c-ai/babysitter-sdk` | Core: runtime, storage, tasks, CLI, hooks, testing, config. CJS. |
| `packages/babysitter` | `@a5c-ai/babysitter` | Metapackage re-exporting SDK. Provides `babysitter` CLI. |
| `packages/catalog` | `process-library-catalog` | Next.js 16 app (React 19, SQLite, Radix UI, Tailwind). |
| `packages/vscode-extension` | `babysitter-vscode` | VS Code extension for dispatching/monitoring runs. Mocha tests. |

## SDK Architecture (`packages/sdk/src/`)

- **`runtime/`** — `createRun`, `orchestrateIteration`, `commitEffectResult`, replay engine (`runtime/replay/`), `ReplayCursor` (generates sequential step IDs `S000001`, `S000002`... for deterministic replay positioning), processContext (`createProcessContext`, `withProcessContext`, `getActiveProcessContext`, `requireProcessContext` — AsyncLocalStorage-based), exceptions (`EffectRequestedError`, `EffectPendingError`, `ParallelPendingError`, `RunFailedError`), error utilities (`BabysitterRuntimeError`, `ErrorCategory` enum: Configuration/Validation/Runtime/External/Internal, `formatErrorWithContext`, `toStructuredError`, `suggestCommand`), state cache helpers (`STATE_CACHE_SCHEMA_VERSION`, `createStateCacheSnapshot`, `readStateCache`, `writeStateCache`, `rebuildStateCache`, `journalHeadsEqual`, `normalizeJournalHead`, `normalizeSnapshot`), `hashInvocationKey`, `replaySchemaVersion`.
- **`storage/`** — `createRunDir`, `appendEvent`, `loadJournal`, `snapshotState`, `storeTaskArtifacts`, run locking (`acquireRunLock`/`releaseRunLock`/`readRunLock`), run file I/O (`readRunMetadata`, `readRunInputs`, `writeRunOutput`), task file I/O (`writeTaskDefinition`, `readTaskDefinition`, `readTaskResult`, `writeTaskResult`), `getDiskUsage`/`findOrphanedBlobs`, atomic writes.
- **`tasks/`** — `defineTask<TArgs, TResult>(id, impl, options)`. `TaskDef` descriptor with `kind`, `title`, `labels`, `io`, built-in kinds: `node`, `breakpoint`, `orchestrator_task`, `sleep`. Custom kinds extensible via `[key: string]: unknown`. `TaskBuildContext` provides `effectId`, `invocationKey`, `taskId`, `runId`, `runDir`, `taskDir`, `createBlobRef`, `toTaskRelativePath`. Sub-modules: **serializer** (`TASK_SCHEMA_VERSION: '2026.01.tasks-v1'`, `RESULT_SCHEMA_VERSION: '2026.01.results-v1'`, `BLOB_THRESHOLD_BYTES: 1 MiB` — payloads over 1 MiB are stored as blobs), **registry** (`RegisteredTaskDefinition`, `RegistryEffectRecord`), **batching** (`buildParallelBatch` deduplicates effects by effectId, `ParallelBatch`, `BatchedEffectSummary`).
- **`cli/`** — Commands: `run:create|status|events|rebuild-state|repair-journal|iterate`, `task:post|list|show`, `session:init|associate|resume|state|update|check-iteration`, `skill:discover|fetch-remote`, `health`, `configure`, `version`. Global flags: `--runs-dir`, `--json`, `--dry-run`, `--verbose`, `--show-config`, `--help`/`-h`, `--version`/`-v`.
- **`hooks/`** — 13 hook types: `on-run-start`, `on-run-complete`, `on-run-fail`, `on-task-start`, `on-task-complete`, `on-step-dispatch`, `on-iteration-start`, `on-iteration-end`, `on-breakpoint`, `pre-commit`, `pre-branch`, `post-planning`, `on-score`. Dispatcher: `callHook(hookType, payload, options)`.
- **`testing/`** — `runHarness` for deterministic execution with snapshots.
- **`config/`** — Environment variable resolution with defaults.
- **`index.ts`** — Public API re-exports: `runtime`, `runtime/types`, `storage`, `storage/types`, `tasks`, `cli/main`, `testing`, `hooks`, `config`.

## Orchestration Flow (cross-file pattern)

This is the core multi-file execution flow — not obvious from any single file:

1. **`withRunLock`** (`storage/lock.ts`) acquires exclusive `run.lock` (wx flag, 40 retries at 250ms, stores pid/owner/acquiredAt).
2. **`createReplayEngine`** (`runtime/replay/`) reads `run.json` metadata, builds effect index from journal, resolves state cache, initializes `ReplayCursor` (tracks step position via sequential `S000001`-style IDs for deterministic replay).
3. **Dynamic import** of process function (`orchestrateIteration.ts`).
4. **`callHook('on-iteration-start')`** (`hooks/dispatcher.ts`).
5. **`withProcessContext(execute)`** (`runtime/processContext.ts`) — wraps execution in AsyncLocalStorage context.
6. Process calls `ctx.task()` → replay engine checks effect index → returns cached result if resolved, otherwise throws `EffectRequestedError`.
7. **Outcomes**: success → `writeRunOutput` + `RUN_COMPLETED` event + `on-run-complete` hook | waiting → return pending actions | failure → `RUN_FAILED` event + `on-run-fail` hook.
8. **`callHook('on-iteration-end')`**.
9. **Release lock**.

## Effects Model

Process functions request effects via `ProcessContext` intrinsics:
- `ctx.task()` — dispatch a typed task
- `ctx.breakpoint()` — human approval gate
- `ctx.sleepUntil()` — time-based pause
- `ctx.orchestratorTask()` — delegate to orchestrator
- `ctx.hook()` — invoke a lifecycle hook
- `ctx.parallel.all()` / `ctx.parallel.map()` — concurrent effect dispatch

**Execution cycle**: On invocation, the replay engine checks the effect index. If the effect is resolved, the cached result is returned instantly. If not, an `EffectRequestedError` (or `EffectPendingError`/`ParallelPendingError`) is thrown. The orchestrator catches the exception, extracts pending actions, executes them externally, and posts results via `task:post` CLI. `task:post` writes `result.json` and appends `EFFECT_RESOLVED` to the journal. The next iteration replays all resolved effects.

**Invocation key**: SHA256 of `processId:stepId:taskId` — used to deduplicate and index effects.

## Run Directory Layout

```
.a5c/runs/<runId>/
├── run.json            # Metadata: runId, processId, entrypoint, layoutVersion, createdAt, prompt
├── inputs.json         # Process inputs
├── run.lock            # Exclusive lock: { pid, owner, acquiredAt }
├── journal/            # Append-only event log
│   ├── 000001.<ulid>.json
│   ├── 000002.<ulid>.json
│   └── ...
├── tasks/<effectId>/   # Per-task artifacts
│   ├── task.json       # Task definition
│   ├── result.json     # Task result
│   ├── stdout.txt
│   ├── stderr.txt
│   └── blobs/
├── state/
│   └── state.json      # Derived replay cache (gitignored)
├── blobs/              # Large content store
└── process/            # Optional process snapshot
```

## Journal Event Types

All events have `{ type, recordedAt, data, checksum }` where checksum is SHA256.

| Event | Description |
|-------|-------------|
| `RUN_CREATED` | Run initialized with metadata and inputs |
| `EFFECT_REQUESTED` | Process requested an effect (task, breakpoint, sleep) |
| `EFFECT_RESOLVED` | External result posted for a pending effect |
| `RUN_COMPLETED` | Process finished successfully |
| `RUN_FAILED` | Process terminated with error |

## State Cache

Schema version: `2026.01.state-cache`. Structure: `schemaVersion`, `savedAt`, `journalHead` (seq+ulid+checksum), `stateVersion`, `effectsByInvocation`, `pendingEffectsByKind`. Rebuilt automatically when missing, corrupt, or journal head mismatches. Gitignored (derived data).

## Atomic Write Protocol

Temp file (`target.tmp-<pid>-<timestamp>`) → write + fsync → rename → sync parent dir → 3 retries on `EBUSY`/`ETXTBSY`/`EPERM`/`EACCES`.

## Process Definitions

Process definitions are JS files exporting `async function process(inputs, ctx) { ... }` with tasks defined via `defineTask<TArgs, TResult>(id, impl, options)`. Located in `plugins/babysitter/skills/babysit/process/`:

- `methodologies/` — Reusable process patterns (TDD, agile, spec-driven, self-assessment, evolutionary, domain-driven, etc.)
- `gsd/` — "Get Stuff Done" phases (new-project, discuss, plan, execute, verify, audit, map-codebase, iterative-convergence)
- `specializations/domains/` — Domain-specific processes organized by category (science, business, social-sciences-humanities) with subdirectories per specialization
- `examples/` — Example JSON inputs for process runs

Project-level reusable processes go in `.a5c/processes/`.

## TypeScript Conventions

- **SDK tsconfig**: ES2022 target, CommonJS, strict, node moduleResolution, declaration + declarationMap, rootDir=src, outDir=dist, `__tests__` excluded from build.
- **VS Code extension tsconfig**: ES2022 target, CommonJS, strict, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, sourceMap, types: `[node, vscode, mocha]`.
- **SDK ESLint** (`.eslintrc.cjs`): extends `eslint:recommended` + `@typescript-eslint/recommended-type-checked`. Unused vars with `_` prefix allowed. Ignores `dist/` and `__tests__/`.
- **VS Code extension ESLint** (`.eslintrc.cjs`): same as SDK plus `plugin:prettier/recommended` (Prettier integration, `prettier/prettier: error`). Mocha env enabled. Ignores `dist/`, `node_modules/`, `packages/`.
- **Catalog ESLint** (`eslint.config.mjs`): Flat config using `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. Ignores `.next/`, `out/`, `build/`, `next-env.d.ts`.

## Cross-Package Rules

- Import workspace packages by name (`@a5c-ai/babysitter-sdk`), never relative paths across package boundaries.
- No `any` types — convention enforced by code review (not by ESLint rule); use `unknown` and narrow.
- No floating promises — always await or handle.
- No circular dependencies between packages.
- Event sourcing patterns for all state changes in SDK.
- Unused variables prefixed with `_` (ESLint enforced).
- Test files use `*.test.ts` naming, co-located in `__tests__/` directories.

## Release Tooling (`scripts/`)

- **`bump-version.mjs`** — Detects `#major`/`#minor` from commit messages (else `patch`). Bumps version in ALL `package.json` files, plugin manifests, and `marketplace.json` synchronously.
- **`release-notes.mjs`** — Extracts latest version section from `CHANGELOG.md`.
- **`rollback-release.sh`** — Deletes GitHub release + tag, removes tag from remote.

## Claude Code Hooks (`.claude/settings.json`)

- **Enabled plugins**: `babysitter@a5c.ai`, `plugin-dev@claude-plugins-official`, `context7@claude-plugins-official`.
- **PostToolUse** (Edit|Write on `.ts` files): Auto-runs `npm run lint --workspace=@a5c-ai/babysitter-sdk -- --fix` from repo root. Failures are suppressed.
- **PreToolUse** (Edit|Write on `package-lock.json` or `pnpm-lock.yaml`): **BLOCKED** — lock files must not be edited directly; use npm/pnpm commands instead.

## Claude Code Agents (`.claude/agents/`)

- **`code-reviewer.md`** — Reviews TypeScript changes for type safety, monorepo consistency, SDK patterns, VS Code extension patterns, error handling, and testing. Checklist includes: no `any` escapes, no floating promises, workspace imports only, no circular deps, disposable tracking in VS Code, meaningful tests. Output format: issues with file:line references and severity levels.
- **`sdk-api-documenter.md`** — Generates and validates documentation for SDK CLI commands and exported APIs.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BABYSITTER_RUNS_DIR` | `.a5c/runs` | Root directory for run storage |
| `BABYSITTER_MAX_ITERATIONS` | `256` | Maximum orchestration iterations per run |
| `BABYSITTER_QUALITY_THRESHOLD` | `80` | Minimum quality score to pass |
| `BABYSITTER_TIMEOUT` | `120000` (2min) | General operation timeout in ms |
| `BABYSITTER_LOG_LEVEL` | `info` | Logging verbosity |
| `BABYSITTER_ALLOW_SECRET_LOGS` | `false` | Allow secrets in log output |
| `BABYSITTER_HOOK_TIMEOUT` | `30000` (30s) | Per-hook execution timeout in ms |
| `BABYSITTER_NODE_TASK_TIMEOUT` | `900000` (15min) | Node task execution timeout in ms |
