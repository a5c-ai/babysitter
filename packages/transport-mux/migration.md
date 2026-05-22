# transport-mux migration backlog

## Current status

`packages/transport-mux` is the published transport/proxy runtime seam used by the agent-mux release and staging pipelines. `amux launch` imports it as part of the public install chain.

## Why this file exists

This file records the current release-owner policy, the remaining historical references, and the conditions that must stay true while this package is part of the public install chain.

## Current artifact policy

- `@a5c-ai/transport-mux` is a public package in the agent-mux family.
- Package metadata must stay publishable and must accurately cover the shipped entrypoints.
- Docs must describe this package as the active JS transport/proxy runtime seam for published launcher flows.
- Referenced packaged artifacts must exist locally and be covered by the publish surface.

## Package verification gates

Run these commands when editing this workspace:

```bash
npm run build --workspace=@a5c-ai/transport-mux
npm run test --workspace=@a5c-ai/transport-mux
npm run scorecard:migration --workspace=@a5c-ai/transport-mux
```

Those checks verify the published seam honestly:

- `build` and `test` validate the TypeScript runtime seam used by published workspace consumers.
- `scorecard:migration` ties that result back to public-package metadata, doc honesty, and archived legacy references.

Historical archive: legacy Python tests under `packages/agent-mux/amux-proxy/tests` remain available as reference material for the still-active historical runtime path.

## Migration scorecard

The package is aligned only when every row below stays green.

| Surface | Current validation truth | Green means | Current status |
| --- | --- | --- | --- |
| Public package policy | `packages/transport-mux/package.json` plus `npm run scorecard:migration`. | The package is publishable, metadata-complete, and aligned with the public docs map. | Green: package metadata describes a public artifact with an auditable publish surface. |
| Workspace seam health | `npm run build` and `npm run test` under `@a5c-ai/transport-mux`. | Published consumers can still build against the seam confidently. | Green: the runtime seam compiles and tests cleanly. |
| Launcher/runtime seam | `packages/agent-mux/cli/src/commands/launch.ts` and `packages/transport-mux/src/index.ts`. | The launcher imports the runtime seam that the published package actually ships. | Green: workspace integration and package exports describe the same runtime truth. |
| Docs honesty | `packages/transport-mux/README.md`, `packages/transport-mux/architecture.md`, and this file. | Operators can tell, from package docs alone, that `transport-mux` is part of the public runtime chain. | Green: docs describe one active runtime seam and its remaining migration boundaries. |
| Historical references | `packages/agent-mux/amux-proxy/tests` and related legacy assets. | Legacy references remain inspectable without overriding the current release-owner package truth. | Green: historical assets stay explicit while public package claims stay current. |

The scorecard exists to keep the convergence explicit: if any future change breaks publishability, docs truth, or runtime ownership alignment, this document should go red again.

## Publication and runtime prerequisites

Keep the assertions below true while this package remains in the public runtime chain.

### 1. The package stays honest about being public

- `packages/transport-mux/package.json` remains publishable and aligned with the package docs map.
- package metadata does not advertise packable artifacts that are not present locally.
- release automation can rely on this package metadata as the runtime truth for the JS transport seam.

### 2. Docs describe the runtime seam honestly

- `packages/transport-mux/README.md` describes this workspace as the published runtime seam.
- `packages/transport-mux/architecture.md` remains the design reference for the runtime boundary.
- this file records the release-owner policy and the scorecard assertions that must stay true.

### 3. Launcher/runtime integration stays aligned

- `packages/agent-mux/cli/src/commands/launch.ts` resolves into the runtime surface exported by this package.
- `packages/agent-mux/core/src/provider-resolver.ts` and `packages/agent-mux/adapters/src/translate-for-harness.ts` stay aligned with that runtime.
- operators are not asked to infer a different package owner for the JS transport seam.

### 4. Future policy changes require an explicit coordinated update

- any future return to internal-only status or any deeper package split must land with package metadata, docs map, and workflow changes in the same change.
- any future `files`, `publishConfig`, or release-owner doc changes must stay aligned with the actual published artifact set.
- package artifact references must remain satisfiable.

### 5. Legacy surfaces stay explicit while migration follow-up continues

- legacy `amux-proxy` package/container surfaces are either kept as the clearer operational reference or explicitly marked historical.
- operators are not asked to infer that the container, package, and launcher truth is something other than the current package contract.
- legacy ops endpoints are an explicit retained surface during convergence: `transport-mux` keeps `GET /metrics` and `GET /cache/stats` instead of silently dropping them at cutover.
- `POST /v1/count_tokens` is also an explicit convergence surface: it should use provider-backed counting and the `{ "count": number }` response contract instead of placeholder local heuristics.
- until `transport-mux` owns a real response cache, `/cache/stats` must continue returning `{ "enabled": false }` explicitly so operators can distinguish "no cache implementation" from "missing endpoint".
- `/metrics` must continue exposing local request/error/token counters. Engine-backed requests contribute normalized token usage; passthrough requests contribute request/error counts even when upstream token usage cannot be normalized.

## Historical references that remain

- legacy Python tests remain under `packages/agent-mux/amux-proxy/tests` as historical reference material.
- archived workflow files remain under `packages/agent-mux/meta/github/workflows` so prior release history is still inspectable.
- architecture notes still describe how the old split worked so future refactors can explain the migration path.

## Done criteria

Treat this migration item as complete only while the package stays publishable, the package docs and metadata remain aligned, packaged-artifact references stay satisfied, legacy references remain explicit, and the retained ops endpoints stay documented and covered by tests.

## Main risk

The failure mode is still operational drift: package metadata, launcher docs, and package-map status silently describing different artifact policies. This document exists to keep those surfaces honest.
