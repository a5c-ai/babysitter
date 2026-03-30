---
name: pennylane-hybrid-executor
description: PennyLane integration skill for hybrid quantum-classical machine learning and variational algorithms
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

# PennyLane Hybrid Executor

## Purpose

Provides expert guidance on hybrid quantum-classical workflows using PennyLane, enabling seamless integration of quantum circuits with classical machine learning frameworks.

## Capabilities

- Quantum node (QNode) definition and execution
- Automatic differentiation for quantum circuits
- Device-agnostic circuit execution
- Integration with ML frameworks (PyTorch, TensorFlow, JAX)
- Variational algorithm optimization
- Parameter shift rule gradients
- Shot-based and analytic differentiation
- Multi-device workflow orchestration

## Usage Guidelines

1. **QNode Definition**: Create differentiable quantum functions with device specification
2. **Gradient Computation**: Select appropriate differentiation method for the use case
3. **Framework Integration**: Seamlessly combine with PyTorch, TensorFlow, or JAX models
4. **Optimization**: Use classical optimizers to train variational circuits
5. **Device Switching**: Test on simulators before deploying to hardware

## Tools/Libraries

- PennyLane
- PennyLane-Lightning
- PennyLane-Qiskit
- PennyLane-Cirq
- PennyLane-SF (Strawberry Fields)
