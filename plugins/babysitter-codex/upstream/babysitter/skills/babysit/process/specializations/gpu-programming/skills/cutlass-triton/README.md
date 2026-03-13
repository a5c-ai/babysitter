# CUTLASS/Triton Skill

## Overview

The `cutlass-triton` skill provides high-performance kernel template libraries and DSLs for generating optimized GPU kernels.

## Quick Start

### Prerequisites

1. **CUTLASS 3.0+** - C++ header-only library
2. **Triton 2.0+** - Python DSL
3. **CUDA Toolkit 11.0+** - Base toolkit

### Installation

```bash
# CUTLASS (clone from GitHub)
git clone https://github.com/NVIDIA/cutlass.git

# Triton
pip install triton
```

## Usage

### Basic Operations

```bash
# Generate CUTLASS GEMM
/skill cutlass-triton generate-cutlass --shape "128x256x64" --dtype fp16

# Generate Triton kernel
/skill cutlass-triton generate-triton --operation matmul --autotune

# Benchmark vs cuBLAS
/skill cutlass-triton benchmark --size 4096 --dtype fp16
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(cutlassTritonTask, {
  framework: 'triton',
  operation: 'matmul',
  autoTune: true,
  targetPerformance: 'max_tflops'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **CUTLASS GEMM** | Template-based GEMM |
| **Triton Kernels** | Python DSL compilation |
| **Auto-tuning** | Automatic config selection |
| **Epilogues** | Fused post-processing |
| **Flash Attention** | Optimized attention |

## Framework Comparison

| Feature | CUTLASS | Triton |
|---------|---------|--------|
| Language | C++ | Python |
| Flexibility | High | Medium |
| Ease of use | Low | High |
| Performance | Optimal | Near-optimal |

## Process Integration

1. **tensor-core-programming.js** - Tensor cores
2. **custom-cuda-operator-development.js** - Custom ops
3. **ml-inference-optimization.js** - ML inference

## Related Skills

- **cublas-cudnn** - Library integration
- **tensor-core-specialist** - Tensor core agent

## References

- [CUTLASS GitHub](https://github.com/NVIDIA/cutlass)
- [Triton Documentation](https://triton-lang.org/)
- [Flash Attention](https://github.com/Dao-AILab/flash-attention)

---

**Backlog ID:** SK-016
**Category:** Kernel Generation
**Status:** Active
