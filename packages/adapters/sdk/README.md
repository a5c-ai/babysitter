# @a5c-ai/adapters

Unified dispatch layer for local CLI-based AI coding agents — Claude Code, Codex, Gemini, Copilot, Cursor, OpenCode, and more.

This meta-package re-exports `@a5c-ai/comm-adapter`, `@a5c-ai/adapters-codecs`, and `@a5c-ai/adapters-cli` as one convenient install.

## Install

```bash
npm install @a5c-ai/adapters
```

The `adapters` CLI is available via this package (`npx adapters --help`).

Requires Node.js >= 22.13.0. ESM-first. (This meta-package re-exports `@a5c-ai/adapters-cli`, whose root loads `@a5c-ai/adapters-gateway` and its built-in `node:sqlite` module — unflagged only from Node.js 22.13.0.)

## Usage

```ts
import { createClient } from '@a5c-ai/adapters';

const client = createClient();
for await (const event of client.run({ agent: 'claude-code', prompt: 'hello' })) {
  console.log(event);
}
```

See the [repository README](https://github.com/a5c-ai/adapters#readme) for the full guide.

## License

MIT © a5c-ai
