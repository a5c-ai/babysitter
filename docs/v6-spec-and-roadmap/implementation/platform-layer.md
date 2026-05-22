# Platform Layer Implementation

→ [Implementation Index](../README.md#implementation) | Previous: [Foundation Layer](foundation-layer.md) | Next: [Application Layer](application-layer.md)

## Phase 2: Platform Layer

The platform layer builds on the foundation by hardening plugin, session, and extensibility behavior in the current stack. It does not assume that deferred `agent-platform*` package names have already been approved as V6 deliverables.

### Core Platform Implementation

**Plugin Framework**
- Improve plugin lifecycle behavior through existing SDK, compiler, and `plugins/*` surfaces → [Plugin Ecosystem](../plugin-ecosystem.md)
- Validate plugin dependency and manifest handling against current install and packaging flows
- Treat marketplace, governance, and isolation work as measured slices, not abstract platform promises
- Describe metaplugins as capability composition above concrete plugin and hook bundles, without requiring a new package boundary

**Session Management Evolution**
- Clarify session ownership across `packages/babysitter-agent`, `packages/sdk`, and plugin integration points
- Improve persistence, context propagation, and recovery only where the current runtime already exposes those seams
- Keep session changes rollbackable and testable without introducing broad cross-package churn

### Candidate Slice Areas

**Metaplugin Composition**
- Document composition rules for higher-order capability bundles on top of current plugin and hook surfaces
- Validate whether hook-type extension or pipeline processing can remain internal to current packages
- Promote a standalone package only if a later ADR proves that the seam reduces coupling more than it adds API surface

**Orchestration Integration**
- Keep Babysitter orchestration integration expressed through current packages and plugin bundles
- Treat orchestration-plugin vocabulary as exploratory only unless a decision record changes its classification
- Preserve process-library and SDK integration as present-day implementation surfaces

If a future standalone package is ever pursued here, it should host proved composition logic rather than replace concrete plugin packaging. The current repository evidence still treats unified plugins and per-harness bundles as the install surfaces, with `extension-mux` compiling those outputs.

## Deliverables

- Improved plugin/session documentation and implementation slices within current packages
- Manifest, install, and recovery validation for the plugin and session flows actually shipped today
- Evidence for or against deeper platform extraction recorded as ADR inputs
- Tooling and plugin integration still working through the current architecture surfaces

## Technical Validation

**Plugin Compatibility Testing**: Manifest correctness, install flows, and generated bundle behavior → [Testing Framework](../testing-framework.md)

**Session Persistence Validation**: Recovery and consistency verification in the packages that currently own session state

**Dependency Resolution Checks**: Correctness verification only for logic that already exists or is being added as a bounded slice

**Cross-Platform Compatibility**: Windows, macOS, Linux validation for current commands and plugins

**Deferred Vocabulary Guardrail**: `@a5c-ai/agent-platform`, `@a5c-ai/agent-platform-meta-plugins`, and `@a5c-ai/agent-platform-orchestration-plugin` remain non-deliverables in this phase

## Explicit Non-Deliverables

This phase does not create new `agent-platform*` top-level packages. It only earns the right to propose them later by proving real seams in current-package work.

---

**Related Documents**: [Foundation Layer](foundation-layer.md) | [Plugin Ecosystem](../plugin-ecosystem.md) | [Security Architecture](../security-architecture.md)
