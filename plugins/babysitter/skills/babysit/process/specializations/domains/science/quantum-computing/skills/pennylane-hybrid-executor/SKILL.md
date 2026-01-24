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
  - Task
metadata:
  version: "1.0"
  category: quantum-frameworks
  domain: quantum-computing
  tools:
    - PennyLane
    - PennyLane-Lightning
    - PennyLane plugins
  processes:
    - variational-algorithm-implementation
    - quantum-classifier-implementation
    - quantum-neural-network-training
---

# PennyLane Hybrid Executor Skill

## Purpose

Provides PennyLane capabilities for hybrid quantum-classical machine learning, enabling automatic differentiation through quantum circuits and integration with ML frameworks.

## Capabilities

- **QNode Definition**: Define and execute quantum nodes seamlessly
- **Automatic Differentiation**: Compute gradients through quantum circuits
- **Device Agnostic**: Execute on multiple backends without code changes
- **ML Integration**: Interface with PyTorch, TensorFlow, and JAX
- **Variational Optimization**: Optimize variational circuit parameters
- **Parameter Shift**: Compute exact gradients using parameter shift rule

## Usage Guidelines

1. **QNode Creation**
   - Define quantum function with qml decorators
   - Select appropriate device
   - Configure interface for ML framework

2. **Circuit Design**
   - Use PennyLane gates and templates
   - Apply variational layers
   - Return expectation values or samples

3. **Optimization**
   - Choose classical optimizer
   - Configure learning rate and iterations
   - Monitor convergence

4. **Best Practices**
   - Use lightning simulator for speed
   - Leverage gradient-free methods for noisy hardware
   - Batch parameter updates
   - Profile quantum vs. classical overhead
