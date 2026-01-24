---
name: counterexample-guided-refinement
description: Implement CEGAR (counterexample-guided abstraction refinement) for synthesis and verification
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
  category: program-synthesis
  domain: computer-science
  tools:
    - CPAChecker
    - SeaHorn
    - CEGAR tools
  processes:
    - program-synthesis-specification
    - abstract-interpretation-analysis
    - model-checking-verification
---

# Counterexample-Guided Refinement Skill

## Purpose

Provides CEGAR implementation capabilities for iterative abstraction refinement in verification and synthesis.

## Capabilities

- **Counterexample Analysis**: Analyze spurious counterexamples
- **Predicate Refinement**: Refine predicate abstraction
- **Interpolation Refinement**: Use interpolation for refinement
- **Loop Management**: Manage abstraction-refinement loop
- **Convergence Analysis**: Analyze CEGAR convergence

## Usage Guidelines

1. **Initial Abstraction**
   - Define initial abstract domain
   - Set coarse abstraction
   - Verify abstract model

2. **Refinement Loop**
   - Check property on abstract model
   - Analyze counterexamples
   - Refine abstraction

3. **Convergence**
   - Monitor refinement progress
   - Detect divergence early
   - Apply heuristics for efficiency

4. **Best Practices**
   - Start with coarse abstractions
   - Use interpolation when available
   - Document refinement history
   - Handle non-convergence gracefully
