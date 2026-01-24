---
name: benchmark-suite-manager
description: Mathematical benchmark problem management
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
  category: research-infrastructure
  domain: mathematics
  backlog-id: SK-MATH-039
  tools:
    - pytest-benchmark
    - ASV
    - Custom frameworks
  processes:
    - algorithm-comparison
    - performance-analysis
---

# Benchmark Suite Manager Skill

## Purpose

Provides tools for managing mathematical benchmark problems and performance evaluation of algorithms.

## Capabilities

- **Problem Libraries**: Standard test problems
- **Performance Metrics**: Timing, accuracy, scalability
- **Comparison Framework**: Algorithm comparison
- **Regression Testing**: Performance regression detection
- **Visualization**: Benchmark result plots
- **Reporting**: Standardized benchmark reports

## Usage Guidelines

1. **Suite Setup**
   - Select benchmark problems
   - Define metrics
   - Configure test harness

2. **Execution**
   - Run benchmarks
   - Collect metrics
   - Handle variations

3. **Analysis**
   - Compare results
   - Detect regressions
   - Generate reports

4. **Best Practices**
   - Use standardized problems
   - Report hardware specs
   - Document methodology
