# Verilog/SystemVerilog Language Skill

## Overview

The Verilog/SystemVerilog Language skill provides expert capabilities for developing synthesizable HDL code following IEEE 1800 standards. It handles module design, interface definitions, package creation, and applies proper SystemVerilog constructs.

## Quick Start

### Prerequisites

1. Verilator, Icarus Verilog, or commercial simulator
2. Target FPGA vendor toolchain (Vivado, Quartus)
3. Verible for linting (recommended)

### Basic Usage

```javascript
// In a babysitter process
const svModule = await ctx.task(generateSystemVerilogModule, {
  moduleName: 'packet_processor',
  parameters: {
    DATA_WIDTH: { type: 'int', default: 64 },
    FIFO_DEPTH: { type: 'int', default: 256 }
  },
  ports: [
    { name: 'clk', direction: 'input', type: 'logic' },
    { name: 'rst_n', direction: 'input', type: 'logic' },
    { name: 's_axis', type: 'axis_if.slave' },
    { name: 'm_axis', type: 'axis_if.master' }
  ],
  features: {
    useInterfaces: true,
    generatePackage: true,
    generateTestbench: true
  }
});

console.log(`Generated: ${svModule.artifacts.join(', ')}`);
```

## Features

### Language Standards

- **SystemVerilog-2017**: Full IEEE 1800-2017 support
- **Verilog-2005**: Backward compatible code generation
- **Synthesizable**: Vendor-agnostic synthesis support

### Code Generation

- **Modules**: Parameterized, interface-based design
- **Interfaces**: AXI-Stream, AXI-Lite, custom protocols
- **Packages**: Types, constants, functions
- **Testbenches**: Verification environments

### Construct Usage

- **always_ff**: Sequential logic (flip-flops)
- **always_comb**: Combinational logic
- **always_latch**: Intentional latches (rare)

## Use Cases

### 1. Generate Module with Interface

Create a module using SystemVerilog interfaces:

```javascript
const result = await ctx.task(generateSVModule, {
  moduleName: 'axis_width_converter',
  parameters: {
    S_DATA_WIDTH: { type: 'int', default: 32 },
    M_DATA_WIDTH: { type: 'int', default: 64 }
  },
  interfaces: [
    { name: 's_axis', type: 'axis_if', modport: 'slave' },
    { name: 'm_axis', type: 'axis_if', modport: 'master' }
  ]
});
```

### 2. Generate Package

Create a reusable SystemVerilog package:

```javascript
const result = await ctx.task(generateSVPackage, {
  packageName: 'project_pkg',
  types: [
    { name: 'state_t', kind: 'enum', values: ['IDLE', 'RUN', 'DONE'] },
    { name: 'packet_t', kind: 'struct', packed: true, fields: [
      { name: 'valid', type: 'logic' },
      { name: 'data', type: 'logic [63:0]' },
      { name: 'last', type: 'logic' }
    ]}
  ],
  functions: ['clog2', 'onehot_to_bin']
});
```

### 3. Generate Interface

Create a custom interface definition:

```javascript
const result = await ctx.task(generateSVInterface, {
  interfaceName: 'memory_if',
  parameters: {
    ADDR_WIDTH: { type: 'int', default: 16 },
    DATA_WIDTH: { type: 'int', default: 32 }
  },
  signals: [
    { name: 'req', type: 'logic' },
    { name: 'wr', type: 'logic' },
    { name: 'addr', type: 'logic [ADDR_WIDTH-1:0]' },
    { name: 'wdata', type: 'logic [DATA_WIDTH-1:0]' },
    { name: 'rdata', type: 'logic [DATA_WIDTH-1:0]' },
    { name: 'ack', type: 'logic' }
  ],
  modports: [
    { name: 'master', inputs: ['ack', 'rdata'], outputs: ['req', 'wr', 'addr', 'wdata'] },
    { name: 'slave', inputs: ['req', 'wr', 'addr', 'wdata'], outputs: ['ack', 'rdata'] }
  ]
});
```

### 4. Analyze and Fix Code

Check code for common issues:

