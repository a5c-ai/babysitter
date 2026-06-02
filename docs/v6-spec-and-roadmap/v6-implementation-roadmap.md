---
title: V6 Implementation Roadmap
description: Gated roadmap for the smallest validated V6 slice and the phases that follow from it.
last_updated: 2026-04-26
---

# V6 Implementation Roadmap

## Status

- Status: Draft under revision
- Planning mode: gated execution plan
- Bias: smallest validated slice first

## 1. Roadmap Principles

This roadmap is not a wish list. Each phase exists to answer a concrete question about viability. A phase only starts when its entry criteria are met and only continues while its validation signals remain positive.

Common requirements for every phase:

- define the exact scope before coding,
- identify the commands and tests that will prove the change,
- document rollback before rollout,
- stop when a slice is creating more system surface than it removes.

## 2. Phase 0: Baseline And Decision Framing

### Purpose

Create the evidence needed to avoid a speculative V6.

### Entry Criteria

- current package boundaries are documented,
- current install, build, and plugin flows are known,
- adversarial findings are summarized into actionable constraints.

### Work

- write decision records for any rename or extraction candidate,
- capture current commands, tests, and install paths affected by each candidate,
- define the baseline measurements for packaging, performance, and compatibility.

### Exit Criteria

- candidate moves are ranked by expected payoff and risk,
- each candidate has an owner, validation plan, and rollback path,
- at least one small slice is ready to implement without cross-repo ambiguity.

### Kill Criteria

- no candidate can be bounded cleanly,
- proposed changes depend on simultaneous repo-wide churn,
- there is no trustworthy way to validate current behavior.

## 3. Phase 1: Documentation And Naming Stabilization

### Purpose

Reduce ambiguity before structural change.

### Work

- align architecture docs around normative vs deferred decisions,
- identify names that are useful as target vocabulary versus names that should remain internal,
- document compatibility expectations for existing package and plugin consumers.

### Validation Artifacts

- updated architecture specification,
- updated roadmap,
- updated package responsibility tables,
- explicit list of deferred and invalidated ideas.

### Exit Criteria

- the docs describe one coherent V6 story,
- target readers can distinguish current reality from future exploration,
- no core doc depends on speculative APIs to explain the plan.

## 4. Phase 2: First Executable Slice

### Purpose

Ship one small architecture improvement that proves the V6 method works.

### Candidate Slice Types

- a rename with compatibility handling,
- an internal extraction inside an existing package,
- a packaging/compiler correction driven by real manifest or install failures,
- a leaf utility split with isolated tests.

### Entry Criteria

- a decision record exists,
- the slice touches a narrow file set or subsystem,
- tests and install flows that must continue working are known,
- rollback is cheap.

### Exit Criteria

- targeted commands still pass,
- compatibility notes are written,
- the slice reduces ambiguity or coupling in a way that can be demonstrated.

### Selected Slice

The currently selected first executable slice is documented in [ADR-001: Babysitter-Agent Seam Contract As The First Executable V6 Slice](./decisions/ADR-001-agent-platform-seam-contract.md).

Current validation command:

```bash
npm run verify:v6:seams
```

Why this slice was selected:

- it already exists in code,
- it stays within one package boundary,
- rollback is cheap,
- it converts V6 seam language into an executable validation gate.

### Kill Criteria

- the slice forces unrelated packages to move together,
- test scope grows materially beyond the proposed seam,
- plugin/install compatibility breaks without a contained fix.

## 5. Phase 3: Evaluate Whether Further Extraction Is Earned

### Purpose

Decide from evidence, not desire, whether deeper decomposition should continue.

### Work

- compare the cost and payoff of the first slice,
- check whether internal boundaries became clearer or more fragile,
- identify whether another slice is justified.

### Exit Criteria

- either approve the next extraction candidate with evidence,
- or stop and declare V6 complete at the documentation and internal-boundary stage.

### Kill Criteria

- benefits are mostly rhetorical,
- migration overhead now dominates engineering value,
- the repo is easier to reason about without further splitting.

## 6. Phase 4: Optional Follow-On Slices

This phase is optional. It only exists if earlier slices show real payoff.

Allowed work in this phase:

- additional small extractions with independent validation,
- selective naming cleanup backed by compatibility shims,
- improved package ownership boundaries that reduce release risk.

Disallowed work in this phase:

- broad package creation without repeated proof,
- sweeping public API commitments for future concepts,
- new architectural layers introduced only to match an abstract diagram.

## 7. Cross-Phase Validation

Every phase should produce these artifacts:

