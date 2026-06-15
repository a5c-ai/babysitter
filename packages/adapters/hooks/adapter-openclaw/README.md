# @a5c-ai/hooks-adapter-openclaw

OpenClaw harness adapter for hooks-adapter.

## Install

```bash
npm install @a5c-ai/hooks-adapter-openclaw @a5c-ai/hooks-adapter-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  createConfiguredEngine,
  normalizeOpenClaw,
} from "@a5c-ai/hooks-adapter-openclaw";
```

The package exposes OpenClaw-specific normalization, phase mappings, gateway/plugin helpers, session utilities, and an in-process configured engine for hooks-adapter integrations.

See [`packages/adapters/hooks/README.md`](../README.md) for the workspace overview and `packages/adapters/hooks/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
