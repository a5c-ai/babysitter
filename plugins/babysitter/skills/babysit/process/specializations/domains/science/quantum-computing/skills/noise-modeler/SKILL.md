---
name: noise-modeler
description: Quantum noise modeling skill for constructing and characterizing realistic noise models
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
    - Qiskit Aer
    - Cirq noise
    - pyGSTi
  processes:
    - noisy-simulation-and-analysis
    - device-characterization
    - error-mitigation-strategy-implementation
---

# Noise Modeler Skill

## Purpose

Provides quantum noise modeling capabilities for constructing realistic noise models from device characterization data and simulating their effects on quantum circuits.

## Capabilities

- **Depolarizing Noise**: Model generic decoherence
- **Amplitude Damping**: Model T1 relaxation
- **Phase Damping**: Model T2 dephasing
- **Crosstalk Modeling**: Capture inter-qubit errors
- **Device Calibration Import**: Build models from device data
- **Process Tomography**: Characterize noise channels

## Usage Guidelines

1. **Noise Characterization**
   - Measure T1 and T2 times
   - Characterize gate errors
   - Assess readout errors

2. **Model Construction**
   - Build Kraus operators or Pauli channels
   - Configure noise for each gate type
   - Add measurement errors

3. **Simulation**
   - Apply noise model to circuits
   - Compare with hardware results
   - Validate model accuracy

4. **Best Practices**
   - Update models from recent calibration
   - Include all significant error sources
   - Validate against device results
   - Document model assumptions
