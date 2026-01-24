---
name: data-encoder
description: Quantum data encoding skill for mapping classical data to quantum states
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
  category: quantum-ml
  domain: quantum-computing
  tools:
    - Qiskit
    - PennyLane
    - Cirq
  processes:
    - quantum-feature-map-design
    - data-loading-circuit-design
    - quantum-state-preparation
---

# Data Encoder Skill

## Purpose

Provides quantum data encoding capabilities for mapping classical data into quantum states using various encoding strategies optimized for different quantum machine learning applications.

## Capabilities

- **Amplitude Encoding**: Encode data in state amplitudes
- **Angle Encoding**: Map data to rotation angles
- **Basis Encoding**: Encode in computational basis
- **IQP Encoding**: Instantaneous quantum polynomial circuits
- **QAOA-Style Encoding**: Problem-specific encodings
- **Re-Uploading**: Data re-uploading strategies

## Usage Guidelines

1. **Strategy Selection**
   - Analyze data dimensionality
   - Consider qubit requirements
   - Balance encoding depth vs. expressivity

2. **Circuit Construction**
   - Implement encoding circuit
   - Configure repetitions if using re-uploading
   - Add entanglement layers if needed

3. **Validation**
   - Verify encoding correctness
   - Check state preparation fidelity
   - Profile circuit depth and gates

4. **Best Practices**
   - Normalize input data appropriately
   - Consider hardware connectivity
   - Document encoding scheme
   - Analyze encoding capacity
