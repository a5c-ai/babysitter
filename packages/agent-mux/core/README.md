# @a5c-ai/agent-mux-comm

This README is the canonical package documentation for `@a5c-ai/agent-mux-comm`.
Canonical package doc path: `packages/agent-mux/core/README.md`.
The repository reference mirror lives at `docs/agent-mux/reference/01-core-types-and-client.md` and
should match this file for package identity, runtime dependencies, and import guidance.

`@a5c-ai/agent-mux-comm` is the public Node.js core runtime package at
`packages/agent-mux/core/` for agent-mux. It ships:

- the main Node entrypoint with `AgentMuxClient`, `createClient`, normalized events,
  run/session/config/auth/plugin contracts, provider and hook helpers, workspace
  services, and atomic filesystem helpers
- `@a5c-ai/agent-mux-comm/browser` for browser-safe type exports plus `classifyTool`
- `@a5c-ai/agent-mux-comm/kanban` for kanban/project/workspace planning types and helpers
- `@a5c-ai/agent-mux-comm/automation` for automation rule, trigger, routing, and execution record types

## Install

```bash
npm install @a5c-ai/agent-mux-comm
```

Requires Node.js `>=20.9.0`.

This package is published as ESM. The export map exposes `import`, `require`, and
`default` conditions, but they all resolve to the same ESM build. Use `import`
from ESM projects. From CommonJS, load it with `await import('@a5c-ai/agent-mux-comm')`
instead of expecting a separate CJS bundle.

Runtime dependencies are part of the package contract:

- `@a5c-ai/atlas/catalog` provides the harness image catalog plus host-detection
  rules and metadata used by invocation and host helpers
- `@a5c-ai/agent-mux-observability` provides the structured logging and telemetry
  primitives used by the client, auth/session flows, and run-handle implementation

## Usage

```ts
import {
  createClient,
  resolveProvider,
  resolveRunOptions,
  type AuthMethodDescriptor,
  type PluginInfo,
} from '@a5c-ai/agent-mux-comm';

const client = createClient();
```

```ts
import { classifyTool, type AgentEvent } from '@a5c-ai/agent-mux-comm/browser';
import { buildKanbanProjectBoard } from '@a5c-ai/agent-mux-comm/kanban';
import { type AutomationRule } from '@a5c-ai/agent-mux-comm/automation';
```

The public surface is grouped around:

- client/runtime entry points such as `AgentMuxClient` and `createClient`
- run, auth, hook, provider, and capability contracts such as `RunOptions`,
  `AuthMethodDescriptor`, `HookRegistration`, and `ProviderConfig`
- plugin contracts such as `PluginInfo`, `PluginListing`, and `PluginBrowseOptions`
- workspace, merge, and filesystem helpers such as `WorkspaceService`,
  `resolveRunOptions`, and `writeFileAtomic`

The supported public import seams are:

- `@a5c-ai/agent-mux-comm`
- `@a5c-ai/agent-mux-comm/browser`
- `@a5c-ai/agent-mux-comm/kanban`
- `@a5c-ai/agent-mux-comm/automation`

## Release Verification

Use the package-local release checks to confirm the documented export map still
matches the packed package surface:

```bash
npm run build --workspace=@a5c-ai/agent-mux-comm
npm run test --workspace=@a5c-ai/agent-mux-comm
npm run verify:release --workspace=@a5c-ai/agent-mux-comm
npm pack --json --dry-run --workspace=@a5c-ai/agent-mux-comm
```

Release reviewers should be able to confirm from this README that the package
intentionally publishes the root, `browser`, `kanban`, and `automation`
subpaths and that all of them remain backed by `dist/*.js` and `dist/*.d.ts`
artifacts.

## Docs

- [Agent Mux docs](../../../docs/agent-mux/README.md)
- [Reference mirror](../../../docs/agent-mux/reference/01-core-types-and-client.md)
- [Package family entrypoint](../README.md)

## License

MIT © a5c-ai
