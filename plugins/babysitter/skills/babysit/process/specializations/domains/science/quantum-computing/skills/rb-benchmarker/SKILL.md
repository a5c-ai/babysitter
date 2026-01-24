---
name: rb-benchmarker
description: Randomized benchmarking skill for characterizing quantum gate fidelities and device performance
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
    - Qiskit Experiments
    - Cirq benchmarks
    - pyGSTi
  processes:
    - quantum-hardware-benchmarking
    - gate-calibration-optimization
    - device-characterization
---

# RB Benchmarker Skill

## Purpose

Provides randomized benchmarking capabilities for characterizing quantum gate fidelities, including standard RB, interleaved RB, and cross-entropy benchmarking for comprehensive device characterization.

## Capabilities

- **Standard RB**: Measure average Clifford gate fidelity
- **Interleaved RB**: Characterize specific gate fidelity
- **Simultaneous RB**: Assess crosstalk effects
- **Cross-Entropy Benchmarking**: Evaluate random circuit fidelity
- **Character RB**: Detect coherent errors
- **Cycle Benchmarking**: Characterize gate cycles

## Usage Guidelines

1. **Experiment Design**
   - Select RB variant for measurement goal
   - Configure sequence lengths
   - Determine shot count for statistics

2. **Circuit Generation**
   - Generate random Clifford sequences
   - Add interleaved gates if applicable
   - Include recovery gates

3. **Analysis**
   - Fit survival probability decay
   - Extract error per Clifford
   - Calculate gate fidelity

4. **Best Practices**
   - Use sufficient sequence lengths
   - Account for SPAM errors
   - Report confidence intervals
   - Document benchmarking conditions
