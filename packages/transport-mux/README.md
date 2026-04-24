# transport-mux

`transport-mux` now exports a minimal TypeScript config/server/runtime surface that satisfies the package contract tests, but it is still not the published or cut-over runtime behind `amux-proxy` today.

## Current status

This workspace now carries design intent, tests, and a real testable server/config/runtime surface in `src/`. Until launcher ownership, packaging, and CI cut over to it, it should still not be treated as the runtime truth for proxy execution or publication.

## Intended seam

The intended control-plane shape remains:

1. `packages/agent-mux/cli/src/commands/launch.ts` decides whether a proxy is needed.
2. `packages/agent-mux/core/src/provider-resolver.ts` resolves canonical provider config.
3. `packages/agent-mux/adapters/src/translate-for-harness.ts` chooses the harness-facing protocol contract.
4. `packages/transport-mux` would eventually own the exposed protocol handling and provider execution path.

That is still a target architecture, not a completed cutover.

## What this package does mean right now

- the package name reserves the seam inside the workspace
- `src/config.ts`, `src/server.ts`, and `src/types.ts` provide the test-backed contract runtime used by this workspace
- the docs capture the intended protocol/provider split
- the tests describe the surface that a future executable implementation must satisfy

## What this package does not mean yet

- it is not an active npm publication target
- it does not ship the `amux-proxy` executable
- it is not the sole operational runtime truth for proxy execution in this repo

## Operator checks

Use these workspace gates when changing the placeholder seam or its design docs:

```bash
npm run build --workspace=@a5c-ai/transport-mux
npm run test --workspace=@a5c-ai/transport-mux
```

Passing those commands does not prove the package is ready for publication or cutover. It only proves the placeholder workspace still compiles and that its test-backed contract remains documented.

## Current document set

- [Architecture](./architecture.md): intended protocol/provider boundaries and route contract
- [Migration](./migration.md): remaining work required before this seam can be published or cut over
