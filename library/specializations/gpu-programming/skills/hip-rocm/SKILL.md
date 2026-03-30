---
name: hip-rocm
description: AMD HIP and ROCm ecosystem for cross-platform GPU development. Execute hipify conversion tools, generate HIP-compatible kernel code, handle CUDA/HIP API differences, configure ROCm toolchain, and profile with rocprof.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: cross-platform
  backlog-id: SK-009
---

# hip-rocm

You are **hip-rocm** - a specialized skill for AMD HIP and ROCm ecosystem development. This skill provides expert capabilities for cross-platform GPU programming targeting AMD GPUs.

## Overview

This skill enables AI-powered AMD GPU development including:
- Execute hipify conversion tools (hipify-perl, hipify-clang)
- Generate HIP-compatible kernel code
- Handle CUDA/HIP API differences
- Configure ROCm toolchain compilation
- Profile with rocprof and omniperf
- Support MI100/MI200/MI300 architectures
- Maintain single-source NVIDIA/AMD code
- Benchmark cross-platform performance

## Prerequisites

- ROCm 5.0+
- HIP runtime
- hipify tools
- AMD GPU (or NVIDIA GPU with HIP)

## Capabilities

### 1. CUDA to HIP Conversion

Convert CUDA code to HIP:

```bash
# Using hipify-perl (quick conversion)
hipify-perl cuda_file.cu > hip_file.cpp

# Using hipify-clang (more accurate)
hipify-clang cuda_file.cu -o hip_file.cpp

# Batch conversion
hipify-perl -inplace *.cu
hipconvertinplace.sh .

# Generate conversion statistics
hipify-perl --print-stats cuda_file.cu

# Exclude certain patterns
hipify-perl --skip-includes cuda_file.cu > hip_file.cpp
```

### 2. HIP Kernel Development

Write HIP-compatible kernels:

```cpp
#include <hip/hip_runtime.h>

// HIP kernel (portable to CUDA and AMD)
__global__ void vectorAdd(const float* a, const float* b, float* c, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        c[idx] = a[idx] + b[idx];
    }
}

// Launch syntax (same as CUDA)
int main() {
    // Allocate memory
    float *d_a, *d_b, *d_c;
    hipMalloc(&d_a, size);
    hipMalloc(&d_b, size);
    hipMalloc(&d_c, size);

    // Copy to device
    hipMemcpy(d_a, h_a, size, hipMemcpyHostToDevice);
    hipMemcpy(d_b, h_b, size, hipMemcpyHostToDevice);

    // Launch kernel
    int blockSize = 256;
    int numBlocks = (n + blockSize - 1) / blockSize;
    hipLaunchKernelGGL(vectorAdd, dim3(numBlocks), dim3(blockSize),
        0, 0, d_a, d_b, d_c, n);

    // Alternative launch syntax
    vectorAdd<<<numBlocks, blockSize>>>(d_a, d_b, d_c, n);

    // Synchronize and copy back
    hipDeviceSynchronize();
    hipMemcpy(h_c, d_c, size, hipMemcpyDeviceToHost);

    // Cleanup
    hipFree(d_a);
    hipFree(d_b);
    hipFree(d_c);
}
```

### 3. API Compatibility Macros

Handle CUDA/HIP differences:

```cpp
// Platform detection
#ifdef __HIP_PLATFORM_AMD__
    // AMD-specific code
#elif defined(__HIP_PLATFORM_NVIDIA__)
    // NVIDIA HIP code
#elif defined(__CUDA_ARCH__)
    // CUDA-specific code
#endif

// Common compatibility header
#if defined(__HIPCC__) || defined(__HIP__)
    #include <hip/hip_runtime.h>
    #define DEVICE_SYNC hipDeviceSynchronize
    #define MALLOC hipMalloc
    #define FREE hipFree
    #define MEMCPY hipMemcpy
#else
    #include <cuda_runtime.h>
    #define DEVICE_SYNC cudaDeviceSynchronize
    #define MALLOC cudaMalloc
    #define FREE cudaFree
    #define MEMCPY cudaMemcpy
#endif

// Warp size handling
#ifdef __HIP_PLATFORM_AMD__
    #define WARP_SIZE 64  // AMD wavefront
#else
    #define WARP_SIZE 32  // NVIDIA warp
#endif
```

### 4. ROCm Compilation

Compile HIP code:

```bash
# Compile for AMD GPU
hipcc -o program program.cpp

# Specify target architecture
hipcc --offload-arch=gfx90a -o program program.cpp  # MI200
hipcc --offload-arch=gfx942 -o program program.cpp  # MI300

# Multiple targets
hipcc --offload-arch=gfx908 --offload-arch=gfx90a -o program program.cpp

# With optimization
hipcc -O3 -o program program.cpp

# Generate assembly
hipcc -S --offload-arch=gfx90a program.cpp

# Verbose compilation
hipcc -v -o program program.cpp

# CMake configuration
set(CMAKE_CXX_COMPILER hipcc)
set(GPU_TARGETS "gfx90a" CACHE STRING "GPU architectures")
```

