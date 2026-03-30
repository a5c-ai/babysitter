# NCCL Communication Skill

## Overview

The `nccl-communication` skill provides NVIDIA Collective Communications Library integration for efficient multi-GPU operations.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 11.0+** - Base toolkit
2. **NCCL 2.10+** - Collective communications
3. **Multiple GPUs** - For meaningful use
4. **MPI** - Optional for multi-node

### Installation

```bash
# Verify NCCL
ldconfig -p | grep nccl

# Check version
python -c "import torch; print(torch.cuda.nccl.version())"
```

## Usage

### Basic Operations

```bash
# Initialize communicators
/skill nccl-communication init --num-gpus 4

# Run all-reduce
/skill nccl-communication all-reduce --size 256M --dtype float32

# Benchmark collectives
/skill nccl-communication benchmark --operations all --gpus 4
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(ncclTask, {
  operation: 'all-reduce',
  numGPUs: 4,
  dataSize: 268435456,
  dataType: 'float32',
  reduction: 'sum'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **All-Reduce** | Sum/avg gradients across GPUs |
| **All-Gather** | Collect data from all GPUs |
| **Reduce-Scatter** | Reduce and distribute |
| **Broadcast** | Send from root to all |
| **Point-to-Point** | Direct GPU-GPU transfer |

## Collective Operations

| Operation | Use Case |
|-----------|----------|
| AllReduce | Gradient synchronization |
| AllGather | Model parallelism |
| ReduceScatter | ZeRO optimizer |
| Broadcast | Parameter distribution |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NCCL_DEBUG` | Debug output level |
| `NCCL_ALGO` | Algorithm selection |
| `NCCL_PROTO` | Protocol selection |
| `NCCL_IB_DISABLE` | InfiniBand toggle |

## Process Integration

1. **multi-gpu-programming.js** - Multi-GPU development
2. **gpu-cluster-computing.js** - Cluster computing

## Related Skills

- **multi-gpu-systems-expert** - Multi-GPU agent
- **hip-rocm** - AMD RCCL support

## References

- [NCCL Documentation](https://docs.nvidia.com/deeplearning/nccl/)
- [NCCL Tests](https://github.com/NVIDIA/nccl-tests)

---

**Backlog ID:** SK-007
**Category:** Multi-GPU
**Status:** Active
