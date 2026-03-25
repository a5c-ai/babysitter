# Synthesis Optimization Skill

## Overview

The Synthesis Optimization skill provides expert capabilities for FPGA synthesis optimization. It handles resource utilization analysis, attribute application, inference control, and QoR improvement for Vivado and Quartus flows.

## Quick Start

### Prerequisites

1. Vivado or Quartus toolchain installed
2. RTL source code
3. Synthesis constraints (if any)

### Basic Usage

```javascript
// In a babysitter process
const optimization = await ctx.task(optimizeSynthesis, {
  design: 'packet_processor',
  sourceFiles: ['src/*.sv'],
  constraints: ['constraints/*.xdc'],
  targetDevice: 'xc7a200t-2-fbg484',
  goals: {
    maxFrequency: 200e6,
    lutUtilization: 70,
    timing: 'aggressive'
  }
});

console.log(`Optimization complete: ${optimization.recommendations.length} suggestions`);
```

## Features

### Report Analysis

- **Utilization reports**: LUT, register, BRAM, DSP usage
- **Timing reports**: Critical paths, slack analysis
- **Hierarchy analysis**: Per-module resource breakdown
- **Inference reports**: RAM, DSP, SRL inference results

### Attribute Application

- **RAM_STYLE**: block, distributed, ultra, registers
- **USE_DSP**: yes, no, logic
- **ASYNC_REG**: CDC synchronizer marking
- **MAX_FANOUT**: Fanout limitation
- **FSM_ENCODING**: one_hot, sequential, gray

### Optimization Strategies

- **Pipelining**: Add stages for timing
- **Retiming**: Move registers across logic
- **Register duplication**: Reduce fanout
- **Resource sharing**: Trade latency for area

## Use Cases

### 1. Analyze Synthesis Results

Parse and summarize synthesis reports:

```javascript
const result = await ctx.task(analyzeSynthesisReport, {
  reportFiles: [
    'project/project.runs/synth_1/utilization.rpt',
    'project/project.runs/synth_1/timing_summary.rpt'
  ],
  thresholds: {
    lutWarning: 80,
    lutCritical: 90,
    timingSlack: 0.5
  }
});

console.log(`LUT usage: ${result.utilization.luts.percentage}%`);
console.log(`Worst slack: ${result.timing.worstSlack} ns`);
```

### 2. Apply Optimization Attributes

Add synthesis attributes to RTL:

```javascript
const result = await ctx.task(applyAttributes, {
  sourceFile: 'src/data_path.sv',
  attributes: [
    { signal: 'sync_reg', attribute: 'ASYNC_REG', value: 'TRUE' },
    { signal: 'large_mem', attribute: 'RAM_STYLE', value: 'block' },
    { signal: 'enable', attribute: 'MAX_FANOUT', value: 50 },
    { signal: 'state', attribute: 'FSM_ENCODING', value: 'one_hot' }
  ]
});
```

### 3. Optimize DSP Usage

Balance DSP block usage:

```javascript
const result = await ctx.task(optimizeDSP, {
  sourceFiles: ['src/*.sv'],
  targetDspUsage: 50,  // Target 50% DSP utilization
  strategy: 'performance',  // or 'area'
  dspThreshold: {
    minWidth: 18,  // Use DSP for >= 18-bit multiplies
    maxWidth: 48   // DSP48 max accumulator width
  }
});
```

### 4. Optimize Memory Inference

Control RAM block inference:

```javascript
const result = await ctx.task(optimizeMemory, {
  sourceFiles: ['src/*.sv'],
  rules: [
    { minDepth: 64, style: 'block' },
    { maxDepth: 32, style: 'distributed' },
    { pattern: 'shift_*', style: 'srl' }
  ],
  targetBramUsage: 60
});
```

## Configuration

### Optimization Configuration

```json
{
  "synthesis": {
    "tool": "vivado",
    "strategy": "Flow_PerfOptimized_high",
    "options": {
      "flatten_hierarchy": "rebuilt",
      "gated_clock_conversion": "off",
      "retiming": true
    }
  },
  "targets": {
    "frequency": 200000000,
    "lutUtilization": 75,
    "bramUtilization": 80,
    "dspUtilization": 50
  },
  "attributeDefaults": {
    "syncReg": "ASYNC_REG",
    "ramThreshold": 64,
    "maxFanout": 100
  }
}
```

### Vivado Strategy Options

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `Flow_PerfOptimized_high` | Maximum performance | Timing-critical |
| `Flow_AreaOptimized_high` | Minimum area | Resource-limited |
| `Flow_RuntimeOptimized` | Fast synthesis | Quick iterations |
| `Default` | Balanced | General use |

## Output Files

### Generated Artifacts

| File | Description |
|------|-------------|
| `reports/utilization.rpt` | Resource usage summary |
| `reports/timing_summary.rpt` | Timing analysis |
| `reports/dsp_usage.rpt` | DSP inference details |
| `reports/ram_usage.rpt` | Memory inference details |
| `src/optimized_*.sv` | Attribute-annotated source |

## Integration

### Vivado TCL Integration

```tcl
# Set synthesis strategy
set_property strategy Flow_PerfOptimized_high [get_runs synth_1]

# Enable retiming
set_property STEPS.SYNTH_DESIGN.ARGS.RETIMING true [get_runs synth_1]

# Run synthesis
launch_runs synth_1 -jobs 8
wait_on_run synth_1

# Generate reports
open_run synth_1
report_utilization -file utilization.rpt
report_timing_summary -file timing_summary.rpt
report_ram_utilization -file ram_usage.rpt
report_dsp_usage -file dsp_usage.rpt
```

### Process Integration

The Synthesis Optimization skill integrates with these processes:

- `synthesis-optimization.js` - Primary synthesis optimization
- `timing-closure.js` - Timing-driven synthesis
- `place-and-route.js` - Post-synthesis optimization
- `power-analysis-optimization.js` - Power-aware synthesis

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| BRAM not inferred | Async read or reset | Add output register, remove async |
| DSP not inferred | Wrong operand width | Match DSP48 port widths |
| High LUT usage | Many small RAMs | Use distributed RAM attribute |
| Timing failure | Long combo path | Add pipeline registers |

### Validation Commands

```tcl
# Check inference
report_ram_utilization
report_dsp_usage

# Analyze critical paths
report_timing -from [all_registers] -to [all_registers] -max_paths 10

# Check high fanout
report_high_fanout_nets -load_types -max_nets 20

# Verify attributes applied
report_property [get_cells -hier -filter {NAME =~ *sync_reg*}]
```

## Best Practices

1. **Profile first** - Analyze reports before optimizing
2. **Target bottlenecks** - Focus on critical paths
3. **Use attributes sparingly** - Let tools optimize
4. **Document changes** - Comment why attributes added
5. **Iterate** - Make incremental improvements

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Purpose |
|--------|---------|
| yosys-mcp | Open-source synthesis analysis |
| MCP4EDA | Synthesis and analysis |

## References

- [Xilinx UG901: Vivado Synthesis](https://docs.xilinx.com/r/en-US/ug901-vivado-synthesis)
- [Xilinx UG949: UltraFast Design Methodology](https://docs.xilinx.com/r/en-US/ug949-vivado-design-methodology)
- [Intel Quartus Prime Synthesis](https://www.intel.com/content/www/us/en/docs/programmable/683323/)
- [Yosys Documentation](https://yosyshq.readthedocs.io/)

## See Also

- [SKILL.md](./SKILL.md) - Full skill definition
- [Synthesis Optimization Process](../../synthesis-optimization.js)
- [Timing Closure Process](../../timing-closure.js)
