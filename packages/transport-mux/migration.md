# transport-mux migration closure

## Current runtime truth

`packages/transport-mux` is the active JS package behind the `amux-proxy` binary in this repo.
The live control-plane path is:

1. `packages/agent-mux/cli/src/commands/launch.ts`
2. `packages/agent-mux/core/src/provider-resolver.ts`
3. `packages/agent-mux/adapters/src/translate-for-harness.ts`
4. `packages/transport-mux`

This document is not a speculative roadmap. It is the closure checklist for finishing the cutover cleanly.

## What must stay stable

- binary name: `amux-proxy`
- env contract: `AMUX_PROXY_*`
- launcher behavior in `packages/agent-mux/cli/src/commands/launch.ts`
- open `GET /health` and `GET /v1/models`
- proxy auth on protocol routes via `x-api-key` or bearer auth

## Package verification gates

Run these commands before treating the package surface as healthy:

```bash
npm run build --workspace=@a5c-ai/transport-mux
npm run test --workspace=@a5c-ai/transport-mux
npm run build:agent-mux
npm run test:agent-mux
```

The package-level gates prove the `amux-proxy` binary, config helpers, route contract, and test-backed protocol surface still hold. The agent-mux gates prove the launcher path still resolves providers, picks harness transports, and spawns the proxy through the stable env contract.

## Closure checklist

The migration is complete only when every item below is true.

### 1. Package docs are current

- `packages/transport-mux/README.md` describes `transport-mux` as the current runtime package, not a future direction.
- install and verification guidance uses the real Node workspace commands shown above.
- active docs point operators at `packages/transport-mux/README.md`, `packages/transport-mux/architecture.md`, and this file.

### 2. Launcher path is verified

- `packages/agent-mux/cli/src/commands/launch.ts` still spawns `amux-proxy` and rewrites harness env vars for the proxy URL.
- `packages/agent-mux/core/src/provider-resolver.ts` remains the canonical provider-resolution source.
- `packages/agent-mux/adapters/src/translate-for-harness.ts` remains the canonical transport-selection source.

### 3. Publish surfaces are converged

- release workflows pack and publish `@a5c-ai/transport-mux` from `packages/transport-mux/package.json`.
- staging workflows do the same for prerelease publication.
- package docs no longer imply that the runtime ships from a different package surface.

Current blocker:
- the repo release and staging workflows do not yet publish `@a5c-ai/transport-mux`.

### 4. CI surfaces are converged

- CI runs the transport-mux workspace build/test gates as part of the normal repo path.
- doc and package references do not imply a second runtime truth outside the Node workspace.

Current blocker:
- transport-mux is buildable and testable locally, but the repo-wide workflow references still need explicit convergence.

### 5. Legacy container and package surfaces are retired or clearly archived

- legacy `amux-proxy` package/container surfaces are either removed from the active operational path or explicitly marked historical.
- operators are not asked to infer whether the container, package, and launcher truth live in different places.

Current blocker:
- legacy package and container assets still exist under `packages/agent-mux/amux-proxy` and `packages/agent-mux/meta/github/workflows`.

## Done criteria

Do not call this migration closed until:

- the JS package passes the verification gates
- the launcher path remains stable on `AMUX_PROXY_*`
- docs describe the JS package as the only active runtime truth for this path
- publish, CI, and container surfaces no longer split operational truth across legacy and current package assumptions

## Main risk

The real failure mode is not a broken route handler. It is operational drift: launcher behavior, docs, package publication, and container references silently describing different runtime truths. This checklist exists to keep those surfaces converged.
