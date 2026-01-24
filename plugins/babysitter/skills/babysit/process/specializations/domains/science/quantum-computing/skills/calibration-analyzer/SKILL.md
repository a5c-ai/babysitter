---
name: calibration-analyzer
description: Quantum device calibration analysis skill for interpreting and utilizing hardware calibration data
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
  category: hardware-integration
  domain: quantum-computing
  tools:
    - Qiskit
    - IBM Quantum
    - Device APIs
  processes:
    - device-characterization
    - gate-calibration-optimization
    - qubit-selection-strategy
---

# Calibration Analyzer Skill

## Purpose

Provides quantum device calibration analysis capabilities for interpreting hardware calibration data and making informed decisions about qubit selection and circuit optimization.

## Capabilities

- **Calibration Data Retrieval**: Access device calibration info
- **Qubit Quality Assessment**: Rank qubits by error rates
- **Gate Error Analysis**: Analyze single and two-qubit errors
- **T1/T2 Tracking**: Monitor coherence times
- **Readout Error Analysis**: Assess measurement fidelities
- **Temporal Trends**: Track calibration drift

## Usage Guidelines

1. **Data Retrieval**
   - Fetch latest calibration data
   - Parse qubit and gate properties
   - Organize for analysis

2. **Quality Assessment**
   - Compute qubit quality scores
   - Identify best qubit subsets
   - Rank two-qubit gates

3. **Selection**
   - Choose qubits for circuit
   - Consider connectivity needs
   - Balance quality vs. connectivity

4. **Best Practices**
   - Always check recent calibration
   - Account for calibration age
   - Document selection rationale
   - Track performance over time
