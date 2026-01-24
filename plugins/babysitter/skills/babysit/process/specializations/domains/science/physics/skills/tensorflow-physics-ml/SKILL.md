---
name: tensorflow-physics-ml
description: TensorFlow machine learning skill specialized for physics applications including neural network potentials and surrogate models
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
  category: data-analysis
  domain: physics
  tools:
    - TensorFlow
    - DeepMD-kit
    - SchNet
  processes:
    - machine-learning-for-physics
    - molecular-dynamics-simulation-setup
    - density-functional-theory-calculations
---

# TensorFlow Physics ML Skill

## Purpose

Provides TensorFlow machine learning capabilities specialized for physics applications including physics-informed neural networks, neural network potentials, and surrogate models.

## Capabilities

- **Physics-Informed NNs**: Incorporate physical laws as constraints (PINNs)
- **Neural Network Potentials**: Train interatomic potentials from DFT data
- **Normalizing Flows**: Density estimation for complex distributions
- **Graph Neural Networks**: Model molecular and crystal structures
- **Automatic Differentiation**: Compute gradients for physics quantities
- **Experiment Tracking**: TensorBoard for monitoring training

## Usage Guidelines

1. **Data Preparation**
   - Preprocess physics data appropriately
   - Handle symmetries in input representation
   - Split into train/validation/test sets
   - Normalize features based on physics scales

2. **Model Architecture**
   - Choose architecture based on problem symmetry
   - Incorporate physical constraints in loss
   - Use equivariant networks for symmetry
   - Consider model complexity vs. data size

3. **Training**
   - Configure optimizer (Adam, SGD with momentum)
   - Set learning rate schedule
   - Monitor physical observables during training
   - Use early stopping based on validation

4. **Validation**
   - Test on held-out data
   - Validate physical consistency
   - Compare with first-principles results
   - Check extrapolation behavior

5. **Best Practices**
   - Document training hyperparameters
   - Archive model checkpoints
   - Quantify prediction uncertainties
   - Validate extensively before deployment
