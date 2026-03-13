# VHDL Language Skill

## Overview

The VHDL Language skill provides expert capabilities for developing synthesizable VHDL code following IEEE 1076 standards. It handles entity/architecture design, package creation, testbench development, and applies vendor-specific synthesis attributes.

## Quick Start

### Prerequisites

1. GHDL or commercial VHDL simulator installed
2. Target FPGA vendor toolchain (Vivado, Quartus)
3. Design requirements specification

### Basic Usage

```javascript
// In a babysitter process
const vhdlModule = await ctx.task(generateVHDLModule, {
  moduleName: 'sync_fifo',
  generics: {
    DATA_WIDTH: { type: 'positive', default: 8 },
    DEPTH: { type: 'positive', default: 16 }
  },
  ports: [
    { name: 'clk', direction: 'in', type: 'std_logic' },
    { name: 'rst_n', direction: 'in', type: 'std_logic' },
    { name: 'wr_en', direction: 'in', type: 'std_logic' },
    { name: 'wr_data', direction: 'in', type: 'std_logic_vector', width: 'DATA_WIDTH' },
    { name: 'full', direction: 'out', type: 'std_logic' },
    { name: 'rd_en', direction: 'in', type: 'std_logic' },
    { name: 'rd_data', direction: 'out', type: 'std_logic_vector', width: 'DATA_WIDTH' },
    { name: 'empty', direction: 'out', type: 'std_logic' }
  ],
  features: {
    generatePackage: true,
    generateTestbench: true,
    targetVendor: 'xilinx'
  }
});

console.log(`Generated: ${vhdlModule.artifacts.join(', ')}`);
```

## Features

### Language Compliance

- **IEEE 1076-2008/2019**: Full standard compliance
- **Synthesizable code**: Vendor-agnostic synthesis support
- **Numeric_std**: Proper use of recommended libraries
- **No deprecated libraries**: Avoids std_logic_arith

### Code Generation

- **Entity declarations**: Clean, parameterized interfaces
- **Architecture styles**: RTL, behavioral, structural
- **Packages**: Type definitions, constants, functions
- **Testbenches**: Self-checking with assertions

### Vendor Support

- **Xilinx/AMD**: ASYNC_REG, RAM_STYLE, MAX_FANOUT
- **Intel/Altera**: ramstyle, preserve attributes
- **Generic**: Portable synthesis pragmas

## Use Cases

### 1. Generate Basic Module

Create a simple synchronous module:

```javascript
const result = await ctx.task(generateVHDLModule, {
  moduleName: 'counter',
  generics: {
    WIDTH: { type: 'positive', default: 8 }
  },
  ports: [
    { name: 'clk', direction: 'in', type: 'std_logic' },
    { name: 'rst_n', direction: 'in', type: 'std_logic' },
    { name: 'enable', direction: 'in', type: 'std_logic' },
    { name: 'count', direction: 'out', type: 'unsigned', width: 'WIDTH' }
  ],
  resetType: 'async_active_low'
});
```

### 2. Generate Package

Create a reusable package:

```javascript
const result = await ctx.task(generateVHDLPackage, {
  packageName: 'project_types_pkg',
  types: [
    { name: 'state_type', kind: 'enum', values: ['IDLE', 'RUN', 'DONE'] },
    { name: 'data_bus_t', kind: 'record', fields: [
      { name: 'valid', type: 'std_logic' },
      { name: 'data', type: 'std_logic_vector(31 downto 0)' },
      { name: 'last', type: 'std_logic' }
    ]}
  ],
  constants: [
    { name: 'CLK_FREQ', type: 'natural', value: 100000000 }
  ],
  functions: ['clog2', 'max', 'min']
});
```

### 3. Generate Testbench

Create a comprehensive testbench:

```javascript
const result = await ctx.task(generateVHDLTestbench, {
  dutEntity: 'sync_fifo',
  clockPeriod: '10 ns',
  testCases: [
    { name: 'reset', description: 'Verify reset behavior' },
    { name: 'single_write_read', description: 'Write and read one word' },
    { name: 'fill_full', description: 'Fill FIFO to capacity' },
    { name: 'underflow', description: 'Attempt read from empty' }
  ],
  selfChecking: true
});
```

### 4. Fix Anti-Patterns

Analyze and fix common issues:

