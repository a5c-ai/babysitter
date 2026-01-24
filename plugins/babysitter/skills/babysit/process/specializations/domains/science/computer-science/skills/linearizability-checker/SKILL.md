---
name: linearizability-checker
description: Check linearizability of concurrent data structure implementations
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
    - LineUp
    - Wing-Gong algorithm
    - Concurrency checkers
  processes:
    - concurrent-data-structure-design
    - distributed-consensus-protocol-design
---

# Linearizability Checker Skill

## Purpose

Provides linearizability verification capabilities for concurrent data structure implementations.

## Capabilities

- **History Linearization**: Linearize concurrent operation histories
- **Linearization Points**: Identify linearization points
- **Violation Detection**: Generate counterexamples for violations
- **History Visualization**: Visualize concurrent histories
- **Proof Templates**: Generate linearizability proof templates

## Usage Guidelines

1. **History Collection**
   - Record concurrent operations
   - Capture invocation and response times
   - Identify overlapping operations

2. **Linearization Checking**
   - Find valid linearization ordering
   - Verify sequential specification
   - Report violations with witnesses

3. **Proof Construction**
   - Identify linearization points in code
   - Construct linearizability argument
   - Verify with model checking

4. **Best Practices**
   - Test with diverse schedules
   - Use systematic exploration
   - Document linearization points
   - Verify proofs formally
