---
name: circuit-optimizer
description: Quantum circuit optimization skill for gate reduction, depth minimization, and hardware-aware compilation
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
  category: circuit-design
  phase: 6
---

# Circuit Optimizer

## Purpose

Provides expert guidance on quantum circuit optimization techniques for reducing gate count, minimizing depth, and adapting circuits to hardware constraints.

## Capabilities

- Circuit depth reduction algorithms
- Gate cancellation and merging
- Peephole optimization
- Template matching optimization
- Commutation analysis
- Hardware topology-aware routing
- Two-qubit gate minimization
- Compilation pass orchestration

## Usage Guidelines

1. **Analysis**: Profile circuit for optimization opportunities (gate counts, depth, connectivity)
2. **Gate Reduction**: Apply cancellation and merging rules for equivalent gates
3. **Depth Optimization**: Parallelize independent operations where topology allows
4. **Hardware Mapping**: Route circuits to respect hardware connectivity constraints
5. **Verification**: Validate circuit equivalence after optimization

## Tools/Libraries

- Qiskit transpiler
- pytket (t|ket>)
- PyZX
- Cirq optimizers
- BQSKit
