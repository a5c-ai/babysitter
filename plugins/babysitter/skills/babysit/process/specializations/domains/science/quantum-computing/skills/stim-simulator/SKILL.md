---
name: stim-simulator
description: Stim integration skill for high-performance stabilizer circuit simulation and QEC analysis
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
  category: error-management
  domain: quantum-computing
  tools:
    - Stim
    - Stabilizer simulation
    - Detector error models
  processes:
    - quantum-error-correction-design
    - noisy-simulation-and-analysis
    - fault-tolerant-circuit-design
---

# Stim Simulator Skill

## Purpose

Provides high-performance stabilizer circuit simulation capabilities using Stim for simulating quantum error correction circuits with billions of shots and analyzing decoder performance.

## Capabilities

- **Fast Stabilizer Simulation**: Simulate Clifford circuits efficiently
- **Noise Injection**: Add Pauli and depolarizing noise
- **Detector Sampling**: Sample detector outcomes for decoding
- **Error Model Generation**: Create detector error models
- **Circuit Compilation**: Build QEC circuits programmatically
- **Matching Graph Export**: Export for decoder analysis

## Usage Guidelines

1. **Circuit Construction**
   - Build circuits using Stim's circuit format
   - Add detectors and observables
   - Configure noise operations

2. **Simulation**
   - Use TableauSimulator for state tracking
   - Use compiled simulation for speed
   - Sample millions of shots efficiently

3. **Decoder Integration**
   - Export detector error models
   - Generate matching graphs
   - Interface with PyMatching

4. **Best Practices**
   - Use Stim's native circuit format for speed
   - Leverage detector error models
   - Profile sampling rates
   - Document circuit structure
