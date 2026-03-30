---
name: trotter-simulator
description: Hamiltonian simulation skill using Trotter-Suzuki decomposition
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
  category: quantum-chemistry
  phase: 6
---

# Trotter Simulator

## Purpose

Provides expert guidance on Hamiltonian simulation using Trotter-Suzuki decomposition for quantum dynamics and chemistry calculations.

## Capabilities

- First-order Trotterization
- Higher-order product formulas
- Time step optimization
- Error bound analysis
- Randomized compilation
- Resource estimation
- Symmetry preservation
- Real-time evolution

## Usage Guidelines

1. **Hamiltonian Analysis**: Decompose Hamiltonian into simulatable terms
2. **Order Selection**: Choose Trotter order based on accuracy requirements
3. **Step Optimization**: Determine time step for error budget
4. **Circuit Generation**: Build Trotterized evolution circuits
5. **Error Analysis**: Estimate and bound Trotter errors

## Tools/Libraries

- Qiskit
- Cirq
- OpenFermion
- PennyLane
- TensorNetwork
