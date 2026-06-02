# @a5c-ai/agent-mux-harness-mock

This README is the canonical package documentation for `@a5c-ai/agent-mux-harness-mock`.
Canonical package doc path: `packages/agent-mux/harness-mock/README.md`.
The repository reference mirror lives at `docs/agent-mux/reference/14-harness-mock.md` and
should match this file.

`@a5c-ai/agent-mux-harness-mock` is the public test-fixture package at
`packages/agent-mux/harness-mock/` for agent-mux harness simulations. It covers four
execution shapes:

- subprocess fixtures and parser-backed scenario registries for the current CLI harness matrix
- in-process helpers such as `MockProcess`, `WorkspaceSandbox`, `resolveScenario`, and `listScenarioNames`
- bindable transport mocks via `HttpServerMock`, `WebSocketServerMock`, and the adapter-oriented remote builders
- programmatic SDK-style mocks and real-harness probe helpers
- offline probe baseline contracts for drift review

Execution shapes: `subprocess`, `sdk`, `http`, `websocket`.

## Install

```bash
npm install --save-dev @a5c-ai/agent-mux-harness-mock
```

Requires Node.js `>=20.9.0`.

## CLI

```bash
agent-mux-harness-mock --list
agent-mux-harness-mock --agent claude --list
agent-mux-harness-mock --scenario claude:stream-json
agent-mux-harness-mock --agent cursor --scenario error
```

`--agent <name>` filters `--list` to `<name>:*` scenarios and lets bare
`--scenario` values resolve within that prefix. For example,
`agent-mux-harness-mock --agent cursor --scenario error` resolves `cursor:error`.

## Supported Surfaces

### Subprocess registry

The subprocess surface is centered on these exports:

- `AGENT_SCENARIOS`
- `SUBPROCESS_HARNESS_PROFILES`
- `SUBPROCESS_SCENARIO_EXPECTATIONS`
- `resolveScenario(name)`
- `listScenarioNames()`
- `agent-mux-harness-mock --list`

The canonical subprocess harness keys are:
`claude`, `codex`, `gemini`, `copilot`, `cursor`, `opencode`, `pi`, `omp`,
`openclaw`, `hermes`, `amp`, `droid`, and `qwen`.

Legacy aliases such as `claude:basic-text`, `cursor:basic-text`, and
`pi:basic-text` still resolve through `AGENT_SCENARIOS`, but new tests and docs
should prefer the canonical names from `SUBPROCESS_HARNESS_PROFILES`.

### SDK and remote builders

The package also exports higher-level mock builders and named presets for these
non-subprocess adapters:

- SDK/programmatic: `claude-agent-sdk`, `codex-sdk`, `pi-sdk`
- Remote transports: `opencode-http`, `codex-websocket`

Important exports in this layer include:

- `createProgrammaticMockBuilder`
- `createRemoteMockBuilder`
- `createScriptableTransportBuilder`
- `ClaudeAgentSdkMock`, `CodexSdkMock`, `PiSdkMock`
- `OpenCodeHttpMock`, `CodexWebSocketMock`
- `AdapterMockFactory`, `adapterMocks`, `mockScenarios`
- `MockServer`, `createMockServer`

### Low-level helpers

The top-level entrypoint also exports:

- `MockProcess`
- `WorkspaceSandbox`
- `HttpServerMock`
- `WebSocketServerMock`
- `probeHarness`, `probeAllHarnesses`, `compareProfiles`, `PROBE_CONFIGS`

## Usage

### Subprocess fixtures

```ts
import {
  AGENT_SCENARIOS,
  MockProcess,
  SUBPROCESS_HARNESS_PROFILES,
  SUBPROCESS_SCENARIO_EXPECTATIONS,
  WorkspaceSandbox,
} from '@a5c-ai/agent-mux-harness-mock';

const scenarioName = SUBPROCESS_HARNESS_PROFILES.cursor.scenarios[0];
const scenario = AGENT_SCENARIOS[scenarioName];
const proc = new MockProcess(scenario);
const sandbox = new WorkspaceSandbox();

proc.start();
const result = await proc.waitForExit();

if (scenario.fileOperations) {
  sandbox.applyOperations(scenario.fileOperations);
}

console.log(result.exitCode);
console.log(SUBPROCESS_SCENARIO_EXPECTATIONS[scenarioName]);

sandbox.dispose();
```

### Programmatic and remote builders

```ts
import {
  ClaudeAgentSdkMock,
  CodexWebSocketMock,
  MockServer,
  createProgrammaticMockBuilder,
  createRemoteMockBuilder,
} from '@a5c-ai/agent-mux-harness-mock';

const sdkPreset = ClaudeAgentSdkMock.toolCalling();
const customSdk = createProgrammaticMockBuilder()
  .name('custom-sdk')
  .addTextStream('hello from a custom stream')
  .withCost(20, 10)
  .build();

const remotePreset = CodexWebSocketMock.connectionDrop();
const customRemote = createRemoteMockBuilder()
  .name('custom-remote')
  .withServer({ port: 0 })
  .addEvents([{ type: 'text_delta', data: { delta: 'hi' }, delayMs: 5 }])
  .build();

const server = new MockServer(remotePreset);
await server.start();
await server.stop();

void sdkPreset;
void customSdk;
void customRemote;
```

### Bindable transport mocks

`HttpServerMock` and `WebSocketServerMock` are lower-level scenario-backed
servers. They bind real local ports, which makes them useful when you want an
external client to connect to a scripted HTTP or WebSocket endpoint.

## Probe Helpers

`probeHarness` and `probeAllHarnesses` execute real harness binaries. They are
for drift detection and fixture maintenance, not for pure unit tests.

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

Each probe profile now records:

- `executionType`
- `outputFormat` and `outputFormatTraits`
- `supportsStdin` and `stdinSignals`
- scenario exit codes such as `version`, `help`, `success`, and `error`
- relevant `environmentVariables`, `fileOperationPatterns`, and `cliPatterns`
- `availability` and `probeNotes`

Checked-in baseline contracts live at
`packages/agent-mux/harness-mock/tests/fixtures/probes/baseline-profiles.json`.

CI vs local/manual:

- CI-safe: fixture coverage checks, contract-shape validation, the node-based
  offline probe tests in `tests/probe-offline.test.ts`, and the offline-only SDK
  contract profiles for `claude-agent-sdk`, `codex-sdk`, and `pi-sdk`
- Local/manual: authenticated vendor CLI probes and transport startup probes for
  binaries that are not expected to exist in CI
- Offline-only: SDK entries materialize reviewed contract profiles without
  executing a harness binary, so drift review happens through the checked-in
  fixture rather than a live probe run

## Limitations

- `MockProcess` is an in-process emitter. It does not spawn a real subprocess.
- `HttpServerMock`, `WebSocketServerMock`, and `MockServer` bind local ports and
  are therefore heavier than the pure subprocess fixtures.
- Probe helpers execute real binaries and may require installed harnesses,
  credentials, transport startup support, and a writable output directory.
- The package replays scripted behavior; it does not synthesize fresh model output.

## License

MIT © a5c-ai
