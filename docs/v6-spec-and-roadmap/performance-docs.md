# Performance Considerations & Documentation

→ [Documentation Index](README.md) | Previous: [Testing Framework](testing-framework.md)

## Purpose

This document defines how V6 should talk about performance and documentation quality. It is intentionally conservative. If a claim is not tied to a baseline, a measurement method, and a fallback plan, it is a hypothesis rather than a target.

## Performance Rules

Any V6 performance target must include:

- baseline source,
- measurement command or procedure,
- acceptance threshold,
- fallback action if the threshold is missed.

If a document cannot name a current slice and its measurement command or procedure, it should not publish a normative numeric target. In that case the document should explicitly mark the figure as exploratory or omit it.

## Current Maturity Position

At the current documentation stage, V6 does not commit to broad numeric performance improvements across many future packages. Earlier optimistic figures were useful as pressure tests, but they are not mature commitments without implementation context.

## Acceptable Near-Term Targets

The only near-term performance targets that are mature enough to discuss are targets attached to a specific executable slice, for example:

- plugin compilation or manifest validation latency for a compiler change,
- install-time regression checks for plugin packaging,
- bundle or startup impact for a narrowly scoped internal extraction.

Each of those must name the exact package, command, and comparison baseline.

## Documentation Quality Gates

The documentation set should be judged with concrete checks:

- required core files exist,
- markdown links resolve,
- placeholder markers are absent,
- normative, deferred, and invalidated ideas are distinguishable,
- roadmap claims have validation and rollback framing,
- architectural or readiness claims name the exact command or workflow that proves them.

## Validation Framing For Testing And Readiness Claims

Testing, architecture, and readiness language follows the same evidence rules as performance targets.

If a document claims that a boundary, contract, or operational posture is enforced, it should also name:

- the repository command or workflow that performs the check,
- the scope of the check,
- what failure would block promotion of the claim.

If the document cannot do that, the claim should be marked as deferred, exploratory, or absent. Architectural intent alone is not validation evidence.

## Failure Handling

If a target is missed, the default response is not to redefine success silently. The default response is to:

1. record the miss,
2. explain the tradeoff,
3. decide whether to narrow scope, accept the cost, or roll back.

## Documentation Standard

Performance sections in V6 docs should avoid:

- numbers detached from measurement method,
- claims about packages that do not yet exist,
- performance promises that assume broad decomposition is automatically faster,
- "production ready" language without operational evidence,
- architecture-compliance language without a named proving surface.

## Recommended Metrics For Real Slices

When a concrete slice is chosen, use a small metric set:

- before/after command duration,
- before/after artifact size if packaging changes,
- pass/fail compatibility checks,
- observed regressions and explicit acceptance decision.

---

**Related Documents**: [V6 Architecture Specification](v6-architecture-specification.md) | [V6 Implementation Roadmap](v6-implementation-roadmap.md) | [Current State Analysis](current-state.md)
