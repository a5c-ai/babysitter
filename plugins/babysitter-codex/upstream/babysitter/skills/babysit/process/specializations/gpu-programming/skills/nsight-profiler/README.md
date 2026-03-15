# Nsight Profiler Skill

## Overview

The `nsight-profiler` skill provides expert capabilities for NVIDIA Nsight Systems and Nsight Compute profiling tools. It enables comprehensive GPU performance analysis, bottleneck identification, and optimization guidance.

## Quick Start

### Prerequisites

1. **Nsight Systems 2023.1+** - System-wide profiling
2. **Nsight Compute 2023.1+** - Kernel-level profiling
3. **CUDA Toolkit 11.0+** - CUDA runtime
4. **NVIDIA GPU** - Compute capability 7.0+ for full features

### Installation

```bash
# Verify Nsight Systems
nsys --version

# Verify Nsight Compute
ncu --version
```

## Usage

### Basic Operations

```bash
# System-wide profile
/skill nsight-profiler system-profile --program ./cuda_app

# Kernel profile
/skill nsight-profiler kernel-profile --program ./cuda_app --kernel myKernel

# Roofline analysis
/skill nsight-profiler roofline --program ./cuda_app

# Generate recommendations
/skill nsight-profiler analyze --report profile.ncu-rep
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(nsightProfilerTask, {
  operation: 'kernel-profile',
  program: './cuda_app',
  kernelName: 'matrixMultiply',
  metrics: ['occupancy', 'memory', 'compute'],
  outputFile: 'profile.ncu-rep'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **System Profiling** | Nsight Systems timeline analysis |
| **Kernel Profiling** | Nsight Compute detailed metrics |
| **Occupancy Analysis** | SM utilization optimization |
| **Roofline Analysis** | Performance bound identification |
| **Memory Analysis** | Bandwidth and cache analysis |
| **Warp Efficiency** | Execution efficiency metrics |

## Key Metrics

### Occupancy Metrics
- Achieved Occupancy
- Theoretical Occupancy
- Occupancy Limiters

### Memory Metrics
- Global Memory Throughput
- L1/L2 Cache Hit Rate
- Memory Transactions

### Compute Metrics
- SM Throughput
- Warp Execution Efficiency
- Instruction Mix

## Process Integration

### Processes Using This Skill

1. **performance-profiling-analysis.js** - Performance analysis
2. **occupancy-optimization.js** - Occupancy optimization
3. **warp-efficiency-optimization.js** - Warp efficiency
4. **gpu-memory-optimization.js** - Memory optimization

## Related Skills

- **cuda-toolkit** - Kernel development
- **gpu-benchmarking** - Performance testing
- **gpu-memory-analysis** - Memory optimization

## References

- [Nsight Systems Documentation](https://docs.nvidia.com/nsight-systems/)
- [Nsight Compute Documentation](https://docs.nvidia.com/nsight-compute/)
- [Kernel Profiling Guide](https://docs.nvidia.com/nsight-compute/ProfilingGuide/)

---

**Backlog ID:** SK-002
**Category:** Performance Profiling
**Status:** Active
