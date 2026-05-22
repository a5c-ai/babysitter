# Success Metrics & Validation Criteria

→ [Implementation Index](../README.md#implementation) | Related: [Testing Framework](../testing-framework.md) | [Performance Considerations](../performance-docs.md)

## Purpose

This document defines how V6 implementation work is judged successful without implying a broader maturity level than the roadmap currently supports.

The current minimum acceptable V6 bar is:

- coherent documentation,
- one validated executable slice,
- explicit rollback notes,
- a decision framework for whether any further extraction is earned.

Anything beyond that bar is deferred unless a specific slice owner, command, threshold, and enforcement point already exist.

## Current Normative Scoreboard

| Dimension | What Is Normative Now | Evidence Required |
|-----------|------------------------|-------------------|
| Documentation coherence | Core V6 docs tell one bounded story about current reality, accepted slice language, and deferred work | Roadmap, architecture, package, and implementation docs agree on scope and non-goals |
| Executable proof | At least one narrow slice is implemented and validated | Named commands/tests pass for the slice and rollback is documented |
| Compatibility discipline | Any compatibility claim is attached to an explicit surface | Compatibility notes and targeted validation for the touched surface |
| Measurement discipline | A performance or packaging target is only normative when it names a baseline, command, threshold, owner, and miss path | Slice contract or checked-in job definition |

## Deferred Scoreboard

These remain possible future outcomes, but they are not V6 acceptance criteria today:

- repo-wide performance targets,
- blanket readiness claims,
- blanket "zero regression" language,
- trend-based regression detection,
- repo-wide coverage percentages,
- generalized monitoring or observability promises that are not tied to an accepted slice.

## Phase Success Criteria

### Phase 0: Baseline And Decision Framing

Success means:

- candidate moves are bounded with owners, validation plans, and rollback paths,
- baseline packaging, performance, and compatibility measurements exist where claims are being made,
- at least one slice is small enough to validate without cross-repo churn.

### Phase 1: Documentation And Naming Stabilization

Success means:

- the docs clearly separate current reality from deferred architecture,
- target vocabulary is consistent across the core V6 documents,
- no core explanation depends on speculative APIs, monitoring systems, or repo-wide quality promises.

### Phase 2: First Executable Slice

Success means:

- one narrow slice ships with passing targeted commands and tests,
- compatibility notes and rollback steps are written for the touched surface,
- any performance or packaging claim for the slice is attached to an explicit measurement contract.

### Phase 3: Evaluate Whether Further Extraction Is Earned

Success means:

- the first slice is assessed for payoff versus migration cost,
- the repo either approves one next bounded slice or explicitly stops at the validated-docs-plus-one-slice state,
- follow-on work is justified by evidence rather than architectural preference.

### Phase 4: Optional Follow-On Slices Or Polish

Success means:

- only accepted slices with named owners and gates introduce stronger quality or performance targets,
- package-scoped coverage or benchmark gates are only normative where they are declared and enforced,
- optimization work stays optional unless it directly supports an approved slice or release gate.

## Measurement Contracts

### Performance And Packaging

Package-level bundle goals, broad memory targets, generic startup goals, and other optimization claims are exploratory until they are attached to a current executable slice.

| Claim Type | Status Today | What Must Exist Before It Becomes Normative |
|-----------|--------------|---------------------------------------------|
| Bundle size changes | Exploratory unless slice-scoped | Baseline source, named measurement command, threshold, and fallback |
| Memory usage claims | Exploratory unless slice-scoped | Scenario definition, named profiling procedure, threshold, and fallback |
| Startup or plugin latency claims | Exploratory unless slice-scoped | Named benchmark command, threshold, owner, and miss handling |
| Monitoring-based regression claims | Deferred unless enforced | Maintained harness, owner, alert path, and release gate |

The linked [Performance Considerations](../performance-docs.md) document is the source of truth for when a number becomes a target instead of a planning hypothesis.

### Quality Metrics

| Aspect | Normative Rule | Validation | Success Condition |
|--------|----------------|------------|-------------------|
| Test Coverage | Only package-scoped coverage gates declared by the owning package are normative | Automated coverage tools and package CI jobs | Each declared package gate passes |
| API Compatibility | Compatibility claims must be tied to an explicit compatibility surface and test suite | Compatibility test suite → [Testing Framework](../testing-framework.md) | Declared compatibility checks pass and documented breaking changes are intentional |
| Security Validation | Security release claims require documented scanning and review scope | Security scanning → [Security Architecture](../security-architecture.md) | Release-blocking findings are resolved or explicitly accepted |

## Rollback And Risk Readiness

V6 implementation work is only successful when rollback expectations match the actual scope of the phase or slice.

- each accepted phase or slice has a documented rollback procedure with preconditions, restoration steps, and acceptance evidence,
- data and configuration rollback claims are only made where the affected surface is actually in scope,
- recoverability language should describe decision points and verification steps, not generic recovery-time promises.

## User And Operator Impact

The current bar is conservative:

- feature parity claims must reference an explicit workflow inventory,
- deployment simplification claims must be tied to a validated setup or release path,
- error-rate, observability, or operations-readiness claims are only normative where baseline collection and ownership exist.

## Validation Procedures

### Automated Validation

Use automated validation language only where the corresponding command or gate exists today.

- CI/build/test commands may support slice-specific quality claims,
- performance regression detection is deferred unless a maintained benchmark harness, owner, and gate exist,
- security scanning claims require documented tooling and scope,
- compatibility validation requires an explicit touched surface and named checks.

### Manual Validation

Manual validation remains acceptable for the current maturity level when it is explicit and bounded:

- stakeholder review at phase boundaries with named decisions,
- user acceptance testing for the touched workflow,
- security review for the affected surface,
- performance spot checks only where the slice defines what is being measured.

---

**Related Documents**: [Testing Framework](../testing-framework.md) | [Performance Considerations](../performance-docs.md) | [Risk Mitigation](risk-mitigation.md)
