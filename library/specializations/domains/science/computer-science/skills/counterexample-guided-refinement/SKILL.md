---
name: counterexample-guided-refinement
description: Implement CEGAR for synthesis and verification workflows
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
  category: program-synthesis
  phase: 6
---

# Counterexample-Guided Refinement

## Purpose

Provides expert guidance on CEGAR (Counterexample-Guided Abstraction Refinement) for verification and synthesis.

## Capabilities

- Counterexample analysis
- Predicate abstraction refinement
- Interpolation-based refinement
- Abstraction refinement loop management
- Convergence analysis
- Spurious counterexample detection

## Usage Guidelines

1. **Initial Abstraction**: Define initial abstraction
2. **Verification**: Check abstract model
3. **Counterexample Analysis**: Analyze counterexamples
4. **Refinement**: Refine abstraction if spurious
5. **Iteration**: Repeat until verified or real counterexample

## Tools/Libraries

- CPAChecker
- SeaHorn
- BLAST
- SLAM
