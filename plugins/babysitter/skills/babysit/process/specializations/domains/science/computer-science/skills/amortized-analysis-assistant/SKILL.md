---
name: amortized-analysis-assistant
description: Apply amortized analysis techniques to analyze operation sequences on data structures
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
  category: algorithm-analysis
  domain: computer-science
  tools:
    - Symbolic computation
    - Mathematical analysis
  processes:
    - algorithm-complexity-analysis
    - concurrent-data-structure-design
---

# Amortized Analysis Assistant Skill

## Purpose

Provides amortized analysis capabilities for determining average-case complexity of operation sequences, particularly for data structures with occasional expensive operations.

## Capabilities

- **Aggregate Method**: Calculate total cost over operation sequences
- **Accounting Method**: Assign credits to operations and track balance
- **Potential Function**: Design and verify potential functions
- **Banker's Method**: Handle persistent data structures
- **Bound Documentation**: Generate amortized bound documentation

## Usage Guidelines

1. **Method Selection**
   - Use aggregate for simple sequences
   - Use accounting for intuitive analysis
   - Use potential for formal proofs

2. **Potential Design**
   - Define potential function on data structure state
   - Ensure non-negativity
   - Verify telescoping property

3. **Cost Calculation**
   - Compute actual costs per operation
   - Add amortized overhead
   - Derive amortized bounds

4. **Best Practices**
   - Verify potential is always non-negative
   - Document credit invariants clearly
   - Compare with worst-case bounds
   - Validate with concrete examples
