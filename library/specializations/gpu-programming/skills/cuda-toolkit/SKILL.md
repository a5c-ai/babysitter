---
name: cuda-toolkit
description: Deep integration with NVIDIA CUDA toolkit for kernel development, compilation, and debugging. Execute nvcc compilation with optimization flags analysis, generate and validate CUDA kernel code, analyze PTX/SASS assembly output, and configure execution parameters.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: cuda-development
  backlog-id: SK-001
---

# cuda-toolkit

You are **cuda-toolkit** - a specialized skill for NVIDIA CUDA toolkit integration, providing expert capabilities for kernel development, compilation, and debugging workflows.

## Overview

This skill enables AI-powered CUDA development operations including:
- Execute nvcc compilation with optimization flags analysis
- Generate and validate CUDA kernel code with proper thread indexing
- Analyze PTX/SASS assembly output for optimization insights
- Configure execution parameters (grid/block dimensions)
- Handle CUDA error codes and diagnostic messages
- Generate host-device memory management code
- Support multiple CUDA compute capabilities (sm_XX)
- Validate kernel launch bounds and resource usage

## Prerequisites

- NVIDIA CUDA Toolkit 11.0+
- nvcc compiler
- GPU with compute capability 3.5+
- Optional: cuobjdump for binary analysis

## Capabilities

### 1. NVCC Compilation

Compile CUDA programs with various optimization flags:

```bash
# Basic compilation
nvcc -o program program.cu

# Optimized release build
nvcc -O3 -use_fast_math -o program program.cu

# Debug build with line info
nvcc -G -lineinfo -o program_debug program.cu

# Specify compute capability
nvcc -arch=sm_80 -o program program.cu

# Generate PTX for multiple architectures
nvcc -gencode arch=compute_70,code=sm_70 \
     -gencode arch=compute_80,code=sm_80 \
     -o program program.cu

# Verbose compilation
nvcc -v --ptxas-options=-v -o program program.cu
```

### 2. Kernel Code Generation

Generate properly structured CUDA kernels:

```cuda
// Thread indexing patterns
__global__ void kernel1D(float* data, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        data[idx] = data[idx] * 2.0f;
    }
}

__global__ void kernel2D(float* data, int width, int height) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;
    if (x < width && y < height) {
        int idx = y * width + x;
        data[idx] = data[idx] * 2.0f;
    }
}

__global__ void kernel3D(float* data, int dimX, int dimY, int dimZ) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;
    int z = blockIdx.z * blockDim.z + threadIdx.z;
    if (x < dimX && y < dimY && z < dimZ) {
        int idx = z * dimX * dimY + y * dimX + x;
        data[idx] = data[idx] * 2.0f;
    }
}
```

### 3. Launch Configuration

Calculate optimal launch parameters:

```cuda
// Launch configuration helper
void launchKernel(float* d_data, int n) {
    int blockSize = 256;  // Common optimal block size
    int numBlocks = (n + blockSize - 1) / blockSize;

    // Limit blocks to device maximum
    int deviceId;
    cudaGetDevice(&deviceId);
    cudaDeviceProp props;
    cudaGetDeviceProperties(&props, deviceId);
    numBlocks = min(numBlocks, props.maxGridSize[0]);

    kernel1D<<<numBlocks, blockSize>>>(d_data, n);
}

// Query optimal block size
int minGridSize, blockSize;
cudaOccupancyMaxPotentialBlockSize(&minGridSize, &blockSize, kernel1D, 0, 0);
```

### 4. PTX/SASS Analysis

Analyze generated assembly:

```bash
# Generate PTX
nvcc -ptx -o program.ptx program.cu

# View PTX
cat program.ptx

# Generate SASS (device assembly)
cuobjdump -sass program > program.sass

# Analyze register usage
nvcc --ptxas-options=-v program.cu 2>&1 | grep -E "registers|memory"

# Dump detailed resource usage
cuobjdump --dump-resource-usage program
```

### 5. Memory Management

Generate proper memory management code:

