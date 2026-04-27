# @a5c-ai/agent-mux-harness-mock

Mock harness simulator for [agent-mux](https://github.com/a5c-ai/agent-mux) adapter testing. It is the canonical home for:

- adapter-faithful subprocess scenarios for the currently supported CLI harnesses: `claude`, `codex`, `gemini`, `copilot`, `cursor`, `opencode`, `pi`, `omp`, `openclaw`, `hermes`, `amp`, `droid`, and `qwen`
- a parser-backed subprocess matrix that validates every registered scenario through the real adapter parsers, not just through `MockProcess`
- programmatic SDK mock builders for `claude-agent-sdk`, `codex-sdk`, and `pi-sdk`
- bindable remote transport mock builders for `opencode-http` and `codex-websocket`

## Install

```bash
npm install --save-dev @a5c-ai/agent-mux-harness-mock
```

Requires Node.js >= 20.9.0.

## CLI

```bash
mock-harness --list
mock-harness --scenario claude:stream-json
mock-harness --scenario cursor:error
```

## Programmatic

```ts
import {
  MockProcess,
  AGENT_SCENARIOS,
  SUBPROCESS_HARNESS_PROFILES,
  SUBPROCESS_SCENARIO_EXPECTATIONS,
} from '@a5c-ai/agent-mux-harness-mock';

const proc = new MockProcess(AGENT_SCENARIOS['cursor:session-text']);
const supported = Object.keys(SUBPROCESS_HARNESS_PROFILES);
const expectation = SUBPROCESS_SCENARIO_EXPECTATIONS['cursor:error'];
```

Each subprocess profile exposes canonical scenario names through
`SUBPROCESS_HARNESS_PROFILES`. The current matrix covers text/session, tool-call,
and nonzero-exit error paths for every supported subprocess harness. Legacy
aliases such as `cursor:basic-text`, `pi:basic-text`, `omp:basic-text`,
`openclaw:basic-text`, and `hermes:basic-text` still resolve to the new
canonical fixtures.

## SDK / Remote Mocks

```ts
import {
  createProgrammaticMockBuilder,
  createRemoteMockBuilder,
  ClaudeAgentSdkMock,
  OpenCodeHttpMock,
} from '@a5c-ai/agent-mux-harness-mock';

const sdkMock = ClaudeAgentSdkMock.basicSuccess();
const remoteMock = OpenCodeHttpMock.basicSuccess();
const customProgrammatic = createProgrammaticMockBuilder().name('custom').addTextStream('hello').build();
const customRemote = createRemoteMockBuilder().name('custom-remote').addEvents([{ type: 'text_delta', data: { delta: 'hi' } }]).build();
```

See the [repository README](https://github.com/a5c-ai/agent-mux#readme) for details.

`codex-websocket` scenarios bind a real websocket server on `serverUrl`, so
external clients can connect, receive scripted frames, and exercise disconnect
and reconnect flows against the mock over the network.

## License

MIT © a5c-ai
