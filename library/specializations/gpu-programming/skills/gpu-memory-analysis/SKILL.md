---
name: gpu-memory-analysis
description: Specialized skill for GPU memory hierarchy analysis and optimization. Analyze memory access patterns, detect bank conflicts, optimize cache utilization, profile global memory bandwidth, and generate optimized memory access code patterns.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: memory-optimization
  backlog-id: SK-005
---

# gpu-memory-analysis

You are **gpu-memory-analysis** - a specialized skill for GPU memory hierarchy analysis and optimization. This skill provides expert capabilities for understanding and optimizing GPU memory access patterns.

## Overview

This skill enables AI-powered GPU memory optimization including:
- Analyze memory access patterns (coalescing, striding)
- Detect and resolve shared memory bank conflicts
- Optimize L1/L2 cache utilization
- Configure shared memory vs L1 cache partitioning
- Analyze texture and constant memory usage
- Profile global memory bandwidth utilization
- Identify unnecessary memory transactions
- Generate optimized memory access code patterns

## Prerequisites

- CUDA Toolkit 11.0+
- Nsight Compute (for memory profiling)
- compute-sanitizer (for memory validation)

## Capabilities

### 1. Memory Access Pattern Analysis

Analyze coalescing and striding:

```cuda
// Good: Coalesced access (threads access consecutive addresses)
__global__ void coalescedAccess(float* data, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        float val = data[idx];  // Coalesced: thread i accesses data[i]
        data[idx] = val * 2.0f;
    }
}

// Bad: Strided access (cache unfriendly)
__global__ void stridedAccess(float* data, int n, int stride) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    int actualIdx = idx * stride;  // Non-coalesced!
    if (actualIdx < n) {
        float val = data[actualIdx];
        data[actualIdx] = val * 2.0f;
    }
}

// Analysis command
// ncu --section MemoryWorkloadAnalysis ./program
```

### 2. Bank Conflict Detection

Detect and resolve shared memory conflicts:

```cuda
// Bad: Bank conflicts (all threads access same bank)
__global__ void bankConflict(float* output) {
    __shared__ float smem[256];
    int tid = threadIdx.x;

    // All threads in warp access same column = bank conflict
    smem[tid * 32] = tid;  // 32-way bank conflict!
    __syncthreads();
    output[tid] = smem[tid * 32];
}

// Good: No bank conflicts
__global__ void noBankConflict(float* output) {
    __shared__ float smem[256];
    int tid = threadIdx.x;

    smem[tid] = tid;  // Consecutive = no conflict
    __syncthreads();
    output[tid] = smem[tid];
}

// Padded to avoid conflicts in 2D access
__global__ void paddedAccess(float* input, float* output, int width) {
    // Pad by 1 to avoid bank conflicts on column access
    __shared__ float smem[32][33];  // 33 instead of 32

    int x = threadIdx.x;
    int y = threadIdx.y;

    smem[y][x] = input[y * width + x];
    __syncthreads();

    // Transposed access - no bank conflicts due to padding
    output[x * width + y] = smem[x][y];
}
```

### 3. Cache Optimization

Optimize L1/L2 cache usage:

```cuda
// Configure L1/shared memory preference
cudaFuncSetCacheConfig(myKernel, cudaFuncCachePreferL1);     // More L1
cudaFuncSetCacheConfig(myKernel, cudaFuncCachePreferShared); // More shared
cudaFuncSetCacheConfig(myKernel, cudaFuncCachePreferEqual);  // Equal split

// Cache hints with __ldg (read-only data cache)
__global__ void cacheOptimized(const float* __restrict__ input, float* output, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        // Use read-only cache for input
        float val = __ldg(&input[idx]);
        output[idx] = val * 2.0f;
    }
}

// Streaming stores (bypass cache for write-only data)
__global__ void streamingStore(float* output, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        // Bypass cache, don't pollute for write-only
        __stcs(&output[idx], computeValue(idx));
    }
}
```

### 4. Shared Memory Optimization

Efficient shared memory usage:

```cuda
// Tiled matrix multiply with optimized shared memory
template<int TILE_SIZE>
__global__ void tiledMatMul(const float* A, const float* B, float* C,
                            int M, int N, int K) {
    __shared__ float As[TILE_SIZE][TILE_SIZE];
    __shared__ float Bs[TILE_SIZE][TILE_SIZE];

    int bx = blockIdx.x, by = blockIdx.y;
    int tx = threadIdx.x, ty = threadIdx.y;

    int row = by * TILE_SIZE + ty;
    int col = bx * TILE_SIZE + tx;

    float sum = 0.0f;

    for (int t = 0; t < (K + TILE_SIZE - 1) / TILE_SIZE; t++) {
        // Collaborative load to shared memory
        if (row < M && t * TILE_SIZE + tx < K)
            As[ty][tx] = A[row * K + t * TILE_SIZE + tx];
        else
            As[ty][tx] = 0.0f;

        if (t * TILE_SIZE + ty < K && col < N)
            Bs[ty][tx] = B[(t * TILE_SIZE + ty) * N + col];
        else
            Bs[ty][tx] = 0.0f;

        __syncthreads();

        // Compute partial product
        for (int k = 0; k < TILE_SIZE; k++) {
            sum += As[ty][k] * Bs[k][tx];
        }

        __syncthreads();
    }

    if (row < M && col < N) {
        C[row * N + col] = sum;
    }
}
```

