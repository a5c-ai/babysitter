---
name: resource-estimator
description: Quantum resource estimation skill for analyzing qubit, gate, and time requirements of quantum algorithms
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
  category: simulation-tools
  domain: quantum-computing
  tools:
    - Azure Quantum Resource Estimator
    - Q# resource counter
    - Qiskit analysis
  processes:
    - quantum-resource-estimation
    - algorithm-feasibility-analysis
    - hardware-requirement-planning
---

# Resource Estimator Skill

## Purpose

Provides quantum resource estimation capabilities for analyzing the qubit count, gate count, circuit depth, and runtime requirements of quantum algorithms at scale.

## Capabilities

- **Qubit Counting**: Estimate logical and physical qubits
- **Gate Counting**: Count gates by type (T, Clifford, etc.)
- **Depth Analysis**: Estimate circuit depth
- **Error Correction Overhead**: Include QEC resource costs
- **Time Estimation**: Estimate algorithm runtime
- **Scaling Analysis**: Project requirements vs. problem size

## Usage Guidelines

1. **Algorithm Specification**
   - Define algorithm at high level
   - Specify problem size parameters
   - Choose error correction scheme

2. **Resource Estimation**
   - Run resource estimator
   - Analyze qubit and gate counts
   - Consider QEC overhead

3. **Feasibility Assessment**
   - Compare to hardware roadmaps
   - Identify bottlenecks
   - Project timelines

4. **Best Practices**
   - Use conservative estimates
   - Consider multiple QEC schemes
   - Document assumptions
   - Update with improved algorithms