```javascript
const result = await ctx.task(analyzeSystemVerilog, {
  sourceFiles: ['src/*.sv'],
  checks: [
    'always_block_type',
    'blocking_nonblocking',
    'inferred_latches',
    'full_case_parallel_case',
    'parameter_vs_localparam'
  ],
  autoFix: true
});
```

## Configuration

### Module Configuration

```json
{
  "module": {
    "name": "data_processor",
    "standard": "SystemVerilog-2017",
    "resetStyle": "async_active_low"
  },
  "parameters": {
    "DATA_WIDTH": {
      "type": "int",
      "default": 32,
      "description": "Width of data bus"
    }
  },
  "style": {
    "alwaysBlockStyle": "sv_explicit",
    "portDeclaration": "ansi",
    "identifierCase": "snake_case"
  }
}
```

### Interface Configuration

```json
{
  "interface": {
    "name": "axis_if",
    "clockPort": "aclk",
    "resetPort": "aresetn",
    "resetPolarity": "active_low"
  },
  "parameters": {
    "DATA_WIDTH": { "type": "int", "default": 32 },
    "USER_WIDTH": { "type": "int", "default": 1 }
  }
}
```

## Output Files

### Generated Artifacts

| File | Description |
|------|-------------|
| `src/<name>.sv` | Main module |
| `src/<name>_pkg.sv` | Package definitions |
| `src/<name>_if.sv` | Interface definitions |
| `tb/<name>_tb.sv` | Testbench |
| `tb/<name>_pkg.sv` | Test package |

## Integration

### Build System Integration

**Vivado TCL:**
```tcl
# Add SystemVerilog sources
add_files -fileset sources_1 [glob src/*.sv]
add_files -fileset sim_1 [glob tb/*.sv]

# Set file type
set_property file_type SystemVerilog [get_files *.sv]
```

**Verilator:**
```bash
verilator --lint-only -Wall --timing src/module.sv
verilator --cc --exe --build src/module.sv tb/module_tb.cpp
```

**Verible Lint:**
```bash
verible-verilog-lint --rules_config=.rules.verible src/*.sv
verible-verilog-format --inplace src/*.sv
```

### Process Integration

The Verilog/SystemVerilog skill integrates with these processes:

- `verilog-systemverilog-design.js` - Primary SV development
- `testbench-development.js` - Testbench creation
- `uvm-testbench.js` - UVM environments
- `sva-development.js` - Assertions

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Latch inferred | Incomplete always_comb | Add default assignments |
| Blocking in always_ff | Wrong assignment type | Use non-blocking `<=` |
| Synthesis warning | plain `always` block | Use `always_ff`/`always_comb` |
| Interface mismatch | Wrong modport | Check master/slave directions |

### Validation Commands

```bash
# Lint with Verilator
verilator --lint-only -Wall src/module.sv

# Lint with Verible
verible-verilog-lint src/module.sv

# Compile check with Icarus
iverilog -g2012 -Wall src/module.sv

# Format code
verible-verilog-format --inplace src/module.sv
```

## Best Practices

1. **Use always_ff/always_comb** - Never plain `always @*`
2. **Default assignments first** - Prevents latches in combinational logic
3. **Non-blocking in sequential** - Always use `<=` in always_ff
4. **Interfaces for protocols** - AXI, Wishbone, custom buses
5. **Packages for shared types** - Centralize type definitions

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Purpose |
|--------|---------|
| verilator-mcp | RTL simulation, testbench generation |
| verible-mcp | SystemVerilog linting, formatting |
| yosys-mcp | Synthesis quality checks |

## References

- [IEEE 1800-2017 SystemVerilog](https://standards.ieee.org/standard/1800-2017.html)
- [Verilator Documentation](https://verilator.org/guide/latest/)
- [Verible Documentation](https://chipsalliance.github.io/verible/)
- [Xilinx SystemVerilog Support](https://docs.xilinx.com/r/en-US/ug901-vivado-synthesis)

## See Also

- [SKILL.md](./SKILL.md) - Full skill definition
- [Verilog/SystemVerilog Design Process](../../verilog-systemverilog-design.js)
- [UVM Testbench Process](../../uvm-testbench.js)
