# @a5c-ai/agent-mux-hooks-adapter-oh-my-pi

oh-my-pi harness adapter for hooks-mux.

## Install

```bash
npm install @a5c-ai/agent-mux-hooks-adapter-oh-my-pi @a5c-ai/agent-mux-hooks-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  createConfiguredEngine,
  normalizeOhMyPiEvent,
} from "@a5c-ai/agent-mux-hooks-adapter-oh-my-pi";
```

The package exposes oh-my-pi-specific normalization, phase mappings, session helpers, and an in-process configured engine for hooks-mux integrations.

See [`packages/agent-mux/hooks/README.md`](../README.md) for the workspace overview and `packages/agent-mux/hooks/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