```javascript
const result = await ctx.task(analyzeVHDL, {
  sourceFiles: ['src/old_module.vhd'],
  checks: [
    'incomplete_sensitivity_list',
    'inferred_latches',
    'deprecated_libraries',
    'missing_resets',
    'non_synthesizable_constructs'
  ],
  autoFix: true
});
```

## Configuration

### Module Configuration

```json
{
  "module": {
    "name": "example_module",
    "architecture": "rtl",
    "library": "work"
  },
  "generics": {
    "DATA_WIDTH": {
      "type": "positive",
      "default": 8,
      "description": "Width of data bus"
    }
  },
  "ports": {
    "style": "one_per_line",
    "grouping": ["clock_reset", "input", "output"]
  },
  "resetType": "async_active_low",
  "targetVendor": "xilinx",
  "standard": "2008"
}
```

### Code Style Configuration

```json
{
  "style": {
    "indentation": 2,
    "keywordCase": "lowercase",
    "identifierCase": "snake_case",
    "maxLineLength": 100,
    "alignPorts": true,
    "alignSignals": true
  }
}
```

## Output Files

### Generated Artifacts

| File | Description |
|------|-------------|
| `src/<name>.vhd` | Main entity and architecture |
| `src/<name>_pkg.vhd` | Package with types/constants |
| `tb/<name>_tb.vhd` | Self-checking testbench |
| `constraints/<name>.xdc` | Timing constraints (if applicable) |

## Integration

### Build System Integration

**Vivado TCL:**
```tcl
# Add VHDL sources
add_files -fileset sources_1 [glob src/*.vhd]
add_files -fileset sim_1 [glob tb/*.vhd]

# Set VHDL-2008 mode
set_property file_type {VHDL 2008} [get_files *.vhd]
```

**GHDL Makefile:**
```makefile
GHDL = ghdl
GHDL_FLAGS = --std=08

SRCS = src/sync_fifo.vhd
TB_SRCS = tb/sync_fifo_tb.vhd

analyze:
	$(GHDL) -a $(GHDL_FLAGS) $(SRCS)
	$(GHDL) -a $(GHDL_FLAGS) $(TB_SRCS)

elaborate: analyze
	$(GHDL) -e $(GHDL_FLAGS) sync_fifo_tb

simulate: elaborate
	$(GHDL) -r $(GHDL_FLAGS) sync_fifo_tb --wave=wave.ghw
```

### Process Integration

The VHDL Language skill integrates with these FPGA processes:

- `vhdl-module-development.js` - Primary VHDL development
- `testbench-development.js` - Testbench creation
- `rtl-module-architecture.js` - Module design
- `functional-simulation.js` - Simulation support

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Incomplete sensitivity list | Missing signals | Use VHDL-2008 `all` or list all signals |
| Latch inferred | Incomplete if-else | Ensure all branches assign all outputs |
| Library conflict | std_logic_arith mixed | Use only numeric_std |
| Simulation mismatch | Delta cycle issues | Review signal vs variable timing |

### Validation Commands

```bash
# Analyze VHDL syntax
ghdl -a --std=08 src/module.vhd

# Check for synthesis issues
ghdl -a --std=08 -fsynopsys src/module.vhd

# Run testbench
ghdl -e --std=08 module_tb
ghdl -r --std=08 module_tb --assert-level=error

# Generate waveform
ghdl -r --std=08 module_tb --wave=output.ghw
```

## Best Practices

1. **Use VHDL-2008** - Leverage modern features like process(all)
2. **Prefer numeric_std** - Never use std_logic_arith
3. **Document generics** - Add comments for all parameters
4. **Self-checking tests** - Use assert for automatic verification
5. **Vendor attributes** - Apply ASYNC_REG to synchronizers

## References

- [IEEE 1076-2019 VHDL Standard](https://standards.ieee.org/standard/1076-2019.html)
- [GHDL Documentation](https://ghdl.github.io/ghdl/)
- [Xilinx UG901 Synthesis Guide](https://docs.xilinx.com/r/en-US/ug901-vivado-synthesis)
- [Intel Quartus Synthesis Reference](https://www.intel.com/content/www/us/en/docs/programmable/683323/)

## See Also

- [SKILL.md](./SKILL.md) - Full skill definition
- [VHDL Module Development Process](../../vhdl-module-development.js)
- [Testbench Development Process](../../testbench-development.js)
