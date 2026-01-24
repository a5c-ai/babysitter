---
name: tensor-network-simulator
description: Tensor network simulation skill for efficient simulation of structured quantum circuits
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
    - quimb
    - TensorNetwork
    - ITensor
  processes:
    - large-scale-circuit-simulation
    - approximate-quantum-simulation
    - circuit-cutting-simulation
---

# Tensor Network Simulator Skill

## Purpose

Provides tensor network simulation capabilities for efficiently simulating quantum circuits with limited entanglement, enabling simulation of larger circuits than statevector methods.

## Capabilities

- **MPS Simulation**: Matrix product state circuit simulation
- **PEPS Methods**: 2D tensor network simulation
- **Contraction Optimization**: Optimize tensor contraction order
- **Approximate Simulation**: Trade accuracy for scalability
- **Circuit Cutting**: Simulate via circuit partitioning
- **Entanglement Tracking**: Monitor bond dimensions

## Usage Guidelines

1. **Circuit Analysis**
   - Assess circuit structure and entanglement
   - Determine suitability for tensor methods
   - Choose tensor network type

2. **Simulation Configuration**
   - Set bond dimension limits
   - Configure contraction strategy
   - Define accuracy targets

3. **Execution**
   - Contract tensor network
   - Extract observables
   - Monitor resource usage

4. **Best Practices**
   - Use for low-entanglement circuits
   - Validate accuracy on small instances
   - Profile contraction cost
   - Document approximation errors
