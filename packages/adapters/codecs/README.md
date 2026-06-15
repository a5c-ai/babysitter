# @a5c-ai/adapters-codecs

Built-in agent adapters for [adapters](https://github.com/a5c-ai/adapters): `claude`, `claude-agent-sdk`, `codex`, `codex-sdk`, `codex-websocket`, `gemini`, `copilot`, `cursor`, `opencode`, `opencode-http`, `pi`, `pi-sdk`, `omp`, `openclaw`, `hermes`, `amp`, `droid`, `qwen`, plus a remote `adapters` adapter.

Mock infrastructure is not part of this package anymore. Import subprocess, SDK, HTTP, and WebSocket mocks from `@a5c-ai/adapters-harness-mock`.

## Install

```bash
npm install @a5c-ai/adapters-codecs @a5c-ai/comm-adapter
```

Requires Node.js >= 20.9.0. ESM-only.

## Usage

```ts
import { registerBuiltinAdapters } from '@a5c-ai/adapters-codecs';
import { defaultRegistry } from '@a5c-ai/comm-adapter';

registerBuiltinAdapters(defaultRegistry);
```

See the [repository README](https://github.com/a5c-ai/adapters#readme) for full documentation.

## License

MIT © a5c-ai
