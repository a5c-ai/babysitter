# cuBLAS/cuDNN Skill

## Overview

The `cublas-cudnn` skill provides expert integration with NVIDIA GPU-accelerated math libraries for deep learning and linear algebra operations.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 11.0+** - Base toolkit
2. **cuBLAS** - Linear algebra library
3. **cuDNN 8.0+** - Deep learning primitives

### Installation

```bash
# Verify libraries
ldconfig -p | grep cublas
ldconfig -p | grep cudnn
```

## Usage

### Basic Operations

```bash
# Generate GEMM code
/skill cublas-cudnn generate-gemm --M 4096 --N 4096 --K 4096 --dtype fp16

# Configure convolution
/skill cublas-cudnn configure-conv --input "64x256x56x56" --filter "512x256x3x3"

# Benchmark algorithms
/skill cublas-cudnn benchmark --operation gemm --iterations 100
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(cublasTask, {
  operation: 'configure-gemm',
  M: 4096, N: 4096, K: 4096,
  dataType: 'CUDA_R_16F',
  useTensorCores: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **cuBLAS GEMM** | Matrix multiplication with tensor cores |
| **cuDNN Conv** | Optimized convolution layers |
| **Mixed Precision** | FP16, TF32, INT8 operations |
| **Algorithm Selection** | Optimal algorithm benchmarking |
| **cuSPARSE** | Sparse matrix operations |

## Tensor Core Support

| Data Type | Compute Capability | Notes |
|-----------|-------------------|-------|
| FP16 | 7.0+ (Volta) | Full support |
| TF32 | 8.0+ (Ampere) | Auto-enabled |
| INT8 | 7.5+ (Turing) | Inference only |
| FP8 | 9.0+ (Hopper) | Latest support |

## Process Integration

1. **tensor-core-programming.js** - Tensor core workflows
2. **ml-inference-optimization.js** - ML inference
3. **custom-cuda-operator-development.js** - Custom operators

## Related Skills

- **tensorrt-optimization** - Model optimization
- **cutlass-triton** - Kernel templates
- **tensor-core-specialist** - Agent expertise

## References

- [cuBLAS Documentation](https://docs.nvidia.com/cuda/cublas/)
- [cuDNN Documentation](https://docs.nvidia.com/deeplearning/cudnn/)
- [cuSPARSE Documentation](https://docs.nvidia.com/cuda/cusparse/)

---

**Backlog ID:** SK-006
**Category:** GPU Libraries
**Status:** Active
