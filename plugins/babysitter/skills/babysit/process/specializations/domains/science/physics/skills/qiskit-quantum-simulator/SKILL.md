---
name: qiskit-quantum-simulator
description: Qiskit quantum computing skill for circuit design, simulation, and quantum algorithm development
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
  category: quantum-mechanics
  domain: physics
  tools:
    - Qiskit
    - Qiskit Nature
    - Qiskit Aer
  processes:
    - quantum-field-theory-calculations
    - machine-learning-for-physics
    - mathematical-model-derivation
---

# Qiskit Quantum Simulator Skill

## Purpose

Provides Qiskit quantum computing capabilities for quantum circuit design, simulation, and implementation of quantum algorithms for physics applications.

## Capabilities

- **Circuit Construction**: Build quantum circuits with gates and measurements
- **Statevector Simulation**: Exact simulation of quantum states
- **Noise Modeling**: Simulate realistic device noise with Qiskit Aer
- **Variational Algorithms**: Implement VQE and QAOA for optimization
- **IBM Quantum Access**: Submit jobs to IBM Quantum hardware
- **Chemistry Integration**: Quantum chemistry via Qiskit Nature

## Usage Guidelines

1. **Circuit Design**
   - Define qubit registers
   - Apply quantum gates (single-qubit, two-qubit)
   - Add measurements
   - Visualize circuit with draw()

2. **Simulation**
   - Use Aer statevector simulator for exact results
   - Use qasm_simulator for shot-based sampling
   - Configure noise models for realistic simulation
   - Analyze measurement statistics

3. **Variational Algorithms**
   - Define variational ansatz
   - Configure classical optimizer
   - Implement VQE for ground state energy
   - Use QAOA for combinatorial optimization

4. **Hardware Execution**
   - Transpile circuits for target backend
   - Monitor job queue and status
   - Apply error mitigation techniques
   - Analyze hardware results vs. simulation

5. **Best Practices**
   - Validate algorithms on simulator first
   - Use appropriate circuit depth for hardware
   - Document qubit mapping and transpilation
   - Compare with classical benchmarks
