# @a5c-ai/agent-mux-hooks-core

Canonical schemas, types, session store, merge engine, and programmatic runtime for hooks-mux.

## Install

```bash
npm install @a5c-ai/agent-mux-hooks-core
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
} from "@a5c-ai/agent-mux-hooks-core";
```

The public surface includes:

- canonical event, result, adapter, plan, and session types
- normalization, merge, propagation, and diagnostics helpers
- session-store utilities and harness discovery
- the programmatic hooks engine for in-process integrations

See the workspace overview in [`packages/agent-mux/hooks/README.md`](../README.md) and the adapter guide in `packages/agent-mux/hooks/docs/`.

## License

MIT © a5c-ai
