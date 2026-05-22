# Changelog

All notable changes to `@a5c-ai/agent-mux` are recorded here. Dates are ISO-8601.

## Unreleased

### Added

- **Real subprocess spawning** in `client.run()`. The run pipeline is implemented in `packages/core/src/spawn-runner.ts` and wires the adapter's `buildSpawnArgs()` + `parseEvent()` into a live `child_process` pipeline with retry, startup/inactivity/overall timeouts, and two-phase abort (SIGTERM -> SIGKILL).
- **Invocation modes** — `LocalInvocation | DockerInvocation | SshInvocation | K8sInvocation` discriminated union on `RunOptions.invocation`. A pure `buildInvocationCommand()` in `packages/core/src/spawn-invocation.ts` translates a `SpawnArgs` into the host command for each mode. See [docs/13-invocation-modes.md](docs/13-invocation-modes.md).
- **Harness image catalog** (`HARNESS_IMAGE_CATALOG`, `lookupHarnessImage()`) giving default Docker images for the 11 built-in harnesses plus aider/goose.
- **`install()` / `update()` / `detectInstallation()`** optional methods on `AgentAdapter`, with `AdapterInstallOptions`, `AdapterUpdateOptions`, `InstallResult`, `DetectInstallationResult`, and a pluggable `Spawner`.
- **CLI commands**: `amux install`, `amux update`, `amux detect`, `amux detect-host`, `amux remote install|update`. `amux remote` drives a four-step bootstrap (probe -> amux install -> harness install -> verify) through any invocation mode.
- **Host detection** — `AgentMuxClient.detectHost()` and `detectHostHarness()` aggregate per-adapter `hostEnvSignals` with default env-var catalog to report when the current process is running under a known harness.
- **`agent-mux-remote` adapter** — a transport-agnostic adapter that emits plain `amux run ...` spawn args to be wrapped with any `InvocationMode`, enabling nested amux execution over docker/ssh/k8s.
- **Session manager I/O** — full-text `search()`, `export(format = 'json' | 'jsonl' | 'markdown')`, and structural `diff()`. Each adapter owns its session directory (see README table). The placeholder `watch()` API was removed instead of shipping synthetic deltas.
- **`@a5c-ai/agent-mux-harness-mock`** package — `MockProcess`, `WorkspaceSandbox`, pre-built `HarnessScenario` library, and a `probe` utility for capturing behavior profiles from real harnesses. See [docs/14-harness-mock.md](docs/14-harness-mock.md).
- **Dockerfile** at repo root using `amux install` with an overridable `HARNESSES` build-arg.
- **ESLint flat config** with local `max-file-lines` rule (400 effective, non-blank/non-comment lines).
- **Git pre-commit hook** at `.githooks/pre-commit`; installed via `npm run hooks:install`.
- New spec docs `docs/13-invocation-modes.md` and `docs/14-harness-mock.md`.

### Changed

- Spec 11 (`11-process-lifecycle-and-platform.md`) updated: single-process `node:child_process.spawn`, Unix `detached: true` + `process.kill(-pid, sig)` for group kills, Windows relying on native process tree + `taskkill /T` fallback.
- Spec 10 (CLI reference) updated with `install`, `update`, `detect`, `detect-host`, and the `remote install|update` subcommand.
- Spec 5 (adapter system) updated with install/update/detect surface and `hostEnvSignals`.
- Spec 12 (built-in adapters) updated with the 11th adapter (`agent-mux-remote`) and per-adapter session directories.
- Spec 7 (session manager) updated to describe the read-only session surface: list/get/search/export/diff plus explicit omission of live watch semantics.
- Spec 8 (config & auth) updated: hermes config is YAML; session files are written atomically via tmp + rename in `adapters/session-fs.ts`.

### Notes

- The `@a5c-ai/agent-mux` meta package currently re-exports `core` + `adapters` from `packages/agent-mux/src/index.ts`. The CLI ships from `@a5c-ai/agent-mux-cli`.
