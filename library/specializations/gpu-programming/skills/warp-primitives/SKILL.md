---
name: warp-primitives
description: Warp-level programming and SIMD optimization. Use warp shuffle instructions, voting functions, cooperative groups, warp-synchronous algorithms, and minimize warp divergence for optimal GPU performance.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: low-level-optimization
  backlog-id: SK-012
---

# warp-primitives

You are **warp-primitives** - a specialized skill for warp-level programming and SIMD optimization on GPUs. This skill provides expert capabilities for low-level GPU performance optimization.

## Overview

This skill enables AI-powered warp-level programming including:
- Use warp shuffle instructions (__shfl_*)
- Implement warp voting functions (__ballot, __any, __all)
- Design warp-synchronous algorithms
- Optimize warp divergence patterns
- Use cooperative groups for flexible sync
- Implement warp-level reductions
- Analyze and minimize warp stalls
- Support CUDA 11+ warp intrinsics

## Prerequisites

- CUDA Toolkit 11.0+
- GPU with compute capability 3.0+
- Understanding of SIMT execution model

## Capabilities

### 1. Warp Shuffle Instructions

Data exchange within a warp:

```cuda
// __shfl_sync: Broadcast from any lane
__device__ float warpBroadcast(float val, int srcLane) {
    return __shfl_sync(0xffffffff, val, srcLane);
}

// __shfl_up_sync: Shift up (for inclusive scan)
__device__ float shflUp(float val, int delta) {
    return __shfl_up_sync(0xffffffff, val, delta);
}

// __shfl_down_sync: Shift down (for reduction)
__device__ float shflDown(float val, int delta) {
    return __shfl_down_sync(0xffffffff, val, delta);
}

// __shfl_xor_sync: Butterfly pattern (for reduction)
__device__ float shflXor(float val, int laneMask) {
    return __shfl_xor_sync(0xffffffff, val, laneMask);
}

// Warp-level reduction using shuffle
__device__ float warpReduceSum(float val) {
    for (int offset = warpSize / 2; offset > 0; offset >>= 1) {
        val += __shfl_down_sync(0xffffffff, val, offset);
    }
    return val;
}

// Warp-level reduction using XOR (butterfly)
__device__ float warpReduceSumXor(float val) {
    for (int mask = warpSize / 2; mask > 0; mask >>= 1) {
        val += __shfl_xor_sync(0xffffffff, val, mask);
    }
    return val;  // All lanes have result
}

// Warp-level inclusive scan
__device__ float warpInclusiveScan(float val) {
    for (int offset = 1; offset < warpSize; offset <<= 1) {
        float n = __shfl_up_sync(0xffffffff, val, offset);
        if (threadIdx.x % warpSize >= offset) {
            val += n;
        }
    }
    return val;
}
```

### 2. Warp Voting Functions

Collective warp operations:

```cuda
// __ballot_sync: Create bitmask of predicate
__device__ unsigned int warpBallot(bool predicate) {
    return __ballot_sync(0xffffffff, predicate);
}

// __any_sync: Any thread has true predicate
__device__ bool warpAny(bool predicate) {
    return __any_sync(0xffffffff, predicate);
}

// __all_sync: All threads have true predicate
__device__ bool warpAll(bool predicate) {
    return __all_sync(0xffffffff, predicate);
}

// Count set bits in warp
__device__ int warpPopcount(bool predicate) {
    return __popc(__ballot_sync(0xffffffff, predicate));
}

// Find position within active threads
__device__ int warpExclusiveCount(bool predicate) {
    unsigned int mask = __ballot_sync(0xffffffff, predicate);
    unsigned int laneMask = (1u << (threadIdx.x % warpSize)) - 1;
    return __popc(mask & laneMask);
}

// Example: Stream compaction within warp
__device__ int warpCompact(int* output, int value, bool keep) {
    unsigned int mask = __ballot_sync(0xffffffff, keep);
    int total = __popc(mask);

    if (keep) {
        int pos = __popc(mask & ((1u << (threadIdx.x % warpSize)) - 1));
        output[pos] = value;
    }

    return total;
}
```

### 3. Cooperative Groups

Flexible synchronization:

```cuda
#include <cooperative_groups.h>
namespace cg = cooperative_groups;

// Warp-level cooperative group
__device__ void warpOperation(float* data) {
    cg::thread_block_tile<32> warp = cg::tiled_partition<32>(cg::this_thread_block());

    int lane = warp.thread_rank();
    float val = data[lane];

    // Warp-level reduction
    for (int offset = warp.size() / 2; offset > 0; offset >>= 1) {
        val += warp.shfl_down(val, offset);
    }

    if (lane == 0) data[0] = val;
}

// Flexible tile sizes
template<int TILE_SIZE>
__device__ void tiledOperation(float* data) {
    cg::thread_block_tile<TILE_SIZE> tile =
        cg::tiled_partition<TILE_SIZE>(cg::this_thread_block());

    float val = data[tile.thread_rank()];

    // Tile-level reduction
    for (int offset = tile.size() / 2; offset > 0; offset >>= 1) {
        val += tile.shfl_down(val, offset);
    }

    if (tile.thread_rank() == 0) {
        data[tile.meta_group_rank()] = val;
    }
}

// Grid-level synchronization (requires cooperative launch)
__global__ void gridSyncKernel(float* data, int n) {
    cg::grid_group grid = cg::this_grid();

    // Phase 1
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) data[idx] *= 2.0f;

    grid.sync();  // Synchronize entire grid

    // Phase 2 - all blocks see phase 1 results
    if (idx < n) data[idx] += 1.0f;
}
```

