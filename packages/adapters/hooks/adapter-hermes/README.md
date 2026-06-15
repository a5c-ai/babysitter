# @a5c-ai/hooks-adapter-hermes

Hermes harness adapter for hooks-adapter.

## Install

```bash
npm install @a5c-ai/hooks-adapter-hermes @a5c-ai/hooks-adapter-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  normalizeHermesEvent,
  renderHermesOutput,
} from "@a5c-ai/hooks-adapter-hermes";
```

The package exposes Hermes-specific normalization, phase mappings, rendering helpers, and session-resolution utilities for the hooks-adapter execution pipeline.

Hermes has a single `onEvent` native hook that is non-blocking and post-direction only. It cannot block or deny tool calls.

See [`packages/adapters/hooks/README.md`](../README.md) for the workspace overview and `packages/adapters/hooks/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT (c) a5c-ai
