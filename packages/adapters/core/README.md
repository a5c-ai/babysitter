# @a5c-ai/comm-adapter

This README is the canonical package documentation for `@a5c-ai/comm-adapter`.
Canonical package doc path: `packages/adapters/core/README.md`.
The repository reference mirror lives at `docs/adapters/reference/01-core-types-and-client.md` and
should match this file for package identity, runtime dependencies, and import guidance.

`@a5c-ai/comm-adapter` is the public Node.js core runtime package at
`packages/adapters/core/` for adapters. It ships:

- the main Node entrypoint with `AgentMuxClient`, `createClient`, normalized events,
  run/session/config/auth/plugin contracts, provider and hook helpers, workspace
  services, and atomic filesystem helpers
- `@a5c-ai/comm-adapter/browser` for browser-safe type exports plus `classifyTool`
- `@a5c-ai/comm-adapter/kanban` for kanban/project/workspace planning types and helpers
- `@a5c-ai/comm-adapter/automation` for automation rule, trigger, routing, and execution record types

## Install

```bash
npm install @a5c-ai/comm-adapter
```

Requires Node.js `>=20.9.0`.

This package is published as ESM. The export map exposes `import`, `require`, and
`default` conditions, but they all resolve to the same ESM build. Use `import`
from ESM projects. From CommonJS, load it with `await import('@a5c-ai/comm-adapter')`
instead of expecting a separate CJS bundle.

Runtime dependencies are part of the package contract:

- `@a5c-ai/atlas/catalog` provides the harness image catalog plus host-detection
  rules and metadata used by invocation and host helpers
- `@a5c-ai/adapters-observability` provides the structured logging and telemetry
  primitives used by the client, auth/session flows, and run-handle implementation

## Usage

```ts
import {
  createClient,
  resolveProvider,
  resolveRunOptions,
  type AuthMethodDescriptor,
  type PluginInfo,
} from '@a5c-ai/comm-adapter';

const client = createClient();
```

```ts
import { classifyTool, type AgentEvent } from '@a5c-ai/comm-adapter/browser';
import { buildKanbanProjectBoard } from '@a5c-ai/comm-adapter/kanban';
import { type AutomationRule } from '@a5c-ai/comm-adapter/automation';
```

The public surface is grouped around:

- client/runtime entry points such as `AgentMuxClient` and `createClient`
- run, auth, hook, provider, and capability contracts such as `RunOptions`,
  `AuthMethodDescriptor`, `HookRegistration`, and `ProviderConfig`
- plugin contracts such as `PluginInfo`, `PluginListing`, and `PluginBrowseOptions`
- workspace, merge, and filesystem helpers such as `WorkspaceService`,
  `resolveRunOptions`, and `writeFileAtomic`

The supported public import seams are:

- `@a5c-ai/comm-adapter`
- `@a5c-ai/comm-adapter/browser`
- `@a5c-ai/comm-adapter/kanban`
- `@a5c-ai/comm-adapter/automation`

## Interactive PTY (`node-pty` optional peer dependency)

`RunOptions.interactive` spawns the harness on a real terminal so it gets a TTY
(colors, prompt input, tool-approval UIs). The PTY backend is
[`node-pty`](https://www.npmjs.com/package/node-pty), a **native** module. This
package declares it under exactly one ownership model — a documented **optional
peer dependency** — so the consumer decides whether to install it:

```json
{
  "peerDependencies": { "node-pty": ">=1.0.0" },
  "peerDependenciesMeta": { "node-pty": { "optional": true } }
}
```

```bash
npm install node-pty   # only needed for interactive/PTY runs
```

`node-pty` is loaded explicitly and ESM-safely via `createRequire(import.meta.url)`,
resolved from this package's installed location, so a consumer-supplied copy is
found by the ordinary `node_modules` walk.

### `RunOptions.ptyMode`

| `ptyMode` | `node-pty` not installed | `node-pty` installed but broken, or the PTY cannot be opened |
| --- | --- | --- |
| `'required'` | run fails with `PTY_NOT_AVAILABLE` | run fails with `PTY_NOT_AVAILABLE` |
| `'preferred'` (default) | **observable** `debug`/`warn` event naming `PTY_NOT_AVAILABLE`, then the run continues on ordinary pipes | run fails with `PTY_NOT_AVAILABLE` |

Default: `'required'` when the adapter declares `capabilities.requiresPty`,
otherwise `'preferred'`.

An **absent** optional peer is the only condition that may ever degrade a run to
pipes, and that degradation is always announced first:

```ts
const handle = client.run({ agent: 'claude', prompt: 'hi', interactive: true });
handle.on('debug', (event) => {
  if (event.level === 'warn' && event.message.includes('PTY_NOT_AVAILABLE')) {
    // the run is on pipes, not a TTY
  }
});
```

An installed-but-unusable `node-pty` (native binding compiled for a different
Node.js ABI, missing prebuild, no free PTY device) is an **environment defect**,
not an absent optional dependency: it fails loudly in both modes rather than
silently downgrading. Use `npm rebuild node-pty` after switching Node versions.

`loadPtyModule()`, `ptyFallbackIsPermitted()`, `resolvePtyMode()`,
`PtyNotAvailableError`, and the `PtyMode` / `PtyLoadResult` types are exported
from the package root for callers that want to probe PTY availability up front.

## Release Verification

Use the package-local release checks to confirm the documented export map still
matches the packed package surface:

```bash
npm run build --workspace=@a5c-ai/comm-adapter
npm run test --workspace=@a5c-ai/comm-adapter
npm run verify:release --workspace=@a5c-ai/comm-adapter
npm pack --json --dry-run --workspace=@a5c-ai/comm-adapter
```

Release reviewers should be able to confirm from this README that the package
intentionally publishes the root, `browser`, `kanban`, and `automation`
subpaths and that all of them remain backed by `dist/*.js` and `dist/*.d.ts`
artifacts.

## Docs

- [Agent Adapter docs](../../../docs/adapters/README.md)
- [Reference mirror](../../../docs/adapters/reference/01-core-types-and-client.md)
- [Package family entrypoint](../README.md)

## License

MIT © a5c-ai
