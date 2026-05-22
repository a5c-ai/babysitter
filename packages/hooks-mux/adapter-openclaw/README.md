# @a5c-ai/hooks-mux-adapter-openclaw

OpenClaw harness adapter for hooks-mux.

## Install

```bash
npm install @a5c-ai/hooks-mux-adapter-openclaw @a5c-ai/hooks-mux-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  createConfiguredEngine,
  normalizeOpenClaw,
} from "@a5c-ai/hooks-mux-adapter-openclaw";
```

The package exposes OpenClaw-specific normalization, phase mappings, gateway/plugin helpers, session utilities, and an in-process configured engine for hooks-mux integrations.

See [`packages/hooks-mux/README.md`](../README.md) for the workspace overview and `packages/hooks-mux/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
