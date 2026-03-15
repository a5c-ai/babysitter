---
name: tket-compiler
description: Cambridge Quantum (Quantinuum) t|ket> compiler skill for platform-independent circuit optimization
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

# TKET Compiler

## Purpose

Provides expert guidance on platform-independent quantum circuit compilation using t|ket>, enabling optimized deployment across multiple hardware backends.

## Capabilities

- Multi-platform compilation
- Phase gadget optimization
- Clifford simplification
- Routing and placement algorithms
- Noise-aware compilation
- Circuit rewriting strategies
- Predicate-based pass selection
- Backend targeting

## Usage Guidelines

1. **Pass Selection**: Choose compilation passes based on circuit characteristics
2. **Backend Targeting**: Configure compilation for specific hardware architectures
3. **Optimization Strategy**: Balance compilation time with output quality
4. **Noise Awareness**: Incorporate calibration data for noise-aware routing
5. **Verification**: Validate compiled circuits meet backend constraints

## Tools/Libraries

- pytket
- pytket-qiskit
- pytket-cirq
- pytket-braket
- pytket-quantinuum
