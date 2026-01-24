---
name: benchmark-suite-manager
description: Manage benchmarks for algorithm engineering experiments and performance evaluation
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
  category: research-documentation
  domain: computer-science
  tools:
    - DIMACS
    - TSPLIB
    - Statistical tools
  processes:
    - algorithm-engineering-evaluation
    - system-performance-modeling
---

# Benchmark Suite Manager Skill

## Purpose

Provides benchmark management capabilities for rigorous algorithm engineering experiments.

## Capabilities

- **Suite Access**: Access standard benchmark suites (DIMACS, TSPLIB)
- **Instance Generation**: Generate instances for specific problem classes
- **Statistical Analysis**: Analyze experimental results statistically
- **Comparison Tables**: Generate performance comparison tables
- **Scaling Visualization**: Visualize algorithm scaling behavior

## Usage Guidelines

1. **Benchmark Selection**
   - Choose appropriate benchmark suite
   - Select representative instances
   - Consider instance characteristics

2. **Experiment Design**
   - Define experimental methodology
   - Configure measurement infrastructure
   - Plan statistical analysis

3. **Result Analysis**
   - Apply statistical tests
   - Visualize performance data
   - Report results clearly

4. **Best Practices**
   - Use standard benchmarks
   - Report statistical significance
   - Document experimental setup
   - Enable reproducibility
