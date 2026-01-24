---
name: data-flow-analysis-framework
description: Design and implement data-flow analyses for compiler optimizations
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
metadata:
  version: "1.0"
  category: compiler-optimization
  domain: computer-science
  tools:
    - LLVM
    - GCC internals
    - Static analysis frameworks
  processes:
    - compiler-optimization-design
    - abstract-interpretation-analysis
---

# Data Flow Analysis Framework Skill

## Purpose

Provides data-flow analysis design capabilities for implementing compiler optimizations through forward and backward analyses.

## Capabilities

- **Forward Analysis**: Specify forward data-flow analyses
- **Backward Analysis**: Specify backward data-flow analyses
- **Lattice Definition**: Define and verify analysis lattices
- **Transfer Functions**: Generate transfer functions
- **Fixpoint Computation**: Implement worklist algorithms

## Usage Guidelines

1. **Analysis Design**
   - Define lattice of abstract values
   - Specify direction (forward/backward)
   - Define transfer functions

2. **Implementation**
   - Build control flow graph
   - Implement worklist algorithm
   - Compute fixpoint solution

3. **Verification**
   - Verify lattice properties
   - Check monotonicity of transfers
   - Validate soundness

4. **Best Practices**
   - Prove analysis soundness
   - Document lattice structure
   - Test on diverse programs
   - Consider efficiency
