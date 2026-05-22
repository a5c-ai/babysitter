# @a5c-ai/hooks-mux-adapter-opencode

OpenCode harness adapter for hooks-mux.

## Install

```bash
npm install @a5c-ai/hooks-mux-adapter-opencode @a5c-ai/hooks-mux-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  createConfiguredEngine,
  normalizeOpenCode,
} from "@a5c-ai/hooks-mux-adapter-opencode";
```

The package exposes OpenCode-specific normalization, phase mappings, session utilities, and an in-process configured engine for hooks-mux integrations.

See [`packages/hooks-mux/README.md`](../README.md) for the workspace overview and `packages/hooks-mux/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
