---
name: loop-invariant-generator
description: Automatically generate and verify loop invariants for algorithm correctness proofs
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: computer-science
  domain: science
  category: algorithm-analysis
  phase: 6
graph:
  domains: [domain:computer-science]
  specializations: [specialization:theoretical-computer-science]
  skillAreas: [skill-area:compiler-implementation, skill-area:mathematical-reasoning, skill-area:language-design]
  workflows: [workflow:research-grant-lifecycle]
  roles: [role:computational-scientist, role:research-scientist]
---

# Loop Invariant Generator

## Purpose

Provides expert guidance on generating and verifying loop invariants for algorithm correctness proofs using formal methods.

## Capabilities

- Infer candidate loop invariants from code structure
- Verify initialization, maintenance, and termination conditions
- Generate formal proof templates
- Handle nested loops and complex data structures
- Export to theorem provers (Dafny, Why3)
- Suggest invariant strengthening

## Usage Guidelines

1. **Code Analysis**: Analyze loop structure and identify key properties
2. **Candidate Generation**: Generate candidate invariants from code patterns
3. **Verification**: Check initialization, maintenance, termination
4. **Strengthening**: Refine invariants to prove desired properties
5. **Export**: Generate proof obligations for theorem provers

## Tools/Libraries

- Dafny
- Why3
- SMT solvers (Z3, CVC5)
- Static analysis frameworks
