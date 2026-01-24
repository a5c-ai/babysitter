---
name: cirq-circuit-builder
description: Google Cirq integration skill for quantum circuit design and execution on Google quantum processors
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
    - Cirq
    - Cirq-Google
    - TensorFlow Quantum
  processes:
    - quantum-circuit-design-and-optimization
    - hardware-backend-configuration
    - multi-platform-deployment
---

# Cirq Circuit Builder Skill

## Purpose

Provides Google Cirq quantum circuit construction capabilities for designing and executing circuits on Google quantum processors and simulators.

## Capabilities

- **Circuit Construction**: Build circuits using Cirq's qubit and gate abstractions
- **Device-Aware Compilation**: Compile circuits respecting device topology
- **Noise Simulation**: Characterize and simulate device noise
- **Calibration**: Virtual and XEB calibration support
- **Floquet Calibration**: Advanced calibration techniques
- **Serialization**: Import/export circuits in various formats

## Usage Guidelines

1. **Qubit Definition**
   - Use LineQubit or GridQubit as appropriate
   - Match qubit layout to device topology
   - Consider connectivity constraints

2. **Gate Application**
   - Apply native gates for efficiency
   - Use cirq.Circuit for composition
   - Add measurements with measure()

3. **Simulation**
   - Use cirq.Simulator for exact simulation
   - Add noise models for realistic results
   - Analyze final state or measurement outcomes

4. **Best Practices**
   - Respect device connectivity
   - Use moment structure for parallelism
   - Validate circuits before hardware execution
   - Document device calibration data used
