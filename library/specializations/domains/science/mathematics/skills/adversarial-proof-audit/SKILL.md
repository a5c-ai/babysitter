---
name: adversarial-proof-audit
description: Audit immutable mathematical artifacts through isolated evidence-focused review lenses
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
metadata:
  specialization: mathematics
  domain: science
  category: theorem-verification
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:mathematical-reasoning, skill-area:technical-writing]
  workflows: [workflow:research-validation, workflow:quality-convergence]
  roles: [role:research-scientist, role:computational-scientist]
---

# Adversarial Proof Audit

## Purpose

Obtain independent, location-specific challenge evidence rather than overlapping confidence judgments.

## Inputs

Immutable artifact path/SHA-256, validated registry, profile, round ID, rubric, gate manifest, and one assigned lens.

## Lens isolation

- Dependency/use-site: obligation DAG, hypotheses, substitutions, path tuples.
- Reconstruction/counterexample: derive from definitions and challenge finite/boundary cases.
- Boundary/exact-complexity: domain edges, convergence, reductions, oracle and bit model.
- Ambiguity/theorem-reference: definition/use consistency, notation, numbered targets.

Do not read another lens report before submitting. Do not edit the artifact.

## Reviewer-diversity contract

The four lenses are evidence roles, not four independent truth oracles. For a high-stakes external review, record for each reviewer the provider/model or human identity class, model/version when available, prompt-template version, tool access, and prior-report exposure. Use at least one reviewer from a different model family/provider or a qualified human for the reconstruction/counterexample lens when available. A same-family fallback is permitted only when its lack of diversity is disclosed; it must use a fresh context, must not see other reports, and must not be described as independent verification. Reviewer diversity reduces shared-failure risk but does not establish mathematical truth.

## Formal-tool and external evidence

A proof assistant, SMT solver, CAS, exhaustive finite checker, or custom verifier counts only as scoped corroborating evidence. Record the exact claim checked, formal statement or encoding, assumptions/axioms, tool and version, command/configuration, input and output hashes, result, and the remaining informal translation gap. Tool success must never be generalized beyond the encoded claim or relabeled as verification of the complete proof.

Before an external publication or similarly consequential use, obtain an artifact-hash-bound review outside the authoring loop. The reviewer should reconstruct critical claims from definitions, inspect hypotheses and boundary cases, reproduce deterministic/formal-tool commands, sample-check formalization-to-prose correspondence, record disagreements, and sign/date a checklist with scope and unresolved items. Missing external verification is disclosed evidence debt, not silently treated as pass.

## Finding requirements

Stable finding ID; lens; obligation IDs; category; severity; exact path/locator; concrete input/state leading to failure; positive deduction; focused repair; evidence reference.

## Gate

Write JSON, then run `python validators/validate_grade.py ...` with `expectedExitCode: 0`. Recompute score and deductions; reject stale hashes, duplicate IDs, unresolved obligations, perfect claims with findings/blockers/gate failures, or repair closure without a fresh round.

## Disagreement and repair

Material factual disagreement triggers a breakpoint. Majority vote is not resolution. `reject-and-refine` opens a focused obligation and forces a new artifact/hash, four fresh reports, and deterministic reruns. Stop after the configured bound.
