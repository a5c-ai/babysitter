# Harness Mock

**Specification v1.0** | `@a5c-ai/agent-mux-harness-mock`

---

## 1. Purpose

`@a5c-ai/agent-mux-harness-mock` is a test-only package that simulates harness CLIs without requiring real binaries, API keys, or network. It provides:

- A `MockProcess` that drives stdout/stderr/stdin and exit codes per scenario.
- A `WorkspaceSandbox` isolated-filesystem helper for applying `FileOperation` sequences.
- A catalog of adapter-faithful `HarnessScenario` fixtures for every supported subprocess harness profile: `claude`, `codex`, `gemini`, `copilot`, `cursor`, `opencode`, `pi`, `omp`, `openclaw`, `hermes`, `amp`, `droid`, and `qwen`.
- A parser-backed subprocess matrix (`SUBPROCESS_SCENARIO_EXPECTATIONS`) that records which normalized `AgentEvent` types and exit codes each canonical scenario must produce through the real adapters.
- A `probe` utility for recording a `HarnessBehaviorProfile` from a real harness invocation (used to keep scenarios honest).

Source: `packages/harness-mock/src/`.

## 2. Public API

```ts
import {
  MockProcess,
  WorkspaceSandbox,
  AGENT_SCENARIOS,
  SUBPROCESS_HARNESS_PROFILES,
  SUBPROCESS_SCENARIO_EXPECTATIONS,
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

- `HarnessType` — includes subprocess harnesses (`'claude-code' | 'codex' | 'gemini' | 'amp' | 'copilot' | 'cursor' | 'droid' | 'opencode' | 'pi' | 'omp' | 'openclaw' | 'hermes' | 'qwen'`) plus legacy / remote / SDK mock identities.
- `HarnessScenario` — fully declarative spec including `output: OutputChunk[]`, `process`, optional `interactions`, optional `fileOperations`, and optional mock transport/runtime metadata.
- `OutputChunk` — `{ stream: 'stdout' | 'stderr'; data: string; delayMs?: number }`.
- `FileOperation` — `create | modify | delete | rename` with `path`, `content?`, and `newPath?` (for rename).
- `HarnessBehaviorProfile` — capture of a real probe: startup timing, output stream format, exit codes seen.
- `SUBPROCESS_HARNESS_PROFILES` — public registry of canonical subprocess harness profiles and their scenario names.
- `SUBPROCESS_SCENARIO_EXPECTATIONS` — public registry of parser-backed expectations for each canonical subprocess scenario.

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

## 6. Subprocess matrix

The canonical subprocess registry now lives in `src/scenarios/per-agent.ts`.

- Every supported subprocess harness profile has explicit named scenarios rather than anonymous count-based placeholders.
- Canonical profiles cover the adapter parse paths that are actually implemented today.
- For richer adapters, that includes session lifecycle, message stop, cost, and tool result envelopes.
- For the lighter JSONL adapters (`cursor`, `pi`, `omp`, `openclaw`, `hermes`), the registry still includes session lifecycle and nonzero-exit process behavior in the mock output, while parser expectations stay limited to the event types their adapters currently normalize.

Representative canonical scenarios:

- `claude:stream-json`, `claude:tool-call`, `claude:error`
- `codex:exec-turn`, `codex:code-generation`, `codex:error`
- `cursor:session-text`, `cursor:tool-call`, `cursor:error`
- `pi:session-text`, `pi:tool-call`, `pi:error`
- `omp:session-text`, `omp:tool-call`, `omp:error`
- `openclaw:session-text`, `openclaw:tool-call`, `openclaw:error`
- `hermes:session-text`, `hermes:tool-call`, `hermes:error`

Legacy aliases such as `cursor:basic-text` and `pi:basic-text` remain resolvable for compatibility, but new docs and tests should prefer the canonical names exported by `SUBPROCESS_HARNESS_PROFILES`.

## 7. Probe tools

- `probeHarness(config: ProbeConfig): Promise<ProbeResult>` — runs a real harness, captures stdout/stderr, timing, and exit code, and returns a `HarnessBehaviorProfile`.
- `probeAllHarnesses(cfgs)` — batch form.
- `compareProfiles(a, b): ProfileDiff` — structural diff between two profiles (for drift detection).
- `PROBE_CONFIGS` — canonical configs for the built-in harnesses.

Probes write `profile.json` + `result.json` into the configured output directory so they can be checked into tests or replayed offline.

## 8. Usage pattern

```ts
import {
  MockProcess,
  WorkspaceSandbox,
  AGENT_SCENARIOS,
  SUBPROCESS_SCENARIO_EXPECTATIONS,
} from '@a5c-ai/agent-mux-harness-mock';

const sandbox = new WorkspaceSandbox();
const proc = new MockProcess(AGENT_SCENARIOS['opencode:tool-call']);

// Feed proc.stdout into the adapter's parseEvent to verify the event stream,
// then apply the scenario's fileOperations into the sandbox to check that the
// reported file changes match what the mock "wrote".
const expectation = SUBPROCESS_SCENARIO_EXPECTATIONS['opencode:tool-call'];
sandbox.applyOperations(AGENT_SCENARIOS['opencode:tool-call'].fileOperations ?? []);
sandbox.dispose();
```

## 9. Not in scope

- The mock does not talk to a real LLM and does not synthesize new output — it replays the scripted `OutputChunk[]`.
- It does not spawn a subprocess unless `probe*` is used; `MockProcess` is an in-process emitter.