```cuda
// Host-device memory transfer pattern
void processData(float* h_input, float* h_output, int n) {
    float *d_input, *d_output;
    size_t size = n * sizeof(float);

    // Allocate device memory
    cudaMalloc(&d_input, size);
    cudaMalloc(&d_output, size);

    // Copy input to device
    cudaMemcpy(d_input, h_input, size, cudaMemcpyHostToDevice);

    // Launch kernel
    int blockSize = 256;
    int numBlocks = (n + blockSize - 1) / blockSize;
    processKernel<<<numBlocks, blockSize>>>(d_input, d_output, n);

    // Copy output to host
    cudaMemcpy(h_output, d_output, size, cudaMemcpyDeviceToHost);

    // Free device memory
    cudaFree(d_input);
    cudaFree(d_output);
}

// Pinned memory for faster transfers
float* h_pinned;
cudaMallocHost(&h_pinned, size);
// ... use h_pinned ...
cudaFreeHost(h_pinned);
```

### 6. Error Handling

Comprehensive error checking:

```cuda
#define CUDA_CHECK(call) \
    do { \
        cudaError_t err = call; \
        if (err != cudaSuccess) { \
            fprintf(stderr, "CUDA Error at %s:%d: %s\n", \
                    __FILE__, __LINE__, cudaGetErrorString(err)); \
            exit(EXIT_FAILURE); \
        } \
    } while(0)

// Usage
CUDA_CHECK(cudaMalloc(&d_data, size));
CUDA_CHECK(cudaMemcpy(d_data, h_data, size, cudaMemcpyHostToDevice));

// Check kernel errors
myKernel<<<blocks, threads>>>(d_data, n);
CUDA_CHECK(cudaGetLastError());
CUDA_CHECK(cudaDeviceSynchronize());
```

### 7. Compute Capability Support

Target specific GPU architectures:

```bash
# SM versions and features
# sm_50 - Maxwell (dynamic parallelism)
# sm_60 - Pascal (unified memory, FP16)
# sm_70 - Volta (tensor cores, independent thread scheduling)
# sm_75 - Turing (RT cores, INT8 tensor cores)
# sm_80 - Ampere (TF32, sparse tensor cores)
# sm_86 - Ampere consumer
# sm_89 - Ada Lovelace
# sm_90 - Hopper (transformer engine, TMA)

# Compile for specific capability
nvcc -arch=sm_80 -code=sm_80 program.cu

# Fat binary for multiple architectures
nvcc -gencode arch=compute_70,code=sm_70 \
     -gencode arch=compute_80,code=sm_80 \
     -gencode arch=compute_90,code=sm_90 \
     -o program program.cu
```

### 8. Launch Bounds Validation

Validate resource constraints:

```cuda
// Specify launch bounds for occupancy
__global__ void __launch_bounds__(256, 4)
boundedKernel(float* data, int n) {
    // Kernel limited to 256 threads, compiler targets 4 blocks/SM
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) data[idx] *= 2.0f;
}

// Query and validate resources
void validateLaunch() {
    cudaFuncAttributes attr;
    cudaFuncGetAttributes(&attr, boundedKernel);

    printf("Registers: %d\n", attr.numRegs);
    printf("Shared memory: %zu bytes\n", attr.sharedSizeBytes);
    printf("Max threads per block: %d\n", attr.maxThreadsPerBlock);
}
```

## Process Integration

This skill integrates with the following processes:
- `cuda-kernel-development.js` - Kernel development workflow
- `cuda-stream-concurrency.js` - Stream management
- `custom-cuda-operator-development.js` - Custom operator creation
- `dynamic-parallelism-implementation.js` - Dynamic parallelism

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "compile",
  "status": "success",
  "compiler": "nvcc",
  "flags": ["-O3", "-arch=sm_80"],
  "output": {
    "binary": "program",
    "ptx": "program.ptx"
  },
  "resources": {
    "registers_per_thread": 32,
    "shared_memory_per_block": 4096,
    "max_threads_per_block": 1024
  },
  "warnings": [],
  "artifacts": ["program", "program.ptx"]
}
```

## Dependencies

- CUDA Toolkit 11.0+
- nvcc compiler
- cuobjdump (optional)

## Constraints

- Kernel code must include proper bounds checking
- Launch configurations must respect device limits
- Memory operations must check for errors
- PTX analysis requires debug symbols for meaningful output
