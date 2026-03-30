---
name: formal-verification
description: Formal property verification and model checking skill for FPGA designs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Formal Verification Skill

## Overview

Expert skill for formal property verification and model checking, enabling exhaustive verification of FPGA design properties without simulation.

## Capabilities

- Write properties for formal verification
- Configure formal tool constraints
- Analyze formal counterexamples
- Apply bounded model checking
- Configure cover and assume directives
- Debug formal failures
- Integrate formal with simulation flows
- Support JasperGold and VC Formal flows

## Target Processes

- sva-development.js
- cdc-design.js
- constrained-random-verification.js

## Usage Guidelines

### Property Types
- **assert property**: Must always hold
- **assume property**: Environment constraints
- **cover property**: Reachability goals
- **restrict property**: Strong constraints

### Formal Approaches
- **Bounded Model Checking**: Check properties up to N cycles
- **Unbounded Proof**: Complete verification when possible
- **Induction**: K-induction for liveness properties
- **Abstraction**: Reduce complexity for scalability

### Writing Effective Properties
```systemverilog
// Safety property
assert property (@(posedge clk) disable iff (rst)
  req |-> ##[1:5] gnt);

// Liveness property (bounded)
assert property (@(posedge clk) disable iff (rst)
  req |-> s_eventually gnt);

// Assumption for formal
assume property (@(posedge clk)
  $onehot0(req_vec));
```

### Constraint Development
- Model input protocol constraints
- Constrain unrealistic scenarios
- Avoid over-constraining
- Use helper logic for complex constraints
- Document constraint rationale

### Counterexample Analysis
- Load counterexample trace
- Identify root cause
- Distinguish bug vs. missing constraint
- Create regression test from counterexample
- Update constraints or fix RTL

### Tool Integration
- Configure engine selection
- Set proof bounds appropriately
- Use proof acceleration techniques
- Integrate with regression flows
- Archive proof results

## Dependencies

- Formal tool awareness (JasperGold, VC Formal)
- SVA expertise
- Model checking theory knowledge
