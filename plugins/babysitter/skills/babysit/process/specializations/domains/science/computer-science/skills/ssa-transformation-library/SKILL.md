---
name: ssa-transformation-library
description: SSA-form transformations and optimizations for compiler intermediate representations
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
    - LLVM IR
    - SSA libraries
    - Compiler frameworks
  processes:
    - compiler-optimization-design
---

# SSA Transformation Library Skill

## Purpose

Provides SSA (Static Single Assignment) form transformation capabilities for implementing efficient compiler optimizations.

## Capabilities

- **SSA Construction**: Build SSA form using dominance
- **Phi Node Management**: Insert and eliminate phi nodes
- **SSA Optimizations**: Apply SSA-based optimization templates
- **Dominance Trees**: Compute dominance and dominator trees
- **Use-Def Chains**: Analyze use-definition relationships

## Usage Guidelines

1. **SSA Construction**
   - Compute dominance frontier
   - Place phi nodes at join points
   - Rename variables with subscripts

2. **Optimization Application**
   - Apply constant propagation
   - Perform dead code elimination
   - Execute copy propagation

3. **SSA Destruction**
   - Eliminate phi nodes
   - Insert copies on edges
   - Return to conventional form

4. **Best Practices**
   - Maintain SSA properties
   - Verify dominance relationships
   - Handle critical edges
   - Document transformation effects
