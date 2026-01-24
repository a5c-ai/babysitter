---
name: memory-model-analyzer
description: Analyze programs under various memory models including sequential consistency and TSO
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
  category: distributed-systems
  domain: computer-science
  tools:
    - CDSChecker
    - GenMC
    - Memory model tools
  processes:
    - concurrent-data-structure-design
    - cache-optimization-analysis
---

# Memory Model Analyzer Skill

## Purpose

Provides memory model analysis capabilities for verifying concurrent programs under relaxed memory models.

## Capabilities

- **Sequential Consistency**: Check SC compliance
- **TSO Analysis**: Analyze under Total Store Order
- **C/C++ Memory Model**: Check C11/C++11 compliance
- **Barrier Guidance**: Recommend memory barrier placement
- **Race Detection**: Detect data races

## Usage Guidelines

1. **Model Selection**
   - Identify target architecture
   - Choose appropriate memory model
   - Understand model semantics

2. **Analysis Execution**
   - Configure model checker
   - Explore execution space
   - Identify problematic behaviors

3. **Barrier Placement**
   - Identify missing synchronization
   - Add appropriate barriers
   - Verify correctness

4. **Best Practices**
   - Understand memory model thoroughly
   - Test under multiple models
   - Document synchronization requirements
   - Verify with model checkers
