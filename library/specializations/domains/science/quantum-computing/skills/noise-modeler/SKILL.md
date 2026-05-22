---
name: noise-modeler
description: Quantum noise modeling skill for simulation and hardware characterization
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
  category: error-management
  phase: 6
graph:
  domains: [domain:quantum-computing]
  specializations: [specialization:quantum-computing]
  skillAreas: [skill-area:physics-simulation, skill-area:statistical-analysis, skill-area:mathematical-reasoning]
  workflows: [workflow:experiment-design]
  roles: [role:research-scientist, role:computational-scientist]
---

# Noise Modeler

## Purpose

Provides expert guidance on quantum noise modeling for realistic simulation and hardware characterization analysis.

## Capabilities

- Depolarizing channel modeling
- Amplitude damping models
- Phase damping models
- Crosstalk noise models
- Readout error modeling
- Custom noise model construction
- Kraus operator representation
- Pauli channel conversion

## Usage Guidelines

1. **Noise Identification**: Determine dominant noise sources from benchmarking data
2. **Model Construction**: Build appropriate noise channels for each error type
3. **Parameter Extraction**: Fit model parameters to experimental data
4. **Simulation Integration**: Apply noise models to circuit simulations
5. **Validation**: Compare noisy simulations with hardware results

## Tools/Libraries

- Qiskit Aer
- Cirq
- PennyLane
- QuTiP
- NumPy
