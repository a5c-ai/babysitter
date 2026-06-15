# Provider Adapter & Launcher Implementation Plan

## Status

This file is archived historical context from the April 19, 2026 planning pass.
Do not use it as the active operational source for `adapters-proxy`.

The current runtime truth for this path now lives in:

- `packages/transport-adapter/README.md`
- `packages/transport-adapter/migration.md`
- `packages/transport-adapter/architecture.md`

## Why this file was retired

The original plan described an active implementation track for a separate proxy package and related packaging/container work. The launcher path in this repo now resolves through the JS transport-adapter package instead, so keeping the earlier plan in the active operational path created split runtime truth.

## What remains useful here

- historical sequencing context for the early provider-adapter rollout
- evidence of the earlier task breakdown and naming
- background for why the runtime and publication surfaces later needed convergence cleanup

## Operator note

When checking the current cutover state, use the transport-adapter package docs and their verification commands. Treat any implementation details that used to appear in this archived plan as historical unless they are restated in the active transport-adapter docs.
