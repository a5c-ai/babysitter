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
2. [V6 Vision](v6-vision.md)
3. [V6 Architecture Specification](v6-architecture-specification.md)
4. [V6 Implementation Roadmap](v6-implementation-roadmap.md)
5. [Package Specifications](package-specs.md)

Use these as constraints:

- [Adversarial Improvements](adversarial-improvements.md)
- [Adversarial Unified Impossibility Synthesis](adversarial-unified-impossibility-synthesis.md)
- [Adversarial V6 Architecture Specification Analysis](adversarial-v6-architecture-specification-analysis.md)

## Document Map

Core planning documents:

- [System Overview](system-overview.md) - current system boundaries and ecosystem position
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
