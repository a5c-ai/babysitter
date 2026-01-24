---
name: qiskit-circuit-builder
description: Qiskit quantum circuit construction skill for building, visualizing, and executing quantum circuits on IBM backends
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

# Qiskit Circuit Builder

## Purpose

Provides expert guidance on constructing quantum circuits using IBM Qiskit, including gate operations, circuit composition, and backend execution.

## Capabilities

- Quantum circuit construction with standard gates
- Custom gate and unitary synthesis
- Circuit visualization and drawing
- Transpilation for specific backends
- Execution on simulators and real hardware
- Result analysis and state tomography

## Usage Guidelines

1. **Circuit Design**: Build circuits using QuantumCircuit class
2. **Gate Application**: Apply single-qubit and multi-qubit gates
3. **Measurement**: Configure measurement operations
4. **Transpilation**: Optimize circuits for target backends
5. **Execution**: Run on Aer simulators or IBM Quantum hardware

## Dependencies

- Qiskit Terra, Aer, IBMQ Provider
- NumPy, Matplotlib

## Process Integration

- Quantum Algorithm Development (all phases)
- Hardware Integration workflows
