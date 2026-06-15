# @a5c-ai/hooks-adapter-copilot

GitHub Copilot harness adapter for hooks-adapter.

## Install

```bash
npm install @a5c-ai/hooks-adapter-copilot @a5c-ai/hooks-adapter-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  normalizeCopilotEvent,
  renderCopilotOutput,
} from "@a5c-ai/hooks-adapter-copilot";
```

The package exposes Copilot-specific normalization, phase mappings, rendering helpers, and session-resolution utilities for the hooks-adapter execution pipeline.

See [`packages/adapters/hooks/README.md`](../README.md) for the workspace overview and `packages/adapters/hooks/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
