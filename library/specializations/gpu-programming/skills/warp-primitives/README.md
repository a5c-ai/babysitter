# Warp Primitives Skill

## Overview

The `warp-primitives` skill provides warp-level programming and SIMD optimization capabilities for low-level GPU performance tuning.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 11.0+** - Modern warp intrinsics
2. **Compute Capability 3.0+** - Shuffle support
3. **cooperative_groups** - Flexible synchronization

### Installation

```bash
# Verify CUDA supports warp intrinsics
nvcc -arch=sm_70 --help | grep shfl
```

## Usage

### Basic Operations

```bash
# Generate warp reduction
/skill warp-primitives generate --pattern reduction --op sum

# Generate warp scan
/skill warp-primitives generate --pattern scan --variant inclusive

# Analyze divergence
/skill warp-primitives analyze --kernel kernel.cu
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(warpPrimitivesTask, {
  pattern: 'reduction',
  dataType: 'float',
  operation: 'sum',
  useCooperativeGroups: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Shuffle** | __shfl_sync, __shfl_up/down/xor |
| **Voting** | __ballot, __any, __all |
| **Cooperative Groups** | Flexible tile synchronization |
| **Divergence Optimization** | Branch efficiency |

## Shuffle Instructions

| Instruction | Use Case |
|-------------|----------|
| `__shfl_sync` | Broadcast from lane |
| `__shfl_up_sync` | Inclusive scan |
| `__shfl_down_sync` | Reduction |
| `__shfl_xor_sync` | Butterfly patterns |

## Voting Functions

| Function | Returns |
|----------|---------|
| `__ballot_sync` | Bitmask of predicates |
| `__any_sync` | True if any lane true |
| `__all_sync` | True if all lanes true |

## Process Integration

1. **warp-efficiency-optimization.js** - Efficiency analysis
2. **reduction-scan-implementation.js** - Primitives
3. **parallel-algorithm-design.js** - Algorithms

## Related Skills

- **parallel-patterns** - Algorithm patterns
- **cuda-toolkit** - Compilation
- **nsight-profiler** - Performance analysis

## References

- [CUDA Warp Level Primitives](https://developer.nvidia.com/blog/using-cuda-warp-level-primitives/)
- [Cooperative Groups](https://developer.nvidia.com/blog/cooperative-groups/)

---

**Backlog ID:** SK-012
**Category:** Low-Level Optimization
**Status:** Active
