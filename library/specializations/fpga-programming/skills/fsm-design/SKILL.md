---
name: fsm-design
description: Specialized skill for finite state machine design and optimization in FPGAs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# FSM Design Skill

## Overview

Specialized skill for finite state machine (FSM) design and optimization, ensuring robust and efficient control logic implementation in FPGA designs.

## Capabilities

- Design Moore and Mealy state machines
- Apply state encoding (one-hot, binary, Gray)
- Implement illegal state recovery
- Generate state diagrams and transition tables
- Optimize FSM for area or speed
- Apply safe FSM coding patterns
- Debug FSM behavior with assertions
- Handle FSM with multiple clock domains

## Target Processes

- fsm-design.js
- rtl-module-architecture.js
- vhdl-module-development.js
- verilog-systemverilog-design.js

## Usage Guidelines

### FSM Types
- **Moore Machine**: Outputs depend only on current state
- **Mealy Machine**: Outputs depend on state and inputs
- **Registered Outputs**: Mealy with registered outputs for timing

### State Encoding
- **One-Hot**: Fast, low combinational logic, more flip-flops
- **Binary**: Compact, minimal flip-flops, more logic
- **Gray**: Useful for CDC, single-bit transitions
- **Custom**: For specific optimization requirements

### Safe FSM Patterns
- Explicit default state in case statements
- Illegal state detection and recovery
- Synchronous reset to known state
- Avoid latches (cover all cases)
- Use enumerated types for readability

### VHDL Style
```vhdl
type state_type is (IDLE, RUN, DONE);
signal state, next_state : state_type;
```

### Verilog Style
```verilog
localparam [1:0] IDLE = 2'b00, RUN = 2'b01, DONE = 2'b10;
reg [1:0] state, next_state;
```

### Optimization Strategies
- Minimize state bits for area
- One-hot for speed in FPGAs
- Pipeline deep combinational logic
- Consider state splitting for timing

## Dependencies

- FSM analysis tools
- Synthesis attribute knowledge
- HDL coding standards
