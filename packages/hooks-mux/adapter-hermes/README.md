# @a5c-ai/hooks-mux-adapter-hermes

Hermes harness adapter for hooks-mux.

## Install

```bash
npm install @a5c-ai/hooks-mux-adapter-hermes @a5c-ai/hooks-mux-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  normalizeHermesEvent,
  renderHermesOutput,
} from "@a5c-ai/hooks-mux-adapter-hermes";
```

The package exposes Hermes-specific normalization, phase mappings, rendering helpers, and session-resolution utilities for the hooks-mux execution pipeline.

Hermes has a single `onEvent` native hook that is non-blocking and post-direction only. It cannot block or deny tool calls.

See [`packages/hooks-mux/README.md`](../README.md) for the workspace overview and `packages/hooks-mux/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT (c) a5c-ai
