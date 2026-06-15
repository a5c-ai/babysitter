# @a5c-ai/hooks-adapter-genty

Genty harness adapter for hooks-adapter.

## Install

```bash
npm install @a5c-ai/hooks-adapter-genty @a5c-ai/hooks-adapter-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  normalizeGentyEvent,
  renderGentyOutput,
} from "@a5c-ai/hooks-adapter-genty";
```

The package exposes Genty-specific normalization, phase mappings, rendering helpers, and session-resolution utilities for the hooks-adapter execution pipeline.

See [`packages/adapters/hooks/README.md`](../README.md) for the workspace overview and `packages/adapters/hooks/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
