---
name: parallel-patterns
description: GPU parallel algorithm design patterns and implementations. Implement parallel reduction, scan/prefix sum, histogram, parallel sort algorithms, stream compaction, and work-efficient patterns optimized for specific GPU architectures.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: parallel-algorithms
  backlog-id: SK-011
---

# parallel-patterns

You are **parallel-patterns** - a specialized skill for GPU parallel algorithm design patterns and implementations. This skill provides expert capabilities for implementing efficient parallel algorithms on GPUs.

## Overview

This skill enables AI-powered parallel algorithm development including:
- Implement parallel reduction algorithms (tree-based, warp)
- Generate scan (prefix sum) implementations
- Design histogram and binning algorithms
- Implement parallel sort algorithms (radix, merge)
- Generate stream compaction code
- Design work-efficient parallel patterns
- Handle multi-pass large-data algorithms
- Optimize for specific GPU architectures

## Prerequisites

- CUDA Toolkit 11.0+
- CUB library (included with CUDA)
- Thrust library (included with CUDA)

## Capabilities

### 1. Parallel Reduction

Implement efficient reductions:

```cuda
// Warp-level reduction (no shared memory needed for single warp)
__device__ float warpReduce(float val) {
    for (int offset = warpSize / 2; offset > 0; offset >>= 1) {
        val += __shfl_down_sync(0xffffffff, val, offset);
    }
    return val;
}

// Block-level reduction with shared memory
template<int BLOCK_SIZE>
__device__ float blockReduce(float val) {
    __shared__ float shared[32];  // One slot per warp

    int lane = threadIdx.x % warpSize;
    int wid = threadIdx.x / warpSize;

    // Warp-level reduction
    val = warpReduce(val);

    // Write warp results to shared memory
    if (lane == 0) shared[wid] = val;
    __syncthreads();

    // First warp reduces warp results
    val = (threadIdx.x < BLOCK_SIZE / warpSize) ? shared[lane] : 0.0f;
    if (wid == 0) val = warpReduce(val);

    return val;
}

// Full parallel reduction kernel
template<int BLOCK_SIZE>
__global__ void reduceKernel(const float* input, float* output, int n) {
    float sum = 0.0f;

    // Grid-stride loop for large arrays
    for (int i = blockIdx.x * BLOCK_SIZE + threadIdx.x;
         i < n;
         i += gridDim.x * BLOCK_SIZE) {
        sum += input[i];
    }

    // Block reduction
    sum = blockReduce<BLOCK_SIZE>(sum);

    // Write block result
    if (threadIdx.x == 0) {
        atomicAdd(output, sum);
    }
}
```

### 2. Prefix Sum (Scan)

Work-efficient scan implementations:

```cuda
// Inclusive scan within a warp
__device__ float warpInclusiveScan(float val) {
    for (int offset = 1; offset < warpSize; offset <<= 1) {
        float n = __shfl_up_sync(0xffffffff, val, offset);
        if (threadIdx.x % warpSize >= offset) val += n;
    }
    return val;
}

// Block-level inclusive scan (Blelloch algorithm)
template<int BLOCK_SIZE>
__device__ void blockInclusiveScan(float* data) {
    int tid = threadIdx.x;

    // Up-sweep (reduce) phase
    for (int stride = 1; stride < BLOCK_SIZE; stride <<= 1) {
        int index = (tid + 1) * stride * 2 - 1;
        if (index < BLOCK_SIZE) {
            data[index] += data[index - stride];
        }
        __syncthreads();
    }

    // Clear last element for exclusive scan
    // if (tid == 0) data[BLOCK_SIZE - 1] = 0;
    // __syncthreads();

    // Down-sweep phase
    for (int stride = BLOCK_SIZE / 2; stride > 0; stride >>= 1) {
        int index = (tid + 1) * stride * 2 - 1;
        if (index + stride < BLOCK_SIZE) {
            data[index + stride] += data[index];
        }
        __syncthreads();
    }
}

// Using CUB for production code
#include <cub/cub.cuh>

void inclusiveScan(float* d_in, float* d_out, int n) {
    void* d_temp_storage = nullptr;
    size_t temp_storage_bytes = 0;

    // Get required storage
    cub::DeviceScan::InclusiveSum(d_temp_storage, temp_storage_bytes,
        d_in, d_out, n);

    // Allocate temporary storage
    cudaMalloc(&d_temp_storage, temp_storage_bytes);

    // Run scan
    cub::DeviceScan::InclusiveSum(d_temp_storage, temp_storage_bytes,
        d_in, d_out, n);

    cudaFree(d_temp_storage);
}
```