### 5. Profiling with rocprof

Profile AMD GPU applications:

```bash
# Basic profiling
rocprof ./program

# Collect specific metrics
rocprof -i metrics.txt ./program

# Generate trace
rocprof --hip-trace ./program
rocprof --hsa-trace ./program

# System trace
rocprof --sys-trace ./program

# Export to JSON
rocprof --stats --json ./program

# Metrics file example (metrics.txt)
# pmc: SQ_WAVES, SQ_INSTS_VALU, SQ_INSTS_SMEM
# pmc: TCC_HIT_sum, TCC_MISS_sum
```

### 6. Omniperf Analysis

Deep performance analysis:

```bash
# Profile application
omniperf profile -n workload_name ./program

# Analyze profile
omniperf analyze -p workload_name

# Web-based GUI
omniperf analyze -p workload_name --gui

# Compare profiles
omniperf analyze -p baseline -p optimized --compare

# Specific analysis sections
omniperf analyze -p workload_name --metric-set memory
omniperf analyze -p workload_name --metric-set compute
```

### 7. Architecture-Specific Optimization

Optimize for AMD architectures:

```cpp
// Wave-aware programming (64-thread wavefront)
__device__ int waveReduceSum(int val) {
    #pragma unroll
    for (int offset = 32; offset > 0; offset >>= 1) {
        val += __shfl_down(val, offset);
    }
    return val;
}

// Use LDS (Local Data Share) efficiently
__shared__ __align__(16) float lds[256];

// Memory coalescing for AMD (256-byte granularity)
__global__ void coalescedKernel(float4* data, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        float4 val = data[idx];  // 16-byte aligned load
        // Process...
        data[idx] = val;
    }
}

// Architecture-specific kernels
#if __gfx90a__ || __gfx942__
    // MI200/MI300 optimizations
    // Use matrix cores (MFMA instructions)
#elif __gfx908__
    // MI100 optimizations
#endif
```

### 8. hipBLAS and rocBLAS

GPU math libraries:

```cpp
#include <hipblas/hipblas.h>
// Or for ROCm-native
#include <rocblas/rocblas.h>

hipblasHandle_t handle;
hipblasCreate(&handle);

// GEMM operation
float alpha = 1.0f, beta = 0.0f;
hipblasSgemm(handle,
    HIPBLAS_OP_N, HIPBLAS_OP_N,
    M, N, K,
    &alpha,
    d_A, M,
    d_B, K,
    &beta,
    d_C, M);

// rocBLAS with explicit stream
rocblas_handle roc_handle;
rocblas_create_handle(&roc_handle);
rocblas_set_stream(roc_handle, stream);

rocblas_sgemm(roc_handle,
    rocblas_operation_none, rocblas_operation_none,
    M, N, K,
    &alpha, d_A, M, d_B, K, &beta, d_C, M);
```

### 9. RCCL Collective Operations

AMD's NCCL equivalent:

```cpp
#include <rccl/rccl.h>

// Initialize RCCL (same API as NCCL)
rcclComm_t comm;
rcclUniqueId id;
rcclGetUniqueId(&id);
rcclCommInitRank(&comm, worldSize, id, rank);

// All-reduce
rcclAllReduce(sendbuff, recvbuff, count, rcclFloat, rcclSum, comm, stream);

// Cleanup
rcclCommDestroy(comm);
```

## Process Integration

This skill integrates with the following processes:
- `hip-porting-cross-platform.js` - Cross-platform porting
- `multi-gpu-programming.js` - Multi-GPU development

## Output Format

```json
{
  "operation": "hipify",
  "status": "success",
  "input_files": ["kernel.cu", "main.cu"],
  "output_files": ["kernel.cpp", "main.cpp"],
  "conversion_stats": {
    "cuda_calls_converted": 45,
    "manual_review_needed": 3,
    "warnings": ["__shfl_sync not directly portable to HIP"]
  },
  "target_architectures": ["gfx90a", "gfx942"],
  "recommendations": [
    "Review wavefront size (64 vs 32) in reduction kernels",
    "Consider using rocBLAS for BLAS operations"
  ]
}
```

## Dependencies

- ROCm 5.0+
- HIP runtime
- hipify-perl or hipify-clang
- rocprof/omniperf (for profiling)

## Constraints

- Warp/wavefront size differs (32 vs 64)
- Some CUDA intrinsics need manual porting
- Texture memory API differs
- CUDA-specific features may not port
