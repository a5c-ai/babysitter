# Harness Mock

**Specification v1.0** | `@a5c-ai/agent-mux-harness-mock`

---

## 1. Purpose

`@a5c-ai/agent-mux-harness-mock` is a test-only package that simulates harness CLIs without requiring real binaries, API keys, or network. It provides:

- A `MockProcess` that drives stdout/stderr/stdin and exit codes per scenario.
- A `WorkspaceSandbox` isolated-filesystem helper for applying `FileOperation` sequences.
- A catalog of pre-built `HarnessScenario` fixtures for the most common claude-code / codex cases.
- A `probe` utility for recording a `HarnessBehaviorProfile` from a real harness invocation (used to keep scenarios honest).

Source: `packages/harness-mock/src/`.

## 2. Public API

```ts
import {
  MockProcess,
  WorkspaceSandbox,
  claudeCodeSuccess,
  claudeCodeToolApproval,
  claudeCodeTimeout,
  claudeCodeCrash,
  claudeCodeFileOps,
  codexSuccess,
  codexFileOps,
  codexFailure,
  emptySuccess,
  slowStartup,
  largeOutput,
  probeHarness,
  probeAllHarnesses,
  compareProfiles,
  PROBE_CONFIGS,
} from '@a5c-ai/agent-mux-harness-mock';

import type {
  HarnessType,
  FileOperation,
  ProcessBehavior,
  OutputChunk,
  StdinInteraction,
  MockEvent,
  HarnessScenario,
  MockHarnessHandle,
  HarnessBehaviorProfile,
  WorkspaceOptions,
  ProbeConfig,
  ProbeResult,
  ProfileDiff,
} from '@a5c-ai/agent-mux-harness-mock';
```

## 3. Core types

- `HarnessType` — `'claude-code' | 'codex' | 'aider' | 'goose' | 'custom'`.
- `HarnessScenario` — fully declarative spec: `output: OutputChunk[]`, `exitCode`, `duration`, `stdin?: StdinInteraction[]`, `fileOperations?: FileOperation[]`, `events?: MockEvent[]`.
- `OutputChunk` — `{ stream: 'stdout' | 'stderr'; text: string; delayMs?: number }`.
- `FileOperation` — `create | modify | delete | rename` with `path`, `content?`, and `newPath?` (for rename).
- `HarnessBehaviorProfile` — capture of a real probe: startup timing, output stream format, exit codes seen.

## 4. `MockProcess`

Instantiated from a scenario. Exposes a `ChildProcess`-compatible handle (stdout/stderr/stdin, exit code promise) that `spawn-runner.ts` can consume directly when the spawn function is overridden in tests.

## 5. `WorkspaceSandbox`

A temp-directory sandbox under `os.tmpdir()/amux-workspace-*`. Methods:

- `writeFile(relativePath, content)`
- `readFile(relativePath) -> string`
- `exists(relativePath) -> boolean`
- `list(relativePath?) -> string[]`
- `applyOperations(ops: FileOperation[])` — executes `create`, `modify`, `delete`, `rename` in order.
- `dispose()` — removes the sandbox. Post-dispose writes throw.

## 6. Pre-built scenarios

| Scenario | Purpose |
|---|---|
| `claudeCodeSuccess` | Happy-path streaming + clean exit. |
| `claudeCodeToolApproval` | Emits a tool-use event that requires approval. |
| `claudeCodeTimeout` | Long-running; used to exercise inactivity/overall timeouts. |
| `claudeCodeCrash` | Non-zero exit mid-stream. |
| `claudeCodeFileOps` | Emits file-operation events and corresponding `FileOperation`s. |
| `runtimeHookAllowBash` | Simulates a blocking pre-tool runtime hook that allows a `Bash` tool call through. |
| `runtimeHookDenyWrite` | Simulates a blocking pre-tool runtime hook that denies a `Write` tool call and exits early. |
| `runtimeHookTimeout` | Simulates a runtime hook that never resolves so timeout handling can be exercised. |
| `codexSuccess`, `codexFileOps`, `codexFailure` | Codex analogues. |
| `emptySuccess` | Zero output, exit 0 — edge case. |
| `slowStartup` | Delayed first byte — exercises startup-timeout. |
| `largeOutput(lineCount)` | Factory producing N lines to stress the stream assembler. |

## 7. Probe tools

- `probeHarness(config: ProbeConfig): Promise<ProbeResult>` — runs a real harness, captures stdout/stderr, timing, and exit code, and returns a `HarnessBehaviorProfile`.
- `probeAllHarnesses(cfgs)` — batch form.
- `compareProfiles(a, b): ProfileDiff` — structural diff between two profiles (for drift detection).
- `PROBE_CONFIGS` — canonical configs for the built-in harnesses.

Probes write `profile.json` + `result.json` into the configured output directory so they can be checked into tests or replayed offline.

## 8. Usage pattern

```ts
import { MockProcess, WorkspaceSandbox, claudeCodeFileOps } from '@a5c-ai/agent-mux-harness-mock';

const sandbox = new WorkspaceSandbox();
const proc = new MockProcess(claudeCodeFileOps);

// Feed proc.stdout into the adapter's parseEvent to verify the event stream,
// then apply the scenario's fileOperations into the sandbox to check that the
// reported file changes match what the mock "wrote".
sandbox.applyOperations(claudeCodeFileOps.fileOperations!);
sandbox.dispose();
```

## 9. Not in scope

- The mock does not talk to a real LLM and does not synthesize new output — it replays the scripted `OutputChunk[]`.
- It does not spawn a subprocess unless `probe*` is used; `MockProcess` is an in-process emitter.
