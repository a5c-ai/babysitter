---
name: smt-solver-interface
description: Interface with SMT solvers for verification and synthesis
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
  category: formal-verification
  phase: 6
graph:
  domains: [domain:computer-science]
  specializations: [specialization:theoretical-computer-science]
  skillAreas: [skill-area:compiler-implementation, skill-area:mathematical-reasoning, skill-area:language-design]
  workflows: [workflow:research-grant-lifecycle]
  roles: [role:computational-scientist, role:research-scientist]
---

# SMT Solver Interface

## Purpose

Provides expert guidance on using SMT solvers for automated reasoning, verification, and program synthesis.

## Capabilities

- Z3 query generation
- CVC5 interface
- Theory selection guidance
- Model extraction
- Unsat core analysis
- Incremental solving

## Usage Guidelines

1. **Encoding**: Encode problem in SMT-LIB format
2. **Theory Selection**: Choose appropriate theories
3. **Solving**: Run SMT solver
4. **Model Extraction**: Extract satisfying assignments
5. **Debugging**: Analyze unsat cores for debugging

## Tools/Libraries

- Z3
- CVC5
- Boolector
- Yices
