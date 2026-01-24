---
name: pyzx-simplifier
description: PyZX integration skill for ZX-calculus based quantum circuit simplification and verification
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
  category: circuit-design
  domain: quantum-computing
  tools:
    - PyZX
    - ZX-calculus
    - Graph rewriting
  processes:
    - quantum-circuit-design-and-optimization
    - circuit-equivalence-verification
    - quantum-compiler-development
---

# PyZX Simplifier Skill

## Purpose

Provides ZX-calculus based quantum circuit simplification capabilities for reducing circuit complexity, verifying circuit equivalence, and extracting optimized circuits from ZX-diagrams.

## Capabilities

- **ZX-Diagram Construction**: Build ZX-diagrams from quantum circuits
- **Graph Simplification**: Apply ZX-calculus rewrite rules
- **Circuit Extraction**: Extract optimized circuits from simplified diagrams
- **Equivalence Checking**: Verify circuit equivalence via ZX-calculus
- **T-Count Optimization**: Minimize T-gate count for fault tolerance
- **Visualization**: Display ZX-diagrams and transformations

## Usage Guidelines

1. **Diagram Creation**
   - Convert circuits to ZX-diagrams
   - Import from various formats
   - Configure spider representation

2. **Simplification**
   - Apply full_reduce for maximum simplification
   - Use targeted rewrite rules
   - Monitor diagram size during simplification

3. **Circuit Extraction**
   - Extract circuits from graph-like diagrams
   - Verify extraction success
   - Compare with original circuit

4. **Best Practices**
   - Use for T-count optimization
   - Verify equivalence post-simplification
   - Document transformation sequences
   - Profile simplification time for large circuits
