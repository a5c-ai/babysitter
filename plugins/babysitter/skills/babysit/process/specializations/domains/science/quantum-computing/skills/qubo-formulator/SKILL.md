---
name: qubo-formulator
description: QUBO formulation skill for converting optimization problems to quadratic unconstrained binary format
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
  category: quantum-optimization
  domain: quantum-computing
  tools:
    - D-Wave Ocean
    - PyQUBO
    - Qiskit Optimization
  processes:
    - quantum-optimization-application
    - qaoa-implementation
    - quantum-annealing-problem-formulation
---

# QUBO Formulator Skill

## Purpose

Provides QUBO (Quadratic Unconstrained Binary Optimization) formulation capabilities for converting combinatorial optimization problems into formats suitable for quantum annealers and QAOA.

## Capabilities

- **Problem Encoding**: Convert problems to QUBO/Ising form
- **Constraint Handling**: Add penalty terms for constraints
- **Coefficient Tuning**: Optimize penalty coefficients
- **Variable Reduction**: Reduce problem size
- **Embedding**: Embed on hardware topology
- **Solution Decoding**: Interpret quantum solutions

## Usage Guidelines

1. **Problem Analysis**
   - Define objective function
   - Identify constraints
   - Determine variable types

2. **QUBO Formulation**
   - Convert to binary variables
   - Add constraint penalties
   - Construct Q matrix

3. **Optimization**
   - Tune penalty strengths
   - Reduce variable count
   - Prepare for solver

4. **Best Practices**
   - Validate formulation correctness
   - Test penalty strength sensitivity
   - Document encoding choices
   - Compare with classical solvers
