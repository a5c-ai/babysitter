---
name: memory-analysis
description: Embedded memory analysis, optimization, and leak detection
category: Resource Optimization
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Memory Analysis Skill

## Overview

This skill provides comprehensive memory analysis capabilities for embedded systems, including linker map analysis, stack usage estimation, heap fragmentation detection, and memory optimization strategies.

## Capabilities

### Linker Map Analysis
- Map file parsing and interpretation
- Symbol size analysis
- Section size breakdown
- Memory region utilization
- Unused symbol detection
- Cross-reference analysis

### Stack Analysis
- Static stack usage analysis
- Call graph generation
- Worst-case stack depth calculation
- Per-function stack usage
- Interrupt stack analysis
- Stack overflow detection strategies

### Heap Analysis
- Heap fragmentation analysis
- Allocation pattern analysis
- Memory pool sizing
- Leak detection strategies
- Peak usage tracking
- Block size distribution

### Memory Optimization
- Section placement optimization
- Flash vs RAM trade-offs
- Const correctness enforcement
- String pooling strategies
- Data structure packing
- Alignment optimization

### Memory Protection
- MPU region configuration
- Stack guard implementation
- Buffer overflow protection
- Memory isolation strategies

### Tooling Integration
- GCC map file analysis
- ARM Compiler map files
- Puncover integration
- Static analysis integration
- objdump/readelf usage

## Target Processes

- `memory-architecture-planning.js` - Memory layout design
- `code-size-optimization.js` - Size reduction strategies
- `execution-speed-profiling.js` - Memory access optimization
- `bootloader-implementation.js` - Multi-image memory layout

## Dependencies

- Linker map file parsers
- Stack analysis tools (Puncover, GCC stack analysis)
- objdump, readelf, nm utilities

## Usage Context

This skill is invoked when tasks require:
- Memory usage optimization
- Stack size determination
- Heap configuration design
- Memory leak investigation
- Code size reduction

## Analysis Outputs

### Map File Summary
```
Section          Size      Used      Free   Usage
.text          128 KB    98.5 KB   29.5 KB  76.9%
.rodata         32 KB    24.2 KB    7.8 KB  75.6%
.data            8 KB     2.1 KB    5.9 KB  26.2%
.bss            16 KB    12.4 KB    3.6 KB  77.5%
```

### Stack Analysis
```
Function             Stack   Depth   Total
main                   64       1      64
process_data          128       2     192
parse_message         256       3     448
handle_packet          96       4     544
```

## Configuration

```yaml
memory_analysis:
  map_file: build/firmware.map
  stack_analysis: enabled
  heap_tracking: enabled
  warning_threshold: 85  # percent
  tools:
    - puncover
    - gcc-stack-analyzer
```
