---
name: data-flow-analysis-framework
description: Design and implement data-flow analyses for compiler optimization
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
  category: compiler-optimization
  phase: 6
---

# Data Flow Analysis Framework

## Purpose

Provides expert guidance on designing and implementing data-flow analyses for compiler optimization and program analysis.

## Capabilities

- Forward/backward analysis specification
- Lattice definition and verification
- Transfer function generation
- Fixpoint computation (worklist algorithm)
- Analysis soundness verification
- Interprocedural analysis

## Usage Guidelines

1. **Lattice Design**: Define abstract domain and lattice
2. **Transfer Functions**: Define transfer functions for statements
3. **Analysis Direction**: Specify forward or backward
4. **Fixpoint**: Implement worklist algorithm
5. **Verification**: Verify soundness of analysis

## Tools/Libraries

- LLVM
- GCC internals
- Soot
- WALA
