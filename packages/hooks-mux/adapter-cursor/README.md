# @a5c-ai/hooks-mux-adapter-cursor

Cursor harness adapter for hooks-mux.

## Install

```bash
npm install @a5c-ai/hooks-mux-adapter-cursor @a5c-ai/hooks-mux-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  normalizeCursorEvent,
  getActiveProfile,
} from "@a5c-ai/hooks-mux-adapter-cursor";
```

The package exposes Cursor-specific normalization, capability profiles, phase mappings, rendering helpers, and session-resolution utilities for the hooks-mux execution pipeline.

See [`packages/hooks-mux/README.md`](../README.md) for the workspace overview and `packages/hooks-mux/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
