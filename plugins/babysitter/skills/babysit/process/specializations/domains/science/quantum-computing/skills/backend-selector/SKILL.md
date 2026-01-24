---
name: backend-selector
description: Quantum backend selection skill for choosing optimal quantum hardware or simulators for experiments
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
    - Amazon Braket
    - Azure Quantum
  processes:
    - multi-platform-deployment
    - hardware-backend-configuration
    - resource-optimization
---

# Backend Selector Skill

## Purpose

Provides quantum backend selection capabilities for choosing the most appropriate quantum hardware or simulator based on circuit requirements, availability, cost, and performance.

## Capabilities

- **Backend Discovery**: Find available backends across providers
- **Capability Matching**: Match circuit needs to backend features
- **Queue Analysis**: Check job queue times
- **Cost Estimation**: Estimate execution costs
- **Performance Comparison**: Compare backend benchmarks
- **Availability Monitoring**: Track backend status

## Usage Guidelines

1. **Requirements Analysis**
   - Identify circuit qubit count and depth
   - List required gate types
   - Specify quality requirements

2. **Backend Evaluation**
   - Query available backends
   - Filter by capability
   - Rank by quality metrics

3. **Selection**
   - Consider queue times
   - Factor in cost constraints
   - Make final selection

4. **Best Practices**
   - Check availability before selection
   - Consider simulator for testing
   - Document selection criteria
   - Track backend performance history
