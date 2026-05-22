---
name: benchmark-suite-manager
description: Manage and execute mathematical benchmark suites
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: mathematics
  domain: science
  category: reproducibility
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:mathematical-reasoning, skill-area:statistical-analysis, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-scientist, role:computational-scientist]
---

# Benchmark Suite Manager

## Purpose

Provides management and execution capabilities for mathematical benchmark suites for algorithm validation.

## Capabilities

- Standard benchmark access (Matrix Market, NIST, etc.)
- Custom benchmark generation
- Performance profiling
- Accuracy validation
- Comparison against reference solutions
- Statistical analysis of results

## Usage Guidelines

1. **Benchmark Selection**: Choose appropriate standard benchmarks
2. **Custom Generation**: Create problem-specific benchmarks
3. **Validation**: Compare against known solutions
4. **Statistical Analysis**: Properly analyze performance data

## Tools/Libraries

- Matrix Market
- NIST Digital Library
- SuiteSparse Matrix Collection
