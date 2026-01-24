---
name: ansatz-designer
description: Variational ansatz design skill for creating and optimizing parameterized quantum circuits
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
  category: circuit-design
  domain: quantum-computing
  tools:
    - Qiskit Circuit Library
    - PennyLane templates
    - Cirq ansatzes
  processes:
    - variational-algorithm-implementation
    - quantum-circuit-design-and-optimization
    - quantum-neural-network-training
---

# Ansatz Designer Skill

## Purpose

Provides variational ansatz design capabilities for creating problem-specific parameterized quantum circuits suitable for VQE, QAOA, quantum machine learning, and other variational algorithms.

## Capabilities

- **Hardware-Efficient Ansatzes**: Design circuits respecting device constraints
- **Chemistry-Inspired Ansatzes**: Create UCCSD and related structures
- **Problem-Specific Design**: Build QAOA mixers and cost unitaries
- **Expressibility Analysis**: Evaluate ansatz expressibility
- **Entanglement Structure**: Design entanglement patterns
- **Parameter Initialization**: Configure initial parameter strategies

## Usage Guidelines

1. **Ansatz Selection**
   - Analyze problem structure and requirements
   - Consider hardware constraints
   - Balance depth with expressibility

2. **Circuit Construction**
   - Build rotation and entanglement layers
   - Configure parameter sharing
   - Define layer repetition depth

3. **Analysis**
   - Evaluate circuit expressibility
   - Check entangling capability
   - Profile parameter count and depth

4. **Best Practices**
   - Start with shallow circuits
   - Use problem symmetries
   - Consider barren plateau risks
   - Document ansatz design rationale
