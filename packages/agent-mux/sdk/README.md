# @a5c-ai/agent-mux

Unified dispatch layer for local CLI-based AI coding agents — Claude Code, Codex, Gemini, Copilot, Cursor, OpenCode, and more.

This meta-package re-exports `@a5c-ai/agent-mux-core`, `@a5c-ai/agent-mux-adapters`, and `@a5c-ai/agent-mux-cli` as one convenient install.

## Install

```bash
npm install @a5c-ai/agent-mux
```

The `amux` CLI is available via the bundled CLI package (`npx amux --help`).

Requires Node.js >= 20.9.0. ESM-first.

## Usage

```ts
import { createClient } from '@a5c-ai/agent-mux';

const client = createClient();
for await (const event of client.run({ agent: 'claude-code', prompt: 'hello' })) {
  console.log(event);
}
```

See the [repository README](https://github.com/a5c-ai/agent-mux#readme) for the full guide.

## License

MIT © a5c-ai
