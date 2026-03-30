---
name: ssa-transformation-library
description: SSA-form transformations and optimizations for compiler development
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

# SSA Transformation Library

## Purpose

Provides expert guidance on SSA (Static Single Assignment) form transformations for compiler optimization.

## Capabilities

- SSA construction (dominance-based)
- Phi node insertion and elimination
- SSA-based optimization templates
- Dominance tree computation
- Use-def chain analysis
- SSA destruction for code generation

## Usage Guidelines

1. **CFG Analysis**: Analyze control flow graph
2. **Dominance**: Compute dominance frontiers
3. **SSA Construction**: Insert phi nodes and rename variables
4. **Optimization**: Apply SSA-based optimizations
5. **Destruction**: Convert back for code generation

## Tools/Libraries

- LLVM IR
- GCC GIMPLE
- SSA libraries