### 5. Global Memory Bandwidth Profiling

Profile and optimize bandwidth:

```bash
# Profile memory throughput
ncu --metrics \
    l1tex__t_bytes_pipe_lsu_mem_global_op_ld.sum.per_second,\
    l1tex__t_bytes_pipe_lsu_mem_global_op_st.sum.per_second,\
    dram__bytes_read.sum.per_second,\
    dram__bytes_write.sum.per_second \
    ./program

# Check memory efficiency
ncu --metrics \
    smsp__sass_average_data_bytes_per_sector_mem_global_op_ld.ratio,\
    smsp__sass_average_data_bytes_per_sector_mem_global_op_st.ratio \
    ./program
```

### 6. Texture and Constant Memory

Specialized memory optimization:

```cuda
// Texture memory for spatially local access
texture<float, 2, cudaReadModeElementType> texRef;

__global__ void textureKernel(float* output, int width, int height) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;

    if (x < width && y < height) {
        // Hardware interpolation and caching
        float val = tex2D(texRef, x + 0.5f, y + 0.5f);
        output[y * width + x] = val;
    }
}

// Constant memory for broadcast data
__constant__ float coefficients[256];

__global__ void constantMemKernel(float* data, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        // All threads read same constant = broadcast
        data[idx] *= coefficients[idx % 256];
    }
}
```

### 7. Memory Transaction Analysis

Identify unnecessary transactions:

```cuda
// Analyze memory transactions per request
// Ideal: 1 transaction per 32 threads (4 bytes * 32 = 128 bytes = 1 sector)

// Bad: Unaligned access causes extra transactions
__global__ void unalignedAccess(float* data, int offset) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    // Misaligned by offset bytes
    float val = data[idx + offset];  // May require 2 transactions
}

// Good: Aligned access
__global__ void alignedAccess(float* __restrict__ data) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    float val = data[idx];  // 1 transaction per warp
}
```

### 8. Memory Access Pattern Generation

Generate optimized patterns:

```cuda
// Structure of Arrays (SoA) - better for GPU
struct ParticlesSoA {
    float* x;
    float* y;
    float* z;
    float* vx;
    float* vy;
    float* vz;
};

__global__ void updateParticlesSoA(ParticlesSoA p, int n, float dt) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        // Coalesced access for each field
        p.x[idx] += p.vx[idx] * dt;
        p.y[idx] += p.vy[idx] * dt;
        p.z[idx] += p.vz[idx] * dt;
    }
}

// Array of Structures (AoS) - avoid on GPU
struct ParticleAoS {
    float x, y, z;
    float vx, vy, vz;
};

__global__ void updateParticlesAoS(ParticleAoS* particles, int n, float dt) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        // Non-coalesced: threads access interleaved memory
        particles[idx].x += particles[idx].vx * dt;
        particles[idx].y += particles[idx].vy * dt;
        particles[idx].z += particles[idx].vz * dt;
    }
}
```

## Process Integration

This skill integrates with the following processes:
- `gpu-memory-optimization.js` - Memory optimization workflow
- `shared-memory-usage-patterns.js` - Shared memory patterns
- `gpu-cpu-data-transfer-optimization.js` - Transfer optimization
- `gpu-memory-pool-allocator.js` - Memory pooling

## Output Format

```json
{
  "operation": "analyze-memory-access",
  "kernel": "matrixMultiply",
  "analysis": {
    "global_memory": {
      "load_efficiency": 0.95,
      "store_efficiency": 1.0,
      "transactions_per_request": 1.05,
      "throughput_gbps": 450
    },
    "shared_memory": {
      "bank_conflicts": 0,
      "utilization": 0.85
    },
    "cache": {
      "l1_hit_rate": 0.72,
      "l2_hit_rate": 0.45
    }
  },
  "issues": [
    {
      "type": "strided_access",
      "location": "line 42",
      "severity": "medium",
      "recommendation": "Reorder data layout to SoA"
    }
  ],
  "recommendations": [
    "Convert AoS to SoA for better coalescing",
    "Add padding to shared memory to avoid bank conflicts"
  ]
}
```

## Dependencies

- CUDA Toolkit 11.0+
- Nsight Compute
- compute-sanitizer

## Constraints

- Bank conflict detection requires detailed profiling
- Some optimizations are architecture-specific
- Texture memory benefits depend on access pattern
- Cache behavior varies by GPU generation
