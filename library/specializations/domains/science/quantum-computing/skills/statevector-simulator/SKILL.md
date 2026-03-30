---
name: statevector-simulator
description: Full state vector simulation skill for exact quantum circuit evaluation
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
  category: simulation
  phase: 6
---

# Statevector Simulator

## Purpose

Provides expert guidance on exact quantum circuit simulation using full state vector methods for algorithm validation and analysis.

## Capabilities

- Dense state vector simulation
- GPU-accelerated simulation (cuQuantum)
- State visualization
- Entanglement entropy calculation
- Fidelity computation
- Memory-efficient techniques
- Intermediate state inspection
- Measurement probability analysis

## Usage Guidelines

1. **Qubit Scaling**: Understand memory limits (2^n amplitudes)
2. **Simulation Setup**: Configure simulator backend and precision
3. **Execution**: Run circuits with full state tracking
4. **Analysis**: Extract amplitudes, probabilities, and entanglement
5. **Validation**: Compare with expected theoretical results

## Tools/Libraries

- Qiskit Aer
- Cirq
- cuStateVec (NVIDIA cuQuantum)
- QuTiP
- NumPy
