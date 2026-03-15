# Parallel Patterns Skill

## Overview

The `parallel-patterns` skill provides GPU parallel algorithm design patterns and implementations for common parallel primitives.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 11.0+** - Includes CUB and Thrust
2. **CUB Library** - Block/device primitives
3. **Thrust Library** - High-level algorithms

### Installation

```bash
# CUB and Thrust included with CUDA
nvcc --version
```

## Usage

### Basic Operations

```bash
# Generate reduction kernel
/skill parallel-patterns generate --pattern reduction --dtype float

# Generate scan implementation
/skill parallel-patterns generate --pattern scan --variant inclusive

# Generate radix sort
/skill parallel-patterns generate --pattern radix-sort --key-type uint32
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(parallelPatternsTask, {
  pattern: 'reduction',
  dataType: 'float',
  operation: 'sum',
  blockSize: 256
});
```

## Capabilities

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Reduction** | Combine elements | Sum, max, min |
| **Scan** | Prefix operations | Compaction, allocation |
| **Histogram** | Count occurrences | Statistics, binning |
| **Sort** | Order elements | Radix, merge sort |
| **Compact** | Filter elements | Stream compaction |

## Pattern Selection Guide

| Data Size | Pattern | Notes |
|-----------|---------|-------|
| < 1K | Single block | Shared memory only |
| 1K - 1M | Multi-block | Atomic reduction |
| > 1M | Hierarchical | CUB/Thrust |

## Process Integration

1. **parallel-algorithm-design.js** - Algorithm design
2. **reduction-scan-implementation.js** - Core primitives
3. **atomic-operations-synchronization.js** - Atomics

## Related Skills

- **warp-primitives** - Low-level operations
- **parallel-algorithm-designer** - Algorithm agent

## References

- [CUB Documentation](https://nvlabs.github.io/cub/)
- [Thrust Documentation](https://thrust.github.io/)
- [GPU Gems 3: Parallel Prefix Sum](https://developer.nvidia.com/gpugems/gpugems3/part-vi-gpu-computing/chapter-39-parallel-prefix-sum-scan-cuda)

---

**Backlog ID:** SK-011
**Category:** Parallel Algorithms
**Status:** Active
