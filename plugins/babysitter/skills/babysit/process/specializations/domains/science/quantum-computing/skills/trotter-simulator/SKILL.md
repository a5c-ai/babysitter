---
name: trotter-simulator
description: Trotterization skill for implementing Hamiltonian simulation via product formula decomposition
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
  category: quantum-chemistry
  domain: quantum-computing
  tools:
    - Qiskit
    - Cirq
    - OpenFermion
  processes:
    - hamiltonian-simulation-design
    - time-evolution-implementation
    - quantum-dynamics-simulation
---

# Trotter Simulator Skill

## Purpose

Provides Trotterization capabilities for decomposing Hamiltonian time evolution into implementable quantum gate sequences using Suzuki-Trotter product formulas.

## Capabilities

- **First-Order Trotter**: Basic product formula decomposition
- **Higher-Order Formulas**: Suzuki-Trotter 2nd, 4th order
- **Error Analysis**: Trotter error estimation
- **Step Optimization**: Optimize number of Trotter steps
- **Term Ordering**: Optimize Hamiltonian term ordering
- **Circuit Generation**: Generate gate sequences

## Usage Guidelines

1. **Hamiltonian Preparation**
   - Decompose into Pauli terms
   - Group commuting terms
   - Analyze term structure

2. **Formula Selection**
   - Choose Trotter order based on accuracy needs
   - Consider gate count vs. error tradeoff
   - Configure number of time steps

3. **Circuit Construction**
   - Generate exponential gates
   - Compose Trotter layers
   - Add any required ancillas

4. **Best Practices**
   - Validate against exact evolution
   - Monitor Trotter error bounds
   - Optimize term ordering
   - Document Trotter parameters
