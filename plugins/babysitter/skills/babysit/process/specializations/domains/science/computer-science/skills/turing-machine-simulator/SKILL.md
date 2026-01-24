---
name: turing-machine-simulator
description: Simulate Turing machines and analyze computability properties
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
  category: complexity-theory
  domain: computer-science
  tools:
    - TM specification languages
    - Visualization tools
    - Computation tracers
  processes:
    - decidability-analysis
    - computational-problem-classification
---

# Turing Machine Simulator Skill

## Purpose

Provides Turing machine simulation capabilities for exploring computability theory and analyzing algorithmic decidability.

## Capabilities

- **Multi-Tape Simulation**: Simulate multi-tape Turing machines
- **Non-Deterministic Simulation**: Simulate non-deterministic TMs
- **Step-by-Step Execution**: Execute with tape visualization
- **Halting Detection**: Detect halting with configurable timeout
- **Trace Generation**: Generate detailed computation traces

## Usage Guidelines

1. **TM Specification**
   - Define states, alphabet, and transition function
   - Specify accept and reject states
   - Configure tape initialization

2. **Simulation**
   - Execute step-by-step or to completion
   - Track tape contents and head position
   - Monitor state transitions

3. **Analysis**
   - Analyze computation traces
   - Count steps for complexity analysis
   - Detect non-termination patterns

4. **Best Practices**
   - Use timeout for potentially non-halting inputs
   - Visualize tape for debugging
   - Document TM construction clearly
   - Compare with high-level algorithms
