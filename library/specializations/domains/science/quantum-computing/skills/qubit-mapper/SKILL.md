---
name: qubit-mapper
description: Qubit mapping and routing skill for hardware topology optimization
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
  category: hardware-integration
  phase: 6
---

# Qubit Mapper

## Purpose

Provides expert guidance on mapping logical qubits to physical hardware while respecting connectivity constraints and minimizing SWAP overhead.

## Capabilities

- Initial qubit placement
- SWAP gate insertion
- Routing optimization algorithms
- Topology-aware compilation
- Noise-aware placement
- Heavy-hex and grid topology support
- Dynamic circuit routing
- Parallel SWAP optimization

## Usage Guidelines

1. **Topology Analysis**: Understand target hardware connectivity graph
2. **Initial Placement**: Use heuristics for initial logical-physical mapping
3. **Routing**: Insert SWAPs to enable non-native interactions
4. **Optimization**: Minimize SWAP count and circuit depth
5. **Noise Consideration**: Prefer high-fidelity qubits and links

## Tools/Libraries

- Qiskit
- pytket (t|ket>)
- Cirq
- BQSKit
- NetworkX
