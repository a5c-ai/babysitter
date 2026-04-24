# transport-mux migration backlog

## Current status

`packages/transport-mux` is not the active `amux-proxy` runtime today. The package entrypoint is still mostly skeletal, so this document tracks the work required before the seam can be treated as executable, publishable, or cut over.

## Why this file exists

The repo already pays some of the cost of extraction: a package name, dedicated docs, and tests that describe a desired runtime contract. Until the implementation boundary is real, this file exists to prevent the package metadata and docs from overstating that status.

## What would need to stay stable once cutover begins

- binary name: `amux-proxy`
- env contract: `AMUX_PROXY_*`
- launcher behavior in `packages/agent-mux/cli/src/commands/launch.ts`
- open `GET /health` and `GET /v1/models`
- proxy auth on protocol routes via `x-api-key` or bearer auth

## Package verification gates

Run these commands when editing this workspace:

```bash
npm run build --workspace=@a5c-ai/transport-mux
npm run test --workspace=@a5c-ai/transport-mux
npm run scorecard:migration --workspace=@a5c-ai/transport-mux
```

Those checks do different jobs:

- `build` and `test` validate the placeholder TypeScript workspace and its JS contract tests.
- `scorecard:migration` ties that result back to the legacy Python contract, launcher ownership, docs, CI, and packaging surfaces.

Passing the workspace checks alone does not prove that the package is ready to publish or that the launcher/runtime path has converged on this seam.

## Migration scorecard

Retire legacy truth only when every row below is green.

| Surface | Current validation truth | Green means | Current status |
| --- | --- | --- | --- |
| Legacy Python contract truth | `packages/agent-mux/amux-proxy/tests/*.py` still pins the historical `amux-proxy` behavior. | The legacy tree is removed or clearly archived because launcher, JS runtime, docs, CI, and packaging all converge on `packages/transport-mux`. | Yellow: legacy Python tests still exist and remain part of the migration story. |
| JS package contract truth | `npm run build`, `npm run test`, and `npm run scorecard:migration` under `@a5c-ai/transport-mux`. | The package owns both the executable runtime surface and the scorecard proving how it replaced the legacy seam. | Green for explicit validation coverage, but not proof of cutover by itself. |
| Launcher/runtime ownership | `packages/agent-mux/cli/src/commands/launch.ts`, `packages/agent-mux/core/src/provider-resolver.ts`, and `packages/agent-mux/adapters/src/translate-for-harness.ts`. | The launcher path resolves into the runtime exported from `packages/transport-mux` rather than an independent proxy path. | Red: the launcher still reasons about proxy config/env without importing a transport-mux runtime surface. |
| Docs honesty | `packages/transport-mux/README.md`, `packages/transport-mux/architecture.md`, and this file. | Operators can tell, from docs alone, whether `transport-mux` is a placeholder or the active runtime. | Green: docs call the workspace a placeholder and define cutover prerequisites explicitly. |
| Publish + CI ownership | Root release/staging workflows plus legacy `packages/agent-mux/meta/github/workflows/*`. | Release and staging workflows intentionally publish `@a5c-ai/transport-mux`, and legacy `amux-proxy` publish/CI paths are removed or archived. | Red: root workflows do not publish `@a5c-ai/transport-mux`, while legacy `amux-proxy` publish/CI workflows still exist. |
| Binary/container ownership | Legacy `amux-proxy` package/container surfaces and any future package-local executable surface. | The `amux-proxy` binary/container path is either owned here or explicitly marked historical-only everywhere else. | Red: legacy binary/container ownership still lives outside this package. |

The scorecard exists to make the split validation surface explicit: JS package tests can pass while migration completion remains red because launcher, publish, or legacy-runtime retirement work is still outstanding.

## Publication and cutover prerequisites

Do not publish or cut over this package until every item below is true.

### 1. The package exports a real runtime surface

- `packages/transport-mux/src/` exports the real server/config/runtime modules described by the tests and architecture docs.
- the package entrypoint is more than placeholder metadata.
- the `amux-proxy` executable exists here if this package is meant to own that binary.

### 2. Docs describe the seam honestly

- `packages/transport-mux/README.md` describes this workspace as either a placeholder or an active runtime, never both.
- `packages/transport-mux/architecture.md` is treated as intended design until the implementation catches up.
- this file is used as a backlog for remaining work, not as closure proof.

### 3. Launcher/runtime ownership is proven

- `packages/agent-mux/cli/src/commands/launch.ts` actually resolves into the runtime surface exported by this package.
- `packages/agent-mux/core/src/provider-resolver.ts` and `packages/agent-mux/adapters/src/translate-for-harness.ts` stay aligned with that runtime.
- operators no longer have to infer whether runtime truth lives in `packages/transport-mux` or elsewhere.

### 4. Publish and CI surfaces are converged

- release workflows intentionally publish `@a5c-ai/transport-mux` from this package.
- staging workflows do the same for prerelease publication.
- CI treats this package as an active runtime package only after the executable surface exists.

### 5. Legacy surfaces are retired or clearly archived

- legacy `amux-proxy` package/container surfaces are either removed from the active operational path or explicitly marked historical.
- operators are not asked to infer whether the container, package, and launcher truth live in different places.

## Current blockers

- `src/index.ts` still exports placeholder metadata instead of the runtime surface described by the tests.
- `package.json` previously advertised a public package and `amux-proxy` bin without that executable surface existing here.
- repo docs and adjacent plans still contain references that can be read as if the cutover already happened.
- legacy package and container assets still exist under `packages/agent-mux/amux-proxy` and `packages/agent-mux/meta/github/workflows`.

## Done criteria

Only treat this migration as complete once the runtime surface exists here, the launcher path actually uses it, the scorecard is green end to end, and the publish/CI/docs surfaces stop splitting operational truth.

## Main risk

The real failure mode is still operational drift: package metadata, launcher docs, release surfaces, and implementation state silently describing different runtime truths. This backlog exists to keep those surfaces honest until the seam is executable.
