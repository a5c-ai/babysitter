---
name: mathematical-artifact-validation
description: Run fail-closed deterministic validation for mathematical and LaTeX artifacts
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
metadata:
  specialization: mathematics
  domain: science
  category: mathematical-validation
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:mathematical-reasoning, skill-area:technical-writing]
  workflows: [workflow:research-validation, workflow:quality-convergence]
  roles: [role:research-scientist, role:computational-scientist]
---

# Mathematical Artifact Validation

## Purpose

Produce reproducible source, structure, and reference evidence. Static validation is not mathematical proof verification.

## Inputs

Source paths, LaTeX artifact, optional BibTeX files, required sections, registry, tool policy, and output manifest paths.

## Shell-only gates

1. `validate_sources.py`: strict UTF-8, nonempty files, no `U+FFFD`, SHA-256 manifest.
2. `validate_math_artifact.py`: braces/environments, required sections, labels, references, theorem target numbering/type, citations.
3. `validate_registry.py`: durable evidence and coverage invariants.
4. `validate_grade.py`: rubric arithmetic/current hashes.
5. Optional compiler command: execute a locally available TeX tool in a run-owned output directory and preserve version, argv, exit code, stdout/stderr, and output hash.

Every task declares `expectedExitCode: 0`. Required-tool unavailability follows policy and is never represented as pass. An agent may classify diagnostics but may not override a failed shell result.

## Security and portability

Use structured file paths, a run-owned workspace, Python standard library, and no Node. Never use lossy decoding. Never overwrite source or prior round artifacts.

## Output

Machine-readable gate manifest with `pass|fail|unavailable`, command/tool version where applicable, exit code, findings, evidence paths, and an explicit claim boundary.