- decision record,
- change summary,
- validation results,
- rollback notes,
- unresolved risks.

Recommended validation categories:

- build and test commands directly affected by the slice,
- plugin installation or manifest validation when packaging is touched,
- documentation consistency checks for renamed concepts,
- performance spot checks when bundle or startup claims are involved.

Current V6-facing commands that can be cited today are:

- `npm run verify:v6:seams`
- `npm run lint --workspace=@a5c-ai/babysitter-sdk`
- `npm run build:sdk`
- `npm run test:sdk`
- `npm run build:hooks-mux`
- `npm run test:hooks-mux`
- `npm run build:agent-mux`
- `npm run test:agent-mux`
- `npm run build --workspace=@a5c-ai/agent-mux-tasks`
- `npm run typecheck --workspace=@a5c-ai/agent-mux-tasks`
- `npm run test --workspace=@a5c-ai/agent-mux-tasks`
- `npm run build --workspace=@a5c-ai/agent-mux-extensions`
- `npm run test --workspace=@a5c-ai/agent-mux-extensions`
- `npm run verify:metadata`
- `npm run docs:qa`
- `npm run validate:ci --prefix plugins/<plugin>`

Those commands justify build, test, packaging, metadata, and docs-QA claims only. They do not yet justify architectural-boundary or interface-contract enforcement claims.

## 8. Measurement Expectations

Performance and packaging claims must specify:

- baseline source,
- measurement command,
- acceptable threshold,
- escalation path if missed.

If a claim cannot meet that bar, it should be phrased as a hypothesis instead of a target.

Repo-wide targets such as "all performance targets met", "zero regressions", or trend-based regression detection are not minimum-acceptable V6 gates unless a concrete slice owner, measurement command, and enforcement point already exist.

## 8A. Current Slice: Architecture-Gate Validation

This slice is now implemented for the current repo boundaries.

### Purpose

Turn architecture-boundary language into an executable gate instead of documentation intent, while leaving interface-contract validation deferred until a narrower contract slice is ready.

### Owners

- SDK maintainers own the new gate commands.
- CI maintainers own workflow wiring in `.github/workflows/ci.yml`.
- V6 documentation owners own promotion of related claims after the gates exist.

### Planned Commands

- `npm run test:architecture` for repository architecture-boundary checks
- `npm run test:contracts` for repository interface-contract checks

Only `npm run test:architecture` is a current repository guarantee in this slice. The contract command remains deferred; Docker-based E2E coverage is being reset and is not a current gate.

### Implemented Scope

`npm run test:architecture` currently enforces:

- the `@a5c-ai/agent-platform` seam contract already accepted in ADR-001,
- repo package-family dependency direction across the orchestration core, dispatch layer, cross-harness support systems, downstream consumers, and first-class install bundles.

The gate runs in:

- `.github/workflows/ci.yml`,
- `.github/workflows/release.yml`,
- `.github/workflows/staging-publish.yml`.

### Exit Criteria

- the new commands exist and pass locally,
- the new commands run in CI,
- V6 docs are updated to cite those commands explicitly where claims depend on them.

### Remaining Deferred Work

- `npm run test:contracts` remains deferred until a concrete cross-package contract slice is written down precisely enough to fail deterministically.
- Docker-based E2E coverage is being reset from scratch and is not a current repository gate.

## 9. Deliverables By Maturity Level

### Minimum Acceptable V6

- coherent architecture docs,
- explicit non-goals,
- one validated executable slice,
- documented decision framework for future extraction,
- success metrics scoped to the validated slice and the docs that support it.

### Strong V6

- minimum V6 plus:
- at least one successful internal boundary improvement,
- compatibility and rollback guidance proven on a real change,
- measurable reduction in ambiguity around packaging and ownership,
- broader quality or performance targets only where a named owner and gate exist.

### Overreach Signal

The roadmap is overreaching if it starts requiring:

- many packages to move in lockstep,
- large invented APIs before implementation,
- speculative operational and distributed-system detail with no immediate consumer.

## 10. Immediate Next Steps

1. Finish revising the core V6 documents to match this gated model.
2. Review existing candidate renames and extractions against the new criteria.
3. Select the smallest executable slice with real payoff.
4. Validate it through repository commands and plugin/runtime behavior.
5. Reassess whether a second slice is justified.

For the current revision, steps 3 and 4 are anchored by ADR-001 and `npm run verify:v6:seams`; the next open question is whether any second slice is earned.

---

Related documents: [V6 Architecture Specification](v6-architecture-specification.md), [Package Specifications](package-specs.md), [Performance & Documentation](performance-docs.md)
