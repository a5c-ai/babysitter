# Unified Memory Skill

## Overview

The `unified-memory` skill provides expert capabilities for CUDA Unified Memory and memory prefetching optimization. It enables simplified memory management with high performance through proper prefetching strategies and memory hints.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 8.0+** - Basic Unified Memory support
2. **CUDA 9.0+** - Hardware page faulting (Pascal+)
3. **GPU CC 6.0+** - Full Unified Memory features
4. **Nsight Systems** - For migration profiling

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

## Usage

### Basic Operations

```bash
# Analyze memory access patterns
/skill unified-memory analyze --program ./cuda_app

# Configure prefetching strategy
/skill unified-memory configure-prefetch --data-size 1GB

# Generate optimized memory configuration
/skill unified-memory generate-config --pattern producer-consumer

# Compare with explicit memory
/skill unified-memory benchmark --compare explicit
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(unifiedMemoryTask, {
  operation: 'optimize-memory',
  dataStructures: ['inputArray', 'outputArray', 'lookupTable'],
  accessPatterns: {
    inputArray: { producer: 'cpu', consumer: 'gpu' },
    outputArray: { producer: 'gpu', consumer: 'cpu' },
    lookupTable: { access: 'read-only', devices: ['gpu'] }
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Managed Allocation** | cudaMallocManaged setup |
| **Prefetch Configuration** | Async prefetch strategies |
| **Memory Advise** | Hint configuration for optimizer |
| **Page Fault Analysis** | Migration profiling |
| **Multi-GPU Support** | Cross-device memory access |
| **Oversubscription** | Beyond GPU memory handling |

## Examples

### Example 1: Basic Unified Memory Setup

```bash
# Generate basic unified memory configuration
/skill unified-memory setup \
  --allocations "inputData:1GB,outputData:1GB" \
  --output config.yaml
```

### Example 2: Prefetch Optimization

```bash
# Configure optimal prefetching
/skill unified-memory optimize-prefetch \
  --program ./cuda_app \
  --profile-data nsys_report.qdrep \
  --output prefetch_strategy.md
```

### Example 3: Multi-GPU Configuration

```bash
# Set up multi-GPU unified memory
/skill unified-memory multi-gpu \
  --num-gpus 4 \
  --partition-strategy "chunk" \
  --peer-access enabled
```

### Example 4: Migration Analysis

```bash
# Analyze memory migrations
/skill unified-memory analyze-migrations \
  --program ./cuda_app \
  --profile \
  --output migration_report.md
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CUDA_VISIBLE_DEVICES` | GPUs for unified memory | All |
| `CUDA_MANAGED_FORCE_DEVICE_ALLOC` | Force device allocation | `0` |

### Skill Configuration

```yaml
# .babysitter/skills/unified-memory.yaml
unified-memory:
  defaults:
    prefetch_enabled: true
    migration_profiling: true
  hints:
    read_only_threshold: 0.95  # 95% reads -> SetReadMostly
    gpu_primary_threshold: 0.80  # 80% GPU access -> SetPreferredLocation GPU
  multi_gpu:
    enable_peer_access: true
    preferred_topology: nvlink
```

## Memory Hints Reference

### cudaMemAdvise Options

| Hint | Use Case | Effect |
|------|----------|--------|
| `SetReadMostly` | Lookup tables | Creates read-only copies |
| `SetPreferredLocation` | Primary device data | Sets page home location |
| `SetAccessedBy` | Multi-device access | Pre-establishes mappings |

### When to Use Each Hint

```
SetReadMostly:
  - Lookup tables, constants
  - Data read by multiple kernels
  - Not modified after initialization

SetPreferredLocation:
  - Large arrays primarily on one device
  - Producer-consumer patterns
  - Reduce migration ping-pong

SetAccessedBy:
  - Frequent multi-GPU access
  - Peer-to-peer operations
  - Reduce first-access faults
```

## Process Integration

### Processes Using This Skill

1. **gpu-cpu-data-transfer-optimization.js** - Transfer optimization
2. **gpu-memory-optimization.js** - Memory strategies
3. **multi-gpu-programming.js** - Multi-GPU memory

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const optimizeMemoryTask = defineTask({
  name: 'optimize-unified-memory',
  description: 'Configure optimal unified memory settings',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Optimize memory for ${inputs.application}`,
      skill: {
        name: 'unified-memory',
        context: {
          operation: 'optimize',
          application: inputs.application,
          dataStructures: inputs.dataStructures,
          targetGPU: inputs.targetGPU,
          enablePrefetch: true,
          profileMigrations: true
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Performance Comparison

### Unified Memory vs Explicit

| Scenario | Explicit | UM (no prefetch) | UM (prefetch) |
|----------|----------|------------------|---------------|
| Simple H2D transfer | Baseline | 10-20% slower | ~Baseline |
| Complex data structures | Manual | Automatic | Automatic |
| Oversubscription | OOM | Works | Works + faster |
| Development time | High | Low | Low |

### Prefetch Impact

```
Without prefetch:
  - Page faults on first access
  - Latency spikes during migration
  - Unpredictable performance

With prefetch:
  - Data ready before kernel
  - Smooth performance
  - Predictable latency
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Slow performance | Page faults | Add prefetch calls |
| CPU access slow | Data on GPU | Prefetch to cudaCpuDeviceId |
| High migration | Ping-pong access | Use SetPreferredLocation |
| Feature not supported | Old GPU/CUDA | Check compute capability |

### Profiling Tips

```bash
# Profile with Nsight Systems
nsys profile --trace=cuda,nvtx ./unified_memory_app

# Look for:
# - CUDA Unified Memory CPU page faults
# - CUDA Unified Memory GPU page faults
# - Memory migration events
# - Prefetch operations
```

## Related Skills

- **gpu-memory-analysis** - Memory access patterns
- **cuda-toolkit** - CUDA development
- **multi-gpu-programming** - Multi-device strategies

## References

- [CUDA Unified Memory](https://developer.nvidia.com/blog/unified-memory-cuda-beginners/)
- [Unified Memory in CUDA 9](https://developer.nvidia.com/blog/unified-memory-cuda-9/)
- [CUDA C++ Programming Guide - Unified Memory](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#um-unified-memory-programming-hd)
- [NVIDIA CCCL Documentation](https://nvidia.github.io/cccl/thrust/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-018
**Category:** Memory Management
**Status:** Active
