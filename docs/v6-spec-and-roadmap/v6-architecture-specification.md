# a5c.ai V6 Architecture Specification

## Status

- Status: Draft under adversarial revision
- Version: 6.0.0
- Scope: next executable architecture stage, not the maximum future decomposition

## 1. Executive Summary

V6 is a controlled architecture evolution of the existing Babysitter stack. It does not assume that the repository should be decomposed into a large family of new packages immediately. Instead, V6 defines a bounded target state:

- keep `packages/sdk` as the primary stable core,
- keep the current CLI and agent runtime packages operational,
- extract or rename only seams that are already visible in code and operational workflows,
- require a written validation case before each structural move.

This specification is intentionally narrower than earlier drafts. Large-scale decomposition, ambitious security claims, and speculative API surfaces are deferred until the repository demonstrates that those seams pay for themselves.

## 2. Design Inputs

V6 is constrained by four inputs:

1. The current repository structure and working commands are the source of truth.
2. Adversarial analyses are binding design constraints.
3. Existing users must have a rollback path for every migration slice.
4. Documentation must distinguish normative decisions from exploration.

## 3. Normative Decisions

The following decisions are in scope for V6 unless explicitly changed by a decision record.

### 3.1 Keep The Current Center Of Gravity

`packages/sdk` remains the architectural center. New boundaries must be justified relative to the SDK rather than described as a greenfield rewrite.

### 3.2 Prefer Staged Extraction Over Upfront Decomposition

No new package should be created unless all of the following are true:

- the code already forms a coherent seam,
- the seam has a concrete owner and test surface,
- extraction reduces coupling or release risk,
- the migration can be validated and rolled back independently.

### 3.3 Separate Normative, Deferred, And Invalidated Material

Every major architecture topic must be classified as one of:

- Normative: expected to ship in the next executable stage.
- Deferred: plausible later work, but not a current commitment.
- Invalidated: rejected by adversarial review or current repo reality.

### 3.4 Treat Security And Isolation Claims As Earned

V6 may describe security goals, but it must not claim hard isolation, capability enforcement, or process boundaries without implementation evidence and explicit test coverage. "Plugin-safe" language is non-normative unless backed by a measurable enforcement mechanism.

### 3.5 Tie Performance Targets To Measurement

Any target must include:

- a baseline source,
- a measurement command or method,
- an acceptance threshold,
- a fallback if the threshold is missed.

## 4. Non-Goals

The following are explicitly not committed for the current V6 stage:

- full replacement of the current package layout,
- extraction of governance, memory, cost, and observability into independent packages,
- remote or distributed plugin execution as a baseline architecture,
- complete redesign of the harness adapter model,
- broad public API promises for packages that do not yet exist.

## 5. Architecture Shape For The Next Stage

### 5.1 Repository-Level Target

The next stage keeps the current monorepo shape and improves it in place:

- `packages/sdk`: continue as the durable runtime/orchestration core.
- `packages/babysitter`: remain the primary CLI package.
- `packages/babysitter-agent`: remain the agent runtime while internal seams are clarified.
- `plugins/*`: remain first-class integration boundaries and packaging reality checks.
- `.a5c/processes` and process-library integration: remain orchestration delivery mechanisms.

### 5.2 Candidate Extractions

The only extraction candidates that should be actively documented now are:

- naming and packaging improvements around existing plugin compilation and hook multiplexing tools,
- internal module boundaries inside the agent runtime,
- small leaf utilities or subsystems whose tests and interfaces already stand on their own.

Each candidate requires a decision record before implementation.

### 5.3 Deferred Architecture

The following may become real later, but are not part of the current normative target:

- `agent-runtime`,
- `agent-platform`,
- `agent-platform-meta-plugins`,
- `agent-platform-orchestration-plugin`,
- `babysitter-agent` as a renamed or re-scoped top-level package.

These names can remain as exploratory vocabulary, but they are not yet committed deliverables.
Implementation plans may mention them only as exploratory labels or appendix material. They must not appear as phase deliverables, package-creation steps, or success criteria unless a later decision record explicitly promotes them into scope.

That deferment does not mean metaplugins are absent from the current stack. V6 can describe metaplugins as a present-day capability abstraction over plugin and hook surfaces, including on legacy non-Babysitter agents. What is deferred is the standalone package vocabulary around them. The concrete delivery path that exists now is unified plugin authoring plus compiled per-harness bundles, with `extension-mux` acting as the compiler rather than the metaplugin layer itself.

## 6. Decision Record Requirements

Any structural change proposed under V6 must include a short ADR or equivalent record with:

- problem statement,
- current-state evidence,
- proposed move,
- alternatives rejected,
- validation plan,
- rollback plan,
- kill criteria.

If the change cannot be expressed in that format, it is not mature enough to schedule.

## 7. Validation Gates

Every architecture slice must clear these gates before it is considered done.

### 7.1 Entry Criteria

- current-state behavior is described,
- relevant commands and tests are identified,
- ownership is clear,
- the migration and rollback path are documented.

### 7.2 Exit Criteria

- targeted tests pass,
- documentation is updated,
- existing install or runtime flows still work,
- any renamed or extracted artifact has compatibility notes.

### 7.3 Kill Criteria

The slice should stop or roll back if:

- compatibility requires broad simultaneous changes across unrelated packages,
- the extraction adds more interface surface than it removes coupling,
- the migration cannot be validated with the current repo tooling,
- performance or packaging regressions are detected without a clear containment plan.

## 8. Architecture Topic Classification

### 8.1 Normative Now

- tighten current package boundaries in documentation,
- clarify naming intent without forcing immediate renames,
- define extraction gates and decision records,
- document performance and security claims conservatively,
- use plugin manifests and package outputs as reality checks for the compiler/toolchain.
- document metaplugins as capability-level abstractions over plugin and hook surfaces, and document `extension-mux` as the compiler and distribution path for the concrete bundles those abstractions need on legacy non-Babysitter agents.

### 8.2 Deferred

- deeper runtime/platform decomposition,
- broader plugin platform formalization,
- dedicated packages for governance, memory, cost, observability,
- enterprise identity, authorization, audit-integrity, and automated security-operations narratives unless they ship with implementation evidence and explicit test coverage,
- advanced marketplace and remote execution models.

### 8.3 Invalidated

- assuming a large decomposition is inherently an improvement,
- claiming process isolation or capability safety without proof,
- promising aggressive performance gains without baselines,
- specifying broad API surfaces for packages that do not yet exist.

## 9. Documentation Rules For V6

Architecture docs must:

- describe the repository as it exists before describing a target,
- say whether a section is normative or exploratory,
- avoid large invented API blocks unless the interface is needed for an imminent implementation,
- security architecture docs must keep normative content limited to implemented controls with repo evidence; unsupported identity, isolation, audit, or monitoring capabilities belong in deferred sections,
- cross-link to adversarial analyses when a claim was narrowed because of them.

## 10. Success Conditions

V6 is successful if it produces:

- a coherent and internally consistent architecture story,
- a roadmap that can be executed phase by phase,
- smaller, validated structural moves instead of a speculative big bang,
- documentation that constrains future work rather than inflating it.

## 11. Open Decisions

These still require explicit follow-up:

- which rename candidates, if any, should happen in the first executable slice,
- which harness-runtime internals have enough cohesion to extract safely,
- whether any package-level split is justified before the current CLI/plugin workflows are hardened further.

---

Related documents: [README](README.md), [V6 Implementation Roadmap](v6-implementation-roadmap.md), [Package Specifications](package-specs.md), [Current State Analysis](current-state.md)
