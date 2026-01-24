---
name: counterexample-generator
description: Automated search for counterexamples to mathematical conjectures
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
  category: theorem-proving
  domain: mathematics
  backlog-id: SK-MATH-004
  tools:
    - Z3
    - CVC5
    - Quickcheck
    - Nitpick
  processes:
    - conjecture-exploration
    - theorem-proof-verification
---

# Counterexample Generator Skill

## Purpose

Provides automated counterexample search for mathematical conjectures using SMT solvers, random testing, and finite model finding.

## Capabilities

- **Random Testing**: Apply intelligent sampling for counterexamples
- **SMT Search**: Use SMT solvers for counterexample generation
- **Property Testing**: Apply Quickcheck-style property testing
- **Boundary Cases**: Enumerate boundary case candidates
- **Finite Models**: Find finite counterexamples with Nitpick/Quickcheck
- **Reporting**: Generate counterexample reports

## Usage Guidelines

1. **Conjecture Setup**
   - Formalize conjecture precisely
   - Identify relevant parameter spaces
   - Define validity criteria

2. **Search Strategy**
   - Start with small domains
   - Use random testing for quick checks
   - Apply SMT for harder cases

3. **Counterexample Analysis**
   - Verify counterexamples manually
   - Understand why conjecture fails
   - Refine conjecture if appropriate

4. **Best Practices**
   - Try multiple methods
   - Document search bounds
   - Report negative results
