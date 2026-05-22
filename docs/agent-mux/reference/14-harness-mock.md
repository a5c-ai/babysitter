# Harness Mock

Canonical package documentation lives in `packages/agent-mux/harness-mock/README.md`.
This page is the repository reference mirror for `@a5c-ai/agent-mux-harness-mock`
and should stay aligned with that README and the exported surface from
`packages/agent-mux/harness-mock/src/index.ts`.

## Package Location

- Package path: `packages/agent-mux/harness-mock/`
- NPM package: `@a5c-ai/agent-mux-harness-mock`
- CLI binary: `mock-harness`

## CLI

```bash
mock-harness --list
mock-harness --agent claude --list
mock-harness --scenario claude:stream-json
mock-harness --agent cursor --scenario error
```

`--agent <name>` scopes `--list` to `<name>:*` scenarios and lets bare
`--scenario` values resolve within that prefix. For example,
`mock-harness --agent cursor --scenario error` resolves `cursor:error`.

## What It Exports

The public entrypoint re-exports these surface areas:

- subprocess simulation and registries from `mock-process`, `scenarios`, and `types`
- workspace and probe helpers from `workspace` and `probe`
- bindable transport mocks from `http-mock` and `websocket-mock`
- SDK/remote mock factories and grouped registries from `mocks/index`

The current must-know exports are:

- `MockProcess`, `WorkspaceSandbox`
- `AGENT_SCENARIOS`, `SUBPROCESS_HARNESS_PROFILES`, `SUBPROCESS_SCENARIO_EXPECTATIONS`
- `resolveScenario`, `listScenarioNames`
- `HttpServerMock`, `WebSocketServerMock`
- `createProgrammaticMockBuilder`, `createRemoteMockBuilder`, `createScriptableTransportBuilder`
- `ClaudeAgentSdkMock`, `CodexSdkMock`, `PiSdkMock`
- `OpenCodeHttpMock`, `CodexWebSocketMock`
- `AdapterMockFactory`, `adapterMocks`, `mockScenarios`
- `probeHarness`, `probeAllHarnesses`, `compareProfiles`, `PROBE_CONFIGS`

## Supported Harnesses And Transports

### Subprocess harness profiles

`SUBPROCESS_HARNESS_PROFILES` currently covers:

- `claude`
- `codex`
- `gemini`
- `copilot`
- `cursor`
- `opencode`
- `pi`
- `omp`
- `openclaw`
- `hermes`
- `amp`
- `droid`
- `qwen`

Each profile maps to canonical scenario names and parser-backed expectations in
`SUBPROCESS_SCENARIO_EXPECTATIONS`.

### Non-subprocess adapters

The package also ships public fixtures for these adapter identities:

- SDK/programmatic: `claude-agent-sdk`, `codex-sdk`, `pi-sdk`
- HTTP transport: `opencode-http`
- WebSocket transport: `codex-websocket`

Execution shapes documented by the package are `subprocess`, `sdk`, `http`, and
`websocket`.

## Usage Patterns

### Validate a subprocess parser path

```ts
import {
  AGENT_SCENARIOS,
  MockProcess,
  SUBPROCESS_SCENARIO_EXPECTATIONS,
} from '@a5c-ai/agent-mux-harness-mock';

const scenario = AGENT_SCENARIOS['opencode:tool-call'];
const proc = new MockProcess(scenario);

proc.start();
const result = await proc.waitForExit();

console.log(result.exitCode);
console.log(SUBPROCESS_SCENARIO_EXPECTATIONS['opencode:tool-call']);
```

### Build SDK or transport fixtures

```ts
import {
  ClaudeAgentSdkMock,
  OpenCodeHttpMock,
  adapterMocks,
  createProgrammaticMockBuilder,
  createRemoteMockBuilder,
} from '@a5c-ai/agent-mux-harness-mock';

const presetSdk = ClaudeAgentSdkMock.basicSuccess();
const presetRemote = OpenCodeHttpMock.basicSuccess();

const customSdk = createProgrammaticMockBuilder()
  .name('custom-sdk')
  .addTextStream('hello')
  .build();

const customRemote = createRemoteMockBuilder()
  .name('custom-remote')
  .addEvents([{ type: 'text_delta', data: { delta: 'hello' }, delayMs: 5 }])
  .build();

void presetSdk;
void presetRemote;
void customSdk;
void customRemote;
void adapterMocks;
```

### Bind a real local transport

Use `HttpServerMock`, `WebSocketServerMock`, or the higher-level `MockServer`
when a client under test needs to connect over the network rather than consume
an in-process event emitter.

## Limitations

- `MockProcess` replays scripted output in-process. It does not execute a real harness binary.
- `HttpServerMock`, `WebSocketServerMock`, and `MockServer` bind local ports and are heavier than pure fixture replay.
- Probe helpers such as `probeHarness` and `probeAllHarnesses` execute real harness binaries and are intended for drift checks, not hermetic unit tests.
- The package documents the current exported surface from `packages/agent-mux/harness-mock/`; older v1-era source-path references are obsolete.

## Probe Coverage

The built-in `PROBE_CONFIGS` now cover the subprocess harness matrix:

- `claude-code`
- `codex`
- `gemini`
- `copilot`
- `cursor`
- `opencode`
- `pi`
- `omp`
- `openclaw`
- `hermes`
- `amp`
- `droid`
- `qwen`

They also cover the SDK/programmatic targets as fixture-backed contract probes:

- `claude-agent-sdk`
- `codex-sdk`
- `pi-sdk`

They also cover the transport-oriented targets:

- `codex-websocket`
- `opencode-http`

Each `HarnessBehaviorProfile` now carries:

- `executionType`
- `outputFormat` and `outputFormatTraits`
- `supportsStdin` and `stdinSignals`
- per-scenario `exitCodes`
- `environmentVariables`, `fileOperationPatterns`, and `cliPatterns`
- `availability` and `probeNotes`

Checked-in offline baseline contracts live at
`packages/agent-mux/harness-mock/tests/fixtures/probes/baseline-profiles.json`.

CI vs local/manual:

- CI-safe: fixture coverage checks, contract-shape validation, the node-based
  offline probe tests in `packages/agent-mux/harness-mock/tests/probe-offline.test.ts`,
  and the offline-only SDK contract profiles for `claude-agent-sdk`,
  `codex-sdk`, and `pi-sdk`
- Local/manual: authenticated vendor CLI probes and transport startup probes for
  binaries that are not expected to exist in CI
- Offline-only: SDK entries materialize reviewed contract profiles without
  executing a harness binary, so drift review happens through the checked-in
  fixture rather than a live probe run
