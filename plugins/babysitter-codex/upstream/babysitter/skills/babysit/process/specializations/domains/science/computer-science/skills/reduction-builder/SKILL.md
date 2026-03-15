---
name: reduction-builder
description: Construct and verify polynomial-time reductions between computational problems
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
  category: complexity-theory
  phase: 6
---

# Reduction Builder

## Purpose

Provides expert guidance on constructing polynomial-time reductions for NP-completeness proofs and problem classification.

## Capabilities

- Gadget library for common reductions (3-SAT, Vertex Cover, etc.)
- Reduction verification (correctness in both directions)
- Polynomial-time verification
- Visualization of gadget constructions
- Generate reduction documentation
- Chain multiple reductions

## Usage Guidelines

1. **Problem Analysis**: Understand source and target problem structures
2. **Gadget Selection**: Choose or design appropriate gadgets
3. **Reduction Construction**: Build the polynomial-time mapping
4. **Correctness Proof**: Prove both directions of the reduction
5. **Time Analysis**: Verify polynomial running time

## Tools/Libraries

- Graph visualization
- LaTeX documentation
- Formal verification tools
