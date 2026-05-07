---
name: benchmark-suite-manager
description: Manage benchmarks for algorithm engineering experiments and evaluations
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: computer-science
  domain: science
  category: research-documentation
  phase: 6
graph:
  domains: [domain:computer-science]
  specializations: [specialization:theoretical-computer-science]
  skillAreas: [skill-area:language-design, skill-area:compiler-implementation, skill-area:graph-algorithms]
  workflows: [workflow:research-grant-lifecycle]
  roles: [role:research-engineer, role:computational-scientist]
---

# Benchmark Suite Manager

## Purpose

Provides expert guidance on managing benchmark suites for algorithm engineering and experimental evaluation.

## Capabilities

- Standard benchmark suite access (DIMACS, TSPLIB, etc.)
- Instance generation for specific problem classes
- Statistical analysis of results
- Performance comparison tables
- Visualization of scaling behavior
- Reproducibility support

## Usage Guidelines

1. **Suite Selection**: Choose appropriate benchmark suite
2. **Instance Selection**: Select representative instances
3. **Execution**: Run experiments systematically
4. **Analysis**: Perform statistical analysis
5. **Reporting**: Generate comparison tables and plots

## Tools/Libraries

- DIMACS
- TSPLIB
- SuiteSparse Matrix Collection
- Statistical tools
