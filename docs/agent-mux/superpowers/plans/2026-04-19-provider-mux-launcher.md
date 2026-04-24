# Provider Mux & Launcher Implementation Plan

## Status

This file is archived historical context from the April 19, 2026 planning pass.
Do not use it as the active operational source for `amux-proxy`.

The current runtime truth for this path now lives in:

- `packages/transport-mux/README.md`
- `packages/transport-mux/migration.md`
- `packages/transport-mux/architecture.md`

## Why this file was retired

The original plan described an active implementation track for a separate proxy package and related packaging/container work. The launcher path in this repo now resolves through the JS transport-mux package instead, so keeping the earlier plan in the active operational path created split runtime truth.

## What remains useful here

- historical sequencing context for the early provider-mux rollout
- evidence of the earlier task breakdown and naming
- background for why the runtime and publication surfaces later needed convergence cleanup

## Operator note

When checking the current cutover state, use the transport-mux package docs and their verification commands. Treat any implementation details that used to appear in this archived plan as historical unless they are restated in the active transport-mux docs.
