---
name: pyzx-simplifier
description: ZX-calculus based circuit simplification skill for advanced quantum circuit optimization
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: quantum-computing
  domain: science
  category: circuit-design
  phase: 6
---

# PyZX Simplifier

## Purpose

Provides expert guidance on ZX-calculus based circuit simplification, enabling powerful optimization through graphical quantum circuit representation.

## Capabilities

- ZX-diagram representation of circuits
- Full simplification via ZX-calculus rules
- T-count minimization
- Clifford circuit extraction
- Ancilla-free circuit optimization
- Visualization of ZX-diagrams
- Circuit-to-graph conversion
- Equality verification

## Usage Guidelines

1. **Conversion**: Transform quantum circuits to ZX-diagrams for analysis
2. **Simplification**: Apply ZX-calculus rewrite rules for optimization
3. **T-Minimization**: Focus on T-gate reduction for fault-tolerant computing
4. **Extraction**: Convert optimized ZX-diagrams back to circuits
5. **Visualization**: Generate visual representations for understanding and debugging

## Tools/Libraries

- PyZX
- ZX-calculus
- NetworkX
- Matplotlib
