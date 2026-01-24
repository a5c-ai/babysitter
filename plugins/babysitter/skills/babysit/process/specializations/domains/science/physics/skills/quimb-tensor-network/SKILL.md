---
name: quimb-tensor-network
description: QuTiP/quimb tensor network skill for quantum many-body simulations and entanglement analysis
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
  category: quantum-mechanics
  domain: physics
  tools:
    - quimb
    - QuTiP
    - ITensor
  processes:
    - mathematical-model-derivation
    - perturbation-theory-analysis
    - phase-transition-investigation
---

# quimb Tensor Network Skill

## Purpose

Provides tensor network capabilities via quimb and QuTiP for quantum many-body simulations, time evolution, and entanglement analysis in strongly correlated systems.

## Capabilities

- **MPS/DMRG**: Matrix product state calculations and density matrix renormalization group
- **TEBD Evolution**: Time-evolving block decimation for dynamics
- **Entanglement Entropy**: Calculate von Neumann and Renyi entropies
- **Master Equations**: Open quantum system dynamics with QuTiP
- **Open Systems**: Lindblad master equation evolution
- **GPU Acceleration**: GPU-accelerated tensor contractions

## Usage Guidelines

1. **State Construction**
   - Build initial MPS from product states
   - Define Hamiltonians as MPO
   - Set bond dimension for accuracy
   - Use appropriate truncation criteria

2. **Ground State Search**
   - Run DMRG for ground state
   - Monitor energy convergence
   - Check entanglement entropy
   - Validate against exact results when possible

3. **Time Evolution**
   - Use TEBD for local Hamiltonians
   - Configure time step for accuracy
   - Monitor entanglement growth
   - Apply compression after evolution

4. **Open System Dynamics**
   - Define Lindblad operators
   - Evolve density matrix
   - Calculate expectation values
   - Analyze decoherence effects

5. **Best Practices**
   - Converge bond dimension
   - Check energy variance for ground state
   - Use symmetries when available
   - Document all tensor network parameters
