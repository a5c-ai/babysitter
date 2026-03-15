# GPU Memory Analysis Skill

## Overview

The `gpu-memory-analysis` skill provides specialized capabilities for GPU memory hierarchy analysis and optimization. It enables detection of memory access inefficiencies and generation of optimized access patterns.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 11.0+** - Development tools
2. **Nsight Compute** - Memory profiling
3. **compute-sanitizer** - Memory validation

### Installation

```bash
# Verify tools
ncu --version
compute-sanitizer --version
```

## Usage

### Basic Operations

```bash
# Analyze memory access patterns
/skill gpu-memory-analysis analyze --kernel matmul.cu

# Detect bank conflicts
/skill gpu-memory-analysis bank-conflicts --program ./cuda_app

# Profile bandwidth
/skill gpu-memory-analysis bandwidth --program ./cuda_app
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(gpuMemoryAnalysisTask, {
  operation: 'analyze-kernel',
  kernelFile: 'kernel.cu',
  metrics: ['coalescing', 'bank-conflicts', 'cache-hits'],
  outputFile: 'memory_report.json'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Coalescing Analysis** | Memory access pattern optimization |
| **Bank Conflict Detection** | Shared memory conflict identification |
| **Cache Optimization** | L1/L2 cache utilization |
| **Bandwidth Profiling** | Memory throughput measurement |
| **Pattern Generation** | Optimized access code generation |

## Key Optimizations

### Coalesced Access
- Consecutive threads access consecutive addresses
- Aligned to 128-byte boundaries
- Use SoA over AoS layouts

### Bank Conflicts
- Pad shared memory arrays
- Avoid stride-32 access patterns
- Use warp-level access patterns

### Cache Efficiency
- Use `__ldg` for read-only data
- Configure cache preference per kernel
- Avoid cache thrashing

## Process Integration

1. **gpu-memory-optimization.js** - Memory optimization
2. **shared-memory-usage-patterns.js** - Shared memory
3. **gpu-cpu-data-transfer-optimization.js** - Transfers
4. **gpu-memory-pool-allocator.js** - Pooling

## Related Skills

- **nsight-profiler** - Performance profiling
- **cuda-toolkit** - Kernel development
- **gpu-memory-expert** - Memory agent

## References

- [CUDA Memory Optimization](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#memory-optimizations)
- [Nsight Compute Memory Analysis](https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html#memory-workload-analysis)

---

**Backlog ID:** SK-005
**Category:** Memory Optimization
**Status:** Active
