# transport-mux

`transport-mux` is the published transport/proxy runtime seam used by the agent-mux launcher and related runtime consumers.

<!-- docs-status:start -->
> Status: Public family package.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> This README defines the package contract for the published transport/proxy runtime seam used by agent-mux.
<!-- docs-status:end -->

## Current status

This workspace carries the runtime, tests, and package entrypoints used by published agent-mux packages. It is expected to be installable from npm alongside the rest of the public agent-mux family.

## Intended seam

The control-plane shape is:

1. `packages/agent-mux/cli/src/commands/launch.ts` decides whether a proxy is needed.
2. `packages/agent-mux/core/src/provider-resolver.ts` resolves canonical provider config.
3. `packages/agent-mux/adapters/src/translate-for-harness.ts` chooses the harness-facing protocol contract.
4. `packages/transport-mux` is the package seam where that future runtime can converge once cutover work is complete.

Historical references still exist under `packages/agent-mux/amux-proxy`, but this package is now the active JS runtime seam for published launcher flows.

## What this package means right now

- it is a published npm deliverable used by the agent-mux CLI/runtime stack
- `src/config.ts`, `src/server.ts`, `src/runtime.ts`, and `src/types.ts` provide the transport/proxy runtime seam consumed by launcher flows
- package entrypoints and the `amux-proxy` bin are part of the public runtime surface
- the docs capture the protocol/provider split and the current runtime boundary

## Placeholder contract notes

- `POST /v1/count_tokens` now delegates to provider-aware token counting through the runtime completion engine and returns `{ "count": number }`, matching the legacy `amux-proxy` cutover target instead of a local JSON-length heuristic. Invalid JSON and provider/request failures return explicit error responses, and providers without token-count support return `501`.
- `GET /metrics` and `GET /cache/stats` are retained for cutover parity with the legacy proxy. `/metrics` exposes in-process request/error/token counters; `/cache/stats` returns `{ "enabled": false }` until this package owns a real cache implementation.
- `/passthrough/*` is expected to strip only the `/passthrough` prefix, preserve the remaining path and query string, and fail with `501` when no completion engine or resolvable upstream `apiBase` exists.

## Operator checks

Use these workspace gates when changing the runtime seam or its migration docs:

```bash
npm run build --workspace=@a5c-ai/transport-mux
npm run test --workspace=@a5c-ai/transport-mux
npm run scorecard:migration --workspace=@a5c-ai/transport-mux
```

Passing those commands proves the runtime seam still compiles, its runtime tests still pass, and the migration scorecard still sees metadata and docs that match the published runtime policy.

## Current document set

- [Architecture](./architecture.md): intended protocol/provider boundaries and route contract
- [Migration](./migration.md): release-owner policy, validation gates, and archived legacy references
