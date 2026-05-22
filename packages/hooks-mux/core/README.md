# @a5c-ai/hooks-mux-core

Canonical schemas, types, session store, merge engine, and programmatic runtime for hooks-mux.

## Install

```bash
npm install @a5c-ai/hooks-mux-core
```

This package ships the built runtime in `dist/` and this package README for npm publish-surface auditing.

## Usage

```ts
import {
  createHooksEngine,
  createAdapter,
  registerHandler,
  runNormalized,
  type UnifiedHookEvent,
  type UnifiedHookResult,
} from "@a5c-ai/hooks-mux-core";
```

The public surface includes:

- canonical event, result, adapter, plan, and session types
- normalization, merge, propagation, and diagnostics helpers
- session-store utilities and harness discovery
- the programmatic hooks engine for in-process integrations

See the workspace overview in [`packages/hooks-mux/README.md`](../README.md) and the adapter guide in `packages/hooks-mux/docs/`.

## License

MIT © a5c-ai
