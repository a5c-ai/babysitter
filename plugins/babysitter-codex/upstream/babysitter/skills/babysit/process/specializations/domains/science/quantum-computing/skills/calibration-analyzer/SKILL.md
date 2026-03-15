---
name: calibration-analyzer
description: Hardware calibration data analysis skill for optimal qubit selection
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
  category: hardware-integration
  phase: 6
---

# Calibration Analyzer

## Purpose

Provides expert guidance on analyzing quantum hardware calibration data to select optimal qubits and gate configurations for circuit execution.

## Capabilities

- T1/T2 coherence analysis
- Gate error rate parsing
- Readout error analysis
- Crosstalk characterization
- Qubit quality ranking
- Temporal calibration tracking
- Error budget calculation
- Calibration drift detection

## Usage Guidelines

1. **Data Retrieval**: Fetch latest calibration data from backend
2. **Metric Extraction**: Parse T1, T2, gate fidelities, and readout errors
3. **Quality Ranking**: Score qubits based on weighted metrics
4. **Selection**: Choose optimal qubits for circuit execution
5. **Monitoring**: Track calibration changes over time

## Tools/Libraries

- Qiskit IBMQ Provider
- Cirq-Google
- Amazon Braket SDK
- Pandas
- Matplotlib
