---
name: vqc-trainer
description: Variational quantum classifier training skill for quantum machine learning classification tasks
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
    - Qiskit Machine Learning
    - PennyLane
    - TensorFlow Quantum
  processes:
    - quantum-classifier-implementation
    - quantum-neural-network-training
    - variational-algorithm-implementation
---

# VQC Trainer Skill

## Purpose

Provides variational quantum classifier training capabilities for building and optimizing quantum neural networks for classification tasks.

## Capabilities

- **Data Encoding**: Encode classical data into quantum states
- **Variational Layers**: Design trainable quantum layers
- **Gradient Computation**: Calculate gradients via parameter shift
- **Optimizer Integration**: Interface with classical optimizers
- **Batch Training**: Process data in mini-batches
- **Hybrid Networks**: Combine quantum and classical layers

## Usage Guidelines

1. **Circuit Design**
   - Define data encoding circuit
   - Design variational ansatz
   - Configure measurement strategy

2. **Training Setup**
   - Prepare training and validation data
   - Select optimizer and learning rate
   - Configure loss function

3. **Training Execution**
   - Run optimization loop
   - Monitor loss convergence
   - Track validation accuracy

4. **Best Practices**
   - Use gradient-free optimizers for noisy hardware
   - Monitor barren plateau effects
   - Regularize to prevent overfitting
   - Document hyperparameter choices
