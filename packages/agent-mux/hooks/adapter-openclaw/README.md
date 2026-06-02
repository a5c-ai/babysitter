# @a5c-ai/agent-mux-hooks-adapter-openclaw

OpenClaw harness adapter for hooks-mux.

## Install

```bash
npm install @a5c-ai/agent-mux-hooks-adapter-openclaw @a5c-ai/agent-mux-hooks-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  createConfiguredEngine,
  normalizeOpenClaw,
} from "@a5c-ai/agent-mux-hooks-adapter-openclaw";
```

The package exposes OpenClaw-specific normalization, phase mappings, gateway/plugin helpers, session utilities, and an in-process configured engine for hooks-mux integrations.

See [`packages/agent-mux/hooks/README.md`](../README.md) for the workspace overview and `packages/agent-mux/hooks/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
