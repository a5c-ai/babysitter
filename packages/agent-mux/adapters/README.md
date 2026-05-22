# @a5c-ai/agent-mux-adapters

Built-in agent adapters for [agent-mux](https://github.com/a5c-ai/agent-mux): `claude`, `claude-agent-sdk`, `codex`, `codex-sdk`, `codex-websocket`, `gemini`, `copilot`, `cursor`, `opencode`, `opencode-http`, `pi`, `pi-sdk`, `omp`, `openclaw`, `hermes`, `amp`, `droid`, `qwen`, plus a remote `agent-mux` adapter.

Mock infrastructure is not part of this package anymore. Import subprocess, SDK, HTTP, and WebSocket mocks from `@a5c-ai/agent-mux-harness-mock`.

## Install

```bash
npm install @a5c-ai/agent-mux-adapters @a5c-ai/agent-mux-core
```

Requires Node.js >= 20.9.0. ESM-only.

## Usage

```ts
import { registerBuiltinAdapters } from '@a5c-ai/agent-mux-adapters';
import { defaultRegistry } from '@a5c-ai/agent-mux-core';

registerBuiltinAdapters(defaultRegistry);
```

See the [repository README](https://github.com/a5c-ai/agent-mux#readme) for full documentation.

## License

MIT © a5c-ai
