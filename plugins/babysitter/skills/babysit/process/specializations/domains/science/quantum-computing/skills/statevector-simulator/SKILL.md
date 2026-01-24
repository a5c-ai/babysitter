---
name: statevector-simulator
description: Statevector simulation skill for exact quantum circuit simulation and debugging
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
  category: simulation-tools
  domain: quantum-computing
  tools:
    - Qiskit Aer
    - Cirq Simulator
    - QuTiP
  processes:
    - circuit-validation-testing
    - algorithm-development
    - quantum-state-analysis
---

# Statevector Simulator Skill

## Purpose

Provides exact statevector simulation capabilities for simulating quantum circuits and analyzing quantum states during algorithm development and debugging.

## Capabilities

- **Full State Simulation**: Track complete quantum state
- **State Inspection**: View amplitudes and phases
- **Intermediate States**: Capture state at circuit points
- **Expectation Values**: Compute exact expectation values
- **Entanglement Analysis**: Analyze state entanglement
- **Visualization**: Plot state vectors and Bloch spheres

## Usage Guidelines

1. **Circuit Setup**
   - Build circuit for simulation
   - Configure initial state if needed
   - Select simulation backend

2. **Simulation**
   - Run statevector simulation
   - Extract final state
   - Capture intermediate states if needed

3. **Analysis**
   - Inspect amplitudes and probabilities
   - Compute observables
   - Analyze entanglement structure

4. **Best Practices**
   - Use for small circuits (< 30 qubits)
   - Validate against analytical solutions
   - Document expected vs. observed states
   - Use for debugging before hardware
