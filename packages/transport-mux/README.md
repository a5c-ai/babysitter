# transport-mux

`transport-mux` now owns the executable TypeScript runtime surface used by `amux launch` when a proxy protocol bridge is required, but it is still not the fully cut-over publish, CI, or container truth for `amux-proxy`.

## Current status

This workspace now carries design intent, tests, and a real launcher-owned runtime surface in `src/`. The remaining gap is operational convergence: publish, CI, and legacy binary/container surfaces still have to move here before the seam is fully cut over.

## Intended seam

The intended control-plane shape remains:

1. `packages/agent-mux/cli/src/commands/launch.ts` decides whether a proxy is needed.
2. `packages/agent-mux/core/src/provider-resolver.ts` resolves canonical provider config.
3. `packages/agent-mux/adapters/src/translate-for-harness.ts` chooses the harness-facing protocol contract.
4. `packages/transport-mux` now owns the in-process runtime that serves the exposed protocol surface for launcher-managed proxy sessions.

That is only a partial cutover. Publication and legacy retirement are still pending.

## What this package does mean right now

- the package owns the launcher-integrated runtime seam inside the workspace
- `src/config.ts`, `src/server.ts`, `src/runtime.ts`, and `src/types.ts` provide the executable runtime used by launcher-managed proxy sessions
- the docs capture the intended protocol/provider split
- the tests describe and verify the current executable JS runtime surface

## What this package does not mean yet

- it is not an active npm publication target
- it does not ship the `amux-proxy` executable
- it is not the sole operational runtime truth for proxy execution in this repo

## Operator checks

Use these workspace gates when changing the runtime seam or its cutover docs:

```bash
npm run build --workspace=@a5c-ai/transport-mux
npm run test --workspace=@a5c-ai/transport-mux
```

Passing those commands does not prove the package is ready for publication or full cutover. They prove the package runtime compiles, the package tests pass, and the migration scorecard still reflects the remaining non-runtime debt honestly.

## Current document set

- [Architecture](./architecture.md): intended protocol/provider boundaries and route contract
- [Migration](./migration.md): remaining work required before this seam can be published or cut over
