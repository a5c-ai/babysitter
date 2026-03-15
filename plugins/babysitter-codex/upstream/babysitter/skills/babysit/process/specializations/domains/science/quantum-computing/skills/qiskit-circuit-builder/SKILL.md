---
name: qiskit-circuit-builder
description: IBM Qiskit integration skill for quantum circuit construction, transpilation, and execution on IBM Quantum hardware
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
  category: quantum-framework
  phase: 6
---

# Qiskit Circuit Builder

## Purpose

Provides expert guidance on quantum circuit construction, transpilation, and execution using IBM Qiskit framework, enabling seamless development and deployment to IBM Quantum hardware.

## Capabilities

- Quantum circuit construction using Qiskit primitives
- Circuit transpilation to native gate sets
- Hardware backend selection and configuration
- Job submission and result retrieval from IBM Quantum
- Circuit visualization and drawing
- Noise model simulation with Aer
- Pulse-level control programming
- Dynamic circuit construction

## Usage Guidelines

1. **Circuit Construction**: Use QuantumCircuit class with gates, measurements, and classical control
2. **Transpilation**: Optimize circuits for target backend using transpile() with optimization levels
3. **Backend Selection**: Query available backends and select based on queue time and calibration
4. **Execution**: Submit jobs with appropriate shots and retrieve results
5. **Visualization**: Generate circuit diagrams, histograms, and state visualizations

## Tools/Libraries

- Qiskit
- Qiskit Aer
- Qiskit Terra
- Qiskit IBMQ Provider
- Qiskit Visualization