### 4. Warp Divergence Optimization

Minimize divergence impact:

```cuda
// Bad: Divergent branches
__global__ void divergentKernel(float* data, int n) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;
    if (idx < n) {
        if (data[idx] > 0) {  // Divergent!
            data[idx] = expf(data[idx]);  // Some threads execute
        } else {
            data[idx] = 0.0f;  // Other threads execute
        }
    }
}

// Better: Predicated execution
__global__ void predicatedKernel(float* data, int n) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;
    if (idx < n) {
        bool positive = data[idx] > 0;
        // Both paths computed, result selected
        float result = positive ? expf(data[idx]) : 0.0f;
        data[idx] = result;
    }
}

// Best: Reorganize data to reduce divergence
// Process positive and negative values separately
__global__ void reorganizedKernel(float* positive, float* negative,
                                   int nPos, int nNeg) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;

    // All threads in warp take same path
    if (idx < nPos) {
        positive[idx] = expf(positive[idx]);
    }
}

// Warp-level early exit
__global__ void warpEarlyExit(float* data, int* flags, int n) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;

    // Check if entire warp can skip
    bool needsWork = (idx < n) && flags[idx];
    if (!__any_sync(0xffffffff, needsWork)) {
        return;  // Entire warp exits
    }

    // Only warps with work continue
    if (needsWork) {
        data[idx] = expensiveComputation(data[idx]);
    }
}
```

### 5. Warp-Synchronous Programming

Implicit warp synchronization:

```cuda
// Pre-Volta: Implicit warp sync (deprecated pattern)
// Post-Volta: Use explicit __syncwarp()

__device__ float warpSafeReduce(float val) {
    // Always use explicit sync mask
    val += __shfl_down_sync(0xffffffff, val, 16);
    val += __shfl_down_sync(0xffffffff, val, 8);
    val += __shfl_down_sync(0xffffffff, val, 4);
    val += __shfl_down_sync(0xffffffff, val, 2);
    val += __shfl_down_sync(0xffffffff, val, 1);
    return val;
}

// Active mask handling
__device__ float activeWarpReduce(float val) {
    unsigned int active = __activemask();
    for (int offset = warpSize / 2; offset > 0; offset >>= 1) {
        val += __shfl_down_sync(active, val, offset);
    }
    return val;
}

// Match sync for convergent warps
__device__ void convergentOperation() {
    // Ensure threads converge before warp operation
    unsigned int mask = __match_any_sync(__activemask(), threadIdx.x / 8);
    // mask contains threads with same value
}
```

### 6. Warp-Level Matrix Operations

Matrix fragments with warp cooperation:

```cuda
// Warp-level matrix multiply (simplified WMMA concept)
__device__ void warpMatMul4x4(float* A, float* B, float* C) {
    int lane = threadIdx.x % 32;

    // Each lane owns one element of result
    int row = lane / 4;
    int col = lane % 4;

    float sum = 0.0f;
    for (int k = 0; k < 4; k++) {
        // Broadcast A[row][k] and B[k][col]
        float a = __shfl_sync(0xffffffff, A[row * 4 + k], row * 4 + k);
        float b = __shfl_sync(0xffffffff, B[k * 4 + col], k * 4 + col);
        sum += a * b;
    }
    C[lane] = sum;
}
```

### 7. Warp Stall Analysis

Identify and fix stall causes:

```cuda
// Common stall causes and solutions

// 1. Memory dependency stalls
__global__ void memoryStall(float* data) {
    int idx = threadIdx.x;
    float val = data[idx];  // Long latency load
    // Stall here waiting for data
    data[idx] = val * 2.0f;
}

// Solution: Increase occupancy or hide latency
__global__ void hiddenLatency(float* data, int n) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;

    // Load multiple values
    float v1 = data[idx];
    float v2 = data[idx + n];

    // Compute on v1 while v2 loads
    v1 = v1 * 2.0f + 1.0f;

    // Now v2 should be ready
    v2 = v2 * 2.0f + 1.0f;

    data[idx] = v1;
    data[idx + n] = v2;
}

// 2. Synchronization stalls
__global__ void syncStall(float* shared_data) {
    __shared__ float smem[256];
    smem[threadIdx.x] = shared_data[threadIdx.x];
    __syncthreads();  // All threads wait here
}

// Solution: Minimize sync points, use warp-level sync
```

## Process Integration

This skill integrates with the following processes:
- `warp-efficiency-optimization.js` - Warp efficiency workflow
- `reduction-scan-implementation.js` - Reduction/scan patterns
- `parallel-algorithm-design.js` - Algorithm optimization

## Output Format

```json
{
  "operation": "generate-warp-reduction",
  "configuration": {
    "data_type": "float",
    "reduction_op": "sum",
    "use_xor_pattern": true
  },
  "generated_code": "warp_reduction.cu",
  "analysis": {
    "shuffle_instructions": 5,
    "sync_masks": "0xffffffff",
    "cooperative_groups_used": false
  },
  "performance": {
    "instructions_per_element": 6,
    "warp_efficiency": 1.0,
    "divergence": "none"
  }
}
```

## Dependencies

- CUDA Toolkit 11.0+
- cooperative_groups header

## Constraints

- Warp shuffle requires all participating threads
- Sync masks must correctly represent active threads
- Cooperative groups require compile-time tile sizes
- Grid sync requires cooperative kernel launch
