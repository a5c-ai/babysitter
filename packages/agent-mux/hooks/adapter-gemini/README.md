# @a5c-ai/agent-mux-hooks-adapter-gemini

Gemini CLI harness adapter for hooks-mux.

## Install

```bash
npm install @a5c-ai/agent-mux-hooks-adapter-gemini @a5c-ai/agent-mux-hooks-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  normalizeGemini,
  renderGeminiOutput,
} from "@a5c-ai/agent-mux-hooks-adapter-gemini";
```

The package exposes Gemini-specific normalization, phase mappings, rendering helpers, and session-resolution utilities for the hooks-mux execution pipeline.

See [`packages/agent-mux/hooks/README.md`](../README.md) for the workspace overview and `packages/agent-mux/hooks/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
