# @a5c-ai/hooks-adapter-oh-my-pi

oh-my-pi harness adapter for hooks-adapter.

## Install

```bash
npm install @a5c-ai/hooks-adapter-oh-my-pi @a5c-ai/hooks-adapter-core
```

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createAdapter,
  createConfiguredEngine,
  normalizeOhMyPiEvent,
} from "@a5c-ai/hooks-adapter-oh-my-pi";
```

The package exposes oh-my-pi-specific normalization, phase mappings, session helpers, and an in-process configured engine for hooks-adapter integrations.

See [`packages/adapters/hooks/README.md`](../README.md) for the workspace overview and `packages/adapters/hooks/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
