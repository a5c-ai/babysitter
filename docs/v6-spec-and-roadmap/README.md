---
title: V6 Spec and Roadmap
description: Planning and architecture documents for the current V6 evolution of the Babysitter stack.
last_updated: 2026-04-26
category: landing
---

# a5c.ai V6 Spec And Roadmap

This directory documents a pragmatic V6 evolution for the Babysitter stack. The intent is not to describe the biggest possible modular future. The intent is to define the smallest architecture change that is worth shipping, can be validated against the current repository, and leaves room for later extraction if the seams prove real.

## Current Position

The repository already contains the important building blocks:

- `packages/sdk` is the stable center of gravity.
- `packages/babysitter` and `packages/babysitter-agent` provide the CLI and agent runtime.
- `plugins/` contains the real harness integrations and their packaging constraints.
- The adversarial reviews show that a broad "split everything into many packages" plan is not yet justified.

V6 therefore treats adversarial analysis as a design input, not an appendix.

## What V6 Is

V6 is a staged architecture program with three goals:

1. Reduce accidental coupling in the current stack where there is already a proven seam.
2. Improve naming, documentation, and validation so future extractions are deliberate instead of aspirational.
3. Ship changes in slices that can be rolled back without destabilizing the existing toolchain.

## What V6 Is Not

V6 does not currently commit to:

- a full package explosion across runtime, platform, governance, memory, cost, and observability,
- a distributed or remotely coordinated plugin architecture as a first move,
- speculative security or isolation guarantees that are not backed by implementation and validation artifacts,
- performance claims without a measurement method and fallback plan.

## Reading Order

Start here:

1. [System Overview](system-overview.md)
2. [Glossary](glossary.md)
3. [Unified Stack Architecture](unified-stack-architecture.md)
4. [Stack Guide](stack-guide.md)
5. [V6 Vision](v6-vision.md)
6. [V6 Architecture Specification](v6-architecture-specification.md)
7. [V6 Implementation Roadmap](v6-implementation-roadmap.md)
8. [Package Specifications](package-specs.md)

Use these as constraints:

- [Current State Analysis](current-state.md)
- [Architecture Comparison](architecture-comparison.md)
- [V6 Architecture Specification](v6-architecture-specification.md)

## Document Map

Core planning documents:

- [System Overview](system-overview.md) - current system boundaries and ecosystem position
- [Glossary](glossary.md) - canonical terminology for the unified Babysitter, agent-mux, and mux-support stack
- [Unified Stack Architecture](unified-stack-architecture.md) - how the current monorepo stack fits together end to end
- [Stack Guide](stack-guide.md) - where to start reading and which package/docs own which concerns
- [Current State Analysis](current-state.md) - repository reality and pain points
- [V6 Vision](v6-vision.md) - principles, non-goals, and decision filters
- [V6 Architecture Specification](v6-architecture-specification.md) - normative architecture for the next executable stage
- [V6 Implementation Roadmap](v6-implementation-roadmap.md) - gated rollout plan with entry, exit, and kill criteria
- [Package Specifications](package-specs.md) - bounded package responsibilities and extraction triggers

Supporting modules:

- [Agent-Mux Integration](agent-mux-integration.md)
- [Performance & Documentation](performance-docs.md)
- [Testing Framework](testing-framework.md)
- [Security Architecture](security-architecture.md)
- [Plugin Ecosystem](plugin-ecosystem.md)

## First Executable Slice

The currently selected first executable V6 slice is the `@a5c-ai/babysitter-agent` seam contract. It keeps the existing package boundary intact while making runtime-domain ownership, subpath exports, and validation gates explicit.

- Decision record: [ADR-001: Babysitter-Agent Seam Contract As The First Executable V6 Slice](./decisions/ADR-001-babysitter-agent-seam-contract.md)
- Repo-level validation command: `npm run verify:v6:seams`

## Implementation

Implementation-phase docs live under `implementation/` and describe what each roadmap phase is allowed to ship without promoting deferred package vocabulary into scope.

## Decision Records

Decision records for concrete V6 structural moves live under `decisions/`. If a proposed rename, extraction, or seam change does not have a decision record, it is still design exploration rather than an accepted V6 slice.

## Maturity Standard

Each major V6 document should answer five questions clearly:

1. What is normative now?
2. What is deferred?
3. What has been invalidated by adversarial review?
4. How will the claim be measured or validated?
5. What is the rollback path if the change fails?

If a section cannot answer those questions, it is design exploration rather than specification.

## Status

- Status: In revision
- Version: 6.0.0 draft
- Last updated: April 2026