### 3. Histogram

Parallel histogram computation:

```cuda
// Shared memory histogram (small number of bins)
__global__ void histogramSmall(const int* input, int* histogram, int n, int numBins) {
    __shared__ int localHist[256];

    // Initialize local histogram
    for (int i = threadIdx.x; i < numBins; i += blockDim.x) {
        localHist[i] = 0;
    }
    __syncthreads();

    // Accumulate into local histogram
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        int bin = input[idx];
        atomicAdd(&localHist[bin], 1);
    }
    __syncthreads();

    // Merge to global histogram
    for (int i = threadIdx.x; i < numBins; i += blockDim.x) {
        atomicAdd(&histogram[i], localHist[i]);
    }
}

// Per-thread private histograms for large bin counts
__global__ void histogramPrivate(const int* input, int* histogram,
                                  int n, int numBins) {
    extern __shared__ int sharedHist[];

    int tid = threadIdx.x;
    int* myHist = &sharedHist[tid * numBins];

    // Initialize private histogram
    for (int i = 0; i < numBins; i++) {
        myHist[i] = 0;
    }

    // Accumulate
    for (int i = blockIdx.x * blockDim.x + tid; i < n; i += gridDim.x * blockDim.x) {
        myHist[input[i]]++;
    }

    __syncthreads();

    // Reduce private histograms
    for (int bin = tid; bin < numBins; bin += blockDim.x) {
        int sum = 0;
        for (int t = 0; t < blockDim.x; t++) {
            sum += sharedHist[t * numBins + bin];
        }
        atomicAdd(&histogram[bin], sum);
    }
}
```

### 4. Radix Sort

Parallel radix sort:

```cuda
// Using CUB/Thrust for production
#include <cub/cub.cuh>

void radixSort(unsigned int* d_keys, unsigned int* d_values, int n) {
    void* d_temp_storage = nullptr;
    size_t temp_storage_bytes = 0;

    // Double buffer for efficient sorting
    cub::DoubleBuffer<unsigned int> d_keys_db(d_keys, d_keys_alt);
    cub::DoubleBuffer<unsigned int> d_values_db(d_values, d_values_alt);

    // Get storage requirements
    cub::DeviceRadixSort::SortPairs(d_temp_storage, temp_storage_bytes,
        d_keys_db, d_values_db, n);

    cudaMalloc(&d_temp_storage, temp_storage_bytes);

    // Sort
    cub::DeviceRadixSort::SortPairs(d_temp_storage, temp_storage_bytes,
        d_keys_db, d_values_db, n);

    cudaFree(d_temp_storage);
}

// Basic radix sort building block
__global__ void countRadixDigits(const unsigned int* keys, int* counts,
                                  int n, int shift) {
    __shared__ int localCounts[16];  // 4-bit radix

    if (threadIdx.x < 16) localCounts[threadIdx.x] = 0;
    __syncthreads();

    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        int digit = (keys[idx] >> shift) & 0xF;
        atomicAdd(&localCounts[digit], 1);
    }
    __syncthreads();

    if (threadIdx.x < 16) {
        atomicAdd(&counts[blockIdx.x * 16 + threadIdx.x], localCounts[threadIdx.x]);
    }
}
```

### 5. Stream Compaction

Filter and compact arrays:

