---
name: hdl-simulation
description: Multi-simulator expertise for functional verification of FPGA designs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# HDL Simulation Skill

## Overview

Expert skill for HDL simulation across multiple simulators, enabling comprehensive functional verification of FPGA designs.

## Capabilities

- Generate simulation scripts (do files, tcl)
- Configure ModelSim/Questa simulations
- Configure Vivado Simulator (xsim)
- Configure VCS and Xcelium simulations
- Analyze waveforms for debugging
- Generate VCD and FSDB dumps
- Configure code coverage collection
- Support mixed-language simulation

## Target Processes

- functional-simulation.js
- testbench-development.js
- uvm-testbench.js
- constrained-random-verification.js

## Usage Guidelines

### Simulator Setup
- Create project-specific compilation scripts
- Configure library mappings
- Set up include paths and search paths
- Define simulation options
- Configure waveform dump formats

### ModelSim/Questa
```tcl
vlib work
vlog -sv +incdir+../rtl ../rtl/*.sv
vsim -voptargs="+acc" tb_top
add wave -recursive /*
run -all
```

### Vivado Simulator (xsim)
```tcl
xvlog --sv ../rtl/*.sv
xelab -debug typical tb_top -s tb_sim
xsim tb_sim -runall
```

### VCS
```bash
vcs -sverilog -debug_access+all -f filelist.f -o simv
./simv +vcs+vcdpluson
```

### Waveform Analysis
- Identify timing relationships
- Trace signal propagation
- Compare expected vs. actual
- Use markers for measurements
- Create protocol decoders

### Coverage Collection
- Statement coverage
- Branch coverage
- Toggle coverage
- FSM coverage
- Functional coverage (SystemVerilog)

### Mixed-Language
- Compile VHDL and Verilog separately
- Use proper interface binding
- Handle type conversions
- Configure library order
- Test boundary conditions

## Dependencies

- Simulator CLI integration
- Waveform viewer knowledge
- Coverage analysis tools
