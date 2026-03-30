---
name: vqc-trainer
description: Variational quantum classifier training skill with gradient optimization
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
  category: quantum-ml
  phase: 6
---

# VQC Trainer

## Purpose

Provides expert guidance on training variational quantum classifiers, including data encoding, circuit design, and gradient-based optimization.

## Capabilities

- Data encoding circuit design
- Variational layer construction
- Gradient-based optimization (SPSA, Adam)
- Cross-validation for QML
- Hyperparameter tuning
- Overfitting detection
- Learning curve analysis
- Ensemble methods

## Usage Guidelines

1. **Data Preparation**: Preprocess classical data for quantum encoding
2. **Encoding Design**: Select appropriate data encoding strategy
3. **Ansatz Design**: Build variational circuit with trainable parameters
4. **Training Setup**: Configure optimizer, learning rate, and batch size
5. **Evaluation**: Assess model on test set with proper metrics

## Tools/Libraries

- Qiskit Machine Learning
- PennyLane
- TensorFlow Quantum
- PyTorch
- scikit-learn
