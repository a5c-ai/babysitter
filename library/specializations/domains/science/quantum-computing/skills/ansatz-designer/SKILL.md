---
name: ansatz-designer
description: Parameterized quantum circuit (ansatz) design skill for variational algorithms
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

# Ansatz Designer

## Purpose

Provides expert guidance on designing parameterized quantum circuits (ansatze) for variational quantum algorithms, balancing expressibility with trainability.

## Capabilities

- Hardware-efficient ansatz generation
- UCCSD ansatz construction
- ADAPT-VQE ansatz building
- Expressibility analysis
- Barren plateau detection
- Custom ansatz templates
- Entanglement structure design
- Layer depth optimization

## Usage Guidelines

1. **Problem Analysis**: Determine ansatz requirements based on target Hamiltonian
2. **Architecture Selection**: Choose between hardware-efficient and problem-inspired ansatze
3. **Expressibility Testing**: Evaluate ansatz capacity to represent target states
4. **Trainability Assessment**: Check for barren plateau indicators
5. **Hardware Adaptation**: Modify ansatz for target hardware connectivity

## Tools/Libraries

- Qiskit Nature
- PennyLane
- Cirq
- TensorFlow Quantum
