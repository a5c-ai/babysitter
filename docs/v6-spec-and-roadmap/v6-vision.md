# V6 Architecture Vision

→ [Documentation Index](README.md) | Previous: [Current State](current-state.md) | Next: [Package Specifications](package-specs.md)

## Vision Statement

The V6 vision is disciplined evolution, not architectural maximalism. The goal is to make the Babysitter stack easier to change, validate, and reason about by extracting only what is proven, documenting what is deferred, and refusing to treat speculative structure as progress.

## Core Principles

1. Current repository reality outranks future architecture diagrams.
2. Staged extraction outranks upfront decomposition.
3. Validation and rollback outrank elegance.
4. Explicit non-goals outrank ambiguous ambition.
5. Adversarial findings are design constraints, not side commentary.

## What V6 Optimizes For

V6 optimizes for:

- clearer ownership boundaries,
- safer incremental change,
- fewer speculative package commitments,
- documentation that constrains decisions instead of inflating them,
- compatibility with existing CLI, harness, and plugin workflows.

## What V6 Does Not Optimize For

V6 does not currently optimize for:

- achieving the most modular diagram possible,
- maximizing package count,
- promising broad isolation or governance features before they exist,
- locking the repo into a distributed architecture story.

## Decision Filters

When choosing between "keep in place" and "extract," V6 uses these filters:

1. Is the seam already visible in code and tests?
2. Does extraction reduce coupling or only rename it?
3. Can the change be validated with current repository commands?
4. Is rollback cheap and credible?
5. Would the same goal be met by better internal boundaries instead of a new package?

If the answer set is weak, the work should stay internal or deferred.

## Deferred Future Concepts

Deeper layered vocabulary may still be useful for thinking:

- runtime,
- platform,
- orchestration,
- application packages.

But in V6 these are planning concepts, not automatic implementation commitments.

## Success Condition For The Vision

This vision succeeds if the repository reaches a state where:

- documentation is coherent and realistic,
- at least one small structural improvement is validated end to end,
- future architectural moves are constrained by evidence rather than enthusiasm.

---

**Related Documents**: [System Overview](system-overview.md) | [V6 Architecture Specification](v6-architecture-specification.md) | [V6 Implementation Roadmap](v6-implementation-roadmap.md)
