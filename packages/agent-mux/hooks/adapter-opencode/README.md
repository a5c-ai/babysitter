# @a5c-ai/agent-mux-hooks-adapter-opencode

OpenCode harness adapter for hooks-mux.

## Install

```bash
npm install @a5c-ai/agent-mux-hooks-adapter-opencode @a5c-ai/agent-mux-hooks-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  createConfiguredEngine,
  normalizeOpenCode,
} from "@a5c-ai/agent-mux-hooks-adapter-opencode";
```

The package exposes OpenCode-specific normalization, phase mappings, session utilities, and an in-process configured engine for hooks-mux integrations.

See [`packages/agent-mux/hooks/README.md`](../README.md) for the workspace overview and `packages/agent-mux/hooks/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