```cuda
// Simple compaction with atomic counter
__global__ void compactAtomic(const int* input, const int* flags,
                               int* output, int* counter, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n && flags[idx]) {
        int pos = atomicAdd(counter, 1);
        output[pos] = input[idx];
    }
}

// Efficient compaction with scan
// Step 1: Generate flags
__global__ void generateFlags(const float* input, int* flags, int n, float threshold) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        flags[idx] = (input[idx] > threshold) ? 1 : 0;
    }
}

// Step 2: Exclusive scan on flags (gives output positions)
// Step 3: Scatter to output positions
__global__ void scatter(const float* input, const int* flags,
                        const int* positions, float* output, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n && flags[idx]) {
        output[positions[idx]] = input[idx];
    }
}

// Using CUB select
#include <cub/cub.cuh>

void compactWithCUB(float* d_in, float* d_out, int* d_num_selected, int n) {
    void* d_temp_storage = nullptr;
    size_t temp_storage_bytes = 0;

    auto select_op = [] __device__ (float val) { return val > 0.0f; };

    cub::DeviceSelect::If(d_temp_storage, temp_storage_bytes,
        d_in, d_out, d_num_selected, n, select_op);

    cudaMalloc(&d_temp_storage, temp_storage_bytes);

    cub::DeviceSelect::If(d_temp_storage, temp_storage_bytes,
        d_in, d_out, d_num_selected, n, select_op);

    cudaFree(d_temp_storage);
}
```

### 6. Parallel Merge

Merge sorted sequences:

```cuda
// Binary search for merge path
__device__ int binarySearch(const int* data, int target, int left, int right) {
    while (left < right) {
        int mid = (left + right) / 2;
        if (data[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}

// Merge path parallel merge
__global__ void parallelMerge(const int* A, int sizeA,
                               const int* B, int sizeB,
                               int* output) {
    int tid = blockIdx.x * blockDim.x + threadIdx.x;
    int totalSize = sizeA + sizeB;

    if (tid < totalSize) {
        // Find merge path coordinates
        int diagonal = tid;
        int aStart = max(0, diagonal - sizeB);
        int aEnd = min(diagonal, sizeA);

        // Binary search on merge path
        while (aStart < aEnd) {
            int aMid = (aStart + aEnd) / 2;
            int bMid = diagonal - aMid - 1;

            if (bMid >= 0 && bMid < sizeB && A[aMid] > B[bMid]) {
                aEnd = aMid;
            } else {
                aStart = aMid + 1;
            }
        }

        int aIdx = aStart;
        int bIdx = diagonal - aStart;

        // Determine which element goes to this position
        if (aIdx < sizeA && (bIdx >= sizeB || A[aIdx] <= B[bIdx])) {
            output[tid] = A[aIdx];
        } else {
            output[tid] = B[bIdx];
        }
    }
}
```

### 7. Work Distribution Patterns

Load-balanced work distribution:

```cuda
// Persistent threads pattern
__global__ void persistentKernel(int* workQueue, int* queueSize,
                                  int* results) {
    __shared__ int nextItem;

    while (true) {
        // Get next work item
        if (threadIdx.x == 0) {
            nextItem = atomicAdd(queueSize, -1) - 1;
        }
        __syncthreads();

        if (nextItem < 0) break;

        // Process work item
        int workItem = workQueue[nextItem];
        // ... do work ...
    }
}

// Dynamic parallelism for irregular workloads
__global__ void adaptiveKernel(int* data, int n, int threshold) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx >= n) return;

    int workload = computeWorkload(data[idx]);

    if (workload > threshold) {
        // Launch child kernel for heavy work
        processHeavy<<<1, 128>>>(data, idx);
    } else {
        // Process light work inline
        processLight(data, idx);
    }
}
```

## Process Integration

This skill integrates with the following processes:
- `parallel-algorithm-design.js` - Algorithm design workflow
- `reduction-scan-implementation.js` - Reduction/scan implementations
- `atomic-operations-synchronization.js` - Atomic patterns

## Output Format

```json
{
  "operation": "generate-pattern",
  "pattern": "parallel-reduction",
  "configuration": {
    "data_type": "float",
    "reduction_op": "sum",
    "block_size": 256,
    "use_warp_shuffle": true
  },
  "generated_code": {
    "kernel_file": "reduction.cu",
    "lines": 85
  },
  "performance_estimate": {
    "memory_bound": true,
    "bandwidth_utilization": 0.85,
    "operations_per_element": 1
  }
}
```

## Dependencies

- CUDA Toolkit 11.0+
- CUB library
- Thrust library

## Constraints

- Reduction requires associative operations
- Scan requires associative operations for correctness
- Histogram performance depends on bin count distribution
- Sort performance varies by key distribution
