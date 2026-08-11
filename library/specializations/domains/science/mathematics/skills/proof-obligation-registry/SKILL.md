---
name: proof-obligation-registry
description: Maintain durable proof-obligation registries with profile coverage and semantic ledgers
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: mathematics
  domain: science
  category: theorem-proving
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:mathematical-reasoning, skill-area:technical-writing]
  workflows: [workflow:research-validation, workflow:quality-convergence]
  roles: [role:research-scientist, role:computational-scientist]
---

# Proof Obligation Registry

## Purpose

Extract, merge, and maintain a persistent proof state whose omissions and stale evidence are mechanically visible.

## Inputs

Problem statement, source artifact paths/hashes, optional draft, domain profile, optional prior registry, strictness, and run workspace.

## Procedure

1. Inventory definitions, quantified claims, external theorems, algorithms/reductions, complexity claims, and document references.
2. Assign stable IDs; merge prior records by ID and preserve history.
3. Build the hypothesis ledger and connect each use.
4. Build the use-site audit with exact substitutions, side conditions, signs, domains, and path tuples.
5. Instantiate every profile boundary row; require evidence or a reasoned N/A.
6. Populate random-distribution and convergence ledgers when expectations/limits occur.
7. Populate exact-arithmetic/bit-complexity rows for oracle or rational reductions.
8. Populate theorem-reference targets and uses.
9. For every selected module, populate each ledger named by `profile.requiredLedgers`, link at least one record to that module's applicable obligation, and close every such record before publication; an empty required ledger fails.
10. Mark uncertain records open; never self-certify them verified.
11. Run `python validators/validate_registry.py ...` as an `expectedExitCode: 0` shell gate; publication always uses `--strict publication`.

## Failure handling

- Missing source/hash: stop before extraction.
- Prior required ID removed: restore it as stale and trigger scope breakpoint.
- Rejection: append reason/history, reopen affected records, refine, and rerun validation.
- Unjustified N/A, unresolved dependency, or verified-without-evidence: hard failure.

## Output

Registry JSON, edge-matrix JSON, unresolved IDs, scope changes, and validation transcript. Agent prose cannot override the gate.
