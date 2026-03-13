---
name: unified-memory
description: Expert skill for CUDA Unified Memory and memory prefetching optimization. Configure managed memory allocations, implement memory prefetch strategies, handle page fault analysis, configure memory hints and advise, profile unified memory migration, optimize for oversubscription scenarios, and compare managed vs explicit memory.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: memory-management
  backlog-id: SK-018
---

# unified-memory

You are **unified-memory** - a specialized skill for CUDA Unified Memory and memory prefetching optimization. This skill provides expert capabilities for simplifying GPU memory management while maintaining high performance.

## Overview

This skill enables AI-powered Unified Memory operations including:
- Configuring managed memory allocations
- Implementing memory prefetch strategies
- Handling page fault analysis
- Configuring memory hints and advise
- Profiling unified memory migration
- Optimizing for oversubscription scenarios
- Handling multi-GPU unified memory
- Comparing managed vs explicit memory performance

## Prerequisites

- NVIDIA CUDA Toolkit 8.0+ (Unified Memory)
- CUDA 9.0+ for hardware page faulting on Pascal+
- CUDA 11.0+ for advanced prefetching
- GPU with compute capability 6.0+ for full UM features
- nvidia-smi for migration monitoring
- Nsight Systems for migration profiling

## Capabilities

### 1. Basic Unified Memory Allocation

Allocate memory accessible from both CPU and GPU:

```cuda
#include <cuda_runtime.h>

// Allocate managed memory
float* data;
size_t size = N * sizeof(float);
cudaMallocManaged(&data, size);

// Initialize on CPU
for (int i = 0; i < N; i++) {
    data[i] = (float)i;
}

// Use on GPU - data automatically migrates
myKernel<<<blocks, threads>>>(data, N);
cudaDeviceSynchronize();

// Access on CPU again - data migrates back
printf("Result: %f\n", data[0]);

// Free managed memory
cudaFree(data);
```

### 2. Memory Prefetching

Explicitly prefetch data to reduce page faults:

```cuda
// Allocate managed memory
float *data;
cudaMallocManaged(&data, size);

// Initialize on CPU
initializeData(data, N);

// Get device ID
int device;
cudaGetDevice(&device);

// Prefetch data to GPU before kernel launch
cudaMemPrefetchAsync(data, size, device, stream);

// Launch kernel - data is already on GPU
myKernel<<<blocks, threads, 0, stream>>>(data, N);

// Prefetch results back to CPU
cudaMemPrefetchAsync(data, size, cudaCpuDeviceId, stream);

cudaStreamSynchronize(stream);

// Access on CPU - data is already there
processResults(data, N);
```

### 3. Memory Advise Hints

Provide hints to the memory manager:

```cuda
// Allocate managed memory
float *readOnlyData, *writeOnlyData, *readMostlyData;
cudaMallocManaged(&readOnlyData, size);
cudaMallocManaged(&writeOnlyData, size);
cudaMallocManaged(&readMostlyData, size);

int device;
cudaGetDevice(&device);

// Read-only data: advise that GPU will only read
cudaMemAdvise(readOnlyData, size, cudaMemAdviseSetReadMostly, device);

// Preferred location: keep data on specific device
cudaMemAdvise(writeOnlyData, size, cudaMemAdviseSetPreferredLocation, device);

// Accessed by: hint which devices will access
cudaMemAdvise(readMostlyData, size, cudaMemAdviseSetAccessedBy, device);

// Clear hints
cudaMemAdvise(readOnlyData, size, cudaMemAdviseUnsetReadMostly, device);
```

### 4. Memory Advise Types

```cuda
// cudaMemAdviseSetReadMostly
// - Creates read-only copies on accessing processors
// - Reduces page faults for read-only data
// - Best for: lookup tables, constant data
cudaMemAdvise(data, size, cudaMemAdviseSetReadMostly, device);

// cudaMemAdviseSetPreferredLocation
// - Sets preferred physical location for pages
// - Pages migrate there but can be accessed elsewhere
// - Best for: data primarily accessed by one device
cudaMemAdvise(data, size, cudaMemAdviseSetPreferredLocation, device);
cudaMemAdvise(data, size, cudaMemAdviseSetPreferredLocation, cudaCpuDeviceId);

// cudaMemAdviseSetAccessedBy
// - Creates direct mapping for efficient access
// - Enables access without page faults
// - Best for: frequently accessed shared data
cudaMemAdvise(data, size, cudaMemAdviseSetAccessedBy, device);
```

### 5. Page Fault Analysis

Monitor and analyze page faults:

```cuda
// Profile page faults with Nsight Systems
// nsys profile --trace=cuda,nvtx ./unified_memory_app

// Or use CUDA API for basic monitoring
cudaError_t status;
cudaDeviceProp prop;
cudaGetDeviceProperties(&prop, device);

printf("Concurrent Managed Access: %d\n", prop.concurrentManagedAccess);
printf("Page Migration Supported: %d\n", prop.pageableMemoryAccess);

// Query memory info
size_t free, total;
cudaMemGetInfo(&free, &total);
printf("Free GPU memory: %zu MB\n", free / (1024 * 1024));
```

### 6. Multi-GPU Unified Memory

Handle unified memory across multiple GPUs:

```cuda
#include <cuda_runtime.h>

void multiGPUUnifiedMemory() {
    int numDevices;
    cudaGetDeviceCount(&numDevices);

    // Allocate managed memory
    float* data;
    size_t size = N * sizeof(float);
    cudaMallocManaged(&data, size);

    // Check peer access capability
    for (int i = 0; i < numDevices; i++) {
        for (int j = 0; j < numDevices; j++) {
            if (i != j) {
                int canAccess;
                cudaDeviceCanAccessPeer(&canAccess, i, j);
                if (canAccess) {
                    cudaSetDevice(i);
                    cudaDeviceEnablePeerAccess(j, 0);
                }
            }
        }
    }

    // Set preferred location for initial data
    cudaMemAdvise(data, size, cudaMemAdviseSetPreferredLocation, 0);

    // Initialize on GPU 0
    cudaSetDevice(0);
    initKernel<<<blocks, threads>>>(data, N);

    // Partition work across GPUs
    size_t chunkSize = size / numDevices;
    for (int i = 0; i < numDevices; i++) {
        cudaSetDevice(i);

        // Prefetch this GPU's chunk
        cudaMemPrefetchAsync(data + i * (N / numDevices),
                            chunkSize, i, streams[i]);

        // Process chunk
        processKernel<<<blocks, threads, 0, streams[i]>>>
            (data + i * (N / numDevices), N / numDevices);
    }

    // Synchronize all GPUs
    for (int i = 0; i < numDevices; i++) {
        cudaSetDevice(i);
        cudaStreamSynchronize(streams[i]);
    }

    cudaFree(data);
}
```

### 7. Oversubscription Handling

Handle cases where data exceeds GPU memory:

```cuda
// Oversubscription example - allocate more than GPU memory
void oversubscriptionExample() {
    // Get GPU memory size
    size_t free, total;
    cudaMemGetInfo(&free, &total);

    // Allocate 2x GPU memory using unified memory
    size_t size = total * 2;
    float* bigData;
    cudaMallocManaged(&bigData, size);

    // Process in chunks with prefetching
    size_t chunkSize = free * 0.8;  // Use 80% of GPU memory per chunk
    size_t numChunks = size / chunkSize;

    for (size_t chunk = 0; chunk < numChunks; chunk++) {
        float* chunkPtr = bigData + chunk * (chunkSize / sizeof(float));

        // Prefetch current chunk to GPU
        cudaMemPrefetchAsync(chunkPtr, chunkSize, device, stream);

        // Process chunk
        processChunk<<<blocks, threads, 0, stream>>>(chunkPtr, chunkSize / sizeof(float));

        // Prefetch next chunk while processing (double buffering)
        if (chunk + 1 < numChunks) {
            float* nextChunkPtr = bigData + (chunk + 1) * (chunkSize / sizeof(float));
            cudaMemPrefetchAsync(nextChunkPtr, chunkSize, device, stream2);
        }

        cudaStreamSynchronize(stream);
    }

    cudaFree(bigData);
}
```

### 8. Performance Comparison: Managed vs Explicit

```cuda
// Benchmark helper
#define BENCHMARK(name, code) { \
    cudaEvent_t start, stop; \
    cudaEventCreate(&start); \
    cudaEventCreate(&stop); \
    cudaEventRecord(start); \
    code; \
    cudaEventRecord(stop); \
    cudaEventSynchronize(stop); \
    float ms; \
    cudaEventElapsedTime(&ms, start, stop); \
    printf("%s: %.3f ms\n", name, ms); \
    cudaEventDestroy(start); \
    cudaEventDestroy(stop); \
}

void compareMemoryApproaches(size_t size, int iterations) {
    float *h_data, *d_data, *managed_data;

    // Explicit memory approach
    h_data = (float*)malloc(size);
    cudaMalloc(&d_data, size);

    BENCHMARK("Explicit Memory", {
        for (int i = 0; i < iterations; i++) {
            cudaMemcpy(d_data, h_data, size, cudaMemcpyHostToDevice);
            processKernel<<<blocks, threads>>>(d_data, N);
            cudaMemcpy(h_data, d_data, size, cudaMemcpyDeviceToHost);
        }
        cudaDeviceSynchronize();
    });

    // Unified memory without prefetch
    cudaMallocManaged(&managed_data, size);
    memcpy(managed_data, h_data, size);

    BENCHMARK("Unified Memory (no prefetch)", {
        for (int i = 0; i < iterations; i++) {
            processKernel<<<blocks, threads>>>(managed_data, N);
            cudaDeviceSynchronize();
            // Touch on CPU to force migration
            volatile float tmp = managed_data[0];
        }
    });

    // Unified memory with prefetch
    int device;
    cudaGetDevice(&device);

    BENCHMARK("Unified Memory (with prefetch)", {
        for (int i = 0; i < iterations; i++) {
            cudaMemPrefetchAsync(managed_data, size, device, 0);
            processKernel<<<blocks, threads>>>(managed_data, N);
            cudaMemPrefetchAsync(managed_data, size, cudaCpuDeviceId, 0);
            cudaDeviceSynchronize();
            volatile float tmp = managed_data[0];
        }
    });

    free(h_data);
    cudaFree(d_data);
    cudaFree(managed_data);
}
```

### 9. Best Practices Pattern Library

```cuda
// Pattern 1: Read-mostly data with duplication
void readMostlyPattern() {
    float* lookupTable;
    cudaMallocManaged(&lookupTable, tableSize);
    initializeLookupTable(lookupTable);

    // Advise as read-mostly - creates copies on all accessing devices
    cudaMemAdvise(lookupTable, tableSize, cudaMemAdviseSetReadMostly, 0);

    // Multiple kernels can read efficiently
    kernel1<<<grid, block>>>(lookupTable);
    kernel2<<<grid, block>>>(lookupTable);
}

// Pattern 2: Producer-consumer with preferred location
void producerConsumerPattern() {
    float *inputData, *outputData;
    cudaMallocManaged(&inputData, size);
    cudaMallocManaged(&outputData, size);

    int device;
    cudaGetDevice(&device);

    // Input: prefer CPU for initialization
    cudaMemAdvise(inputData, size, cudaMemAdviseSetPreferredLocation, cudaCpuDeviceId);
    initializeOnCPU(inputData);

    // Prefetch input to GPU
    cudaMemPrefetchAsync(inputData, size, device);

    // Output: prefer GPU where it's produced
    cudaMemAdvise(outputData, size, cudaMemAdviseSetPreferredLocation, device);

    processKernel<<<grid, block>>>(inputData, outputData, N);

    // Prefetch output to CPU for consumption
    cudaMemPrefetchAsync(outputData, size, cudaCpuDeviceId);
    cudaDeviceSynchronize();

    consumeOnCPU(outputData);
}

// Pattern 3: Streaming with double buffering
void streamingPattern() {
    float *buffer[2];
    cudaMallocManaged(&buffer[0], chunkSize);
    cudaMallocManaged(&buffer[1], chunkSize);

    cudaStream_t streams[2];
    cudaStreamCreate(&streams[0]);
    cudaStreamCreate(&streams[1]);

    int device;
    cudaGetDevice(&device);

    for (int chunk = 0; chunk < numChunks; chunk++) {
        int buf = chunk % 2;

        // Load current chunk on CPU
        loadChunk(buffer[buf], chunk);

        // Prefetch to GPU
        cudaMemPrefetchAsync(buffer[buf], chunkSize, device, streams[buf]);

        // Process on GPU
        processKernel<<<grid, block, 0, streams[buf]>>>(buffer[buf], chunkElements);

        // Prefetch back to CPU for next iteration
        cudaMemPrefetchAsync(buffer[buf], chunkSize, cudaCpuDeviceId, streams[buf]);
    }

    cudaStreamSynchronize(streams[0]);
    cudaStreamSynchronize(streams[1]);
}
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Reference |
|--------|-------------|-----------|
| NVIDIA NeMo Agent Toolkit | GPU memory management | [NVIDIA Docs](https://docs.nvidia.com/nemo/agent-toolkit/) |

## Best Practices

### When to Use Unified Memory

| Use Case | Recommendation |
|----------|----------------|
| Prototyping | Always use - simplifies development |
| Complex data structures | Use - pointers work across devices |
| Oversubscription needed | Use - automatic paging |
| Maximum performance | Consider explicit memory |
| Frequent CPU-GPU transfers | Use with prefetching |

### Memory Hints Selection

| Data Access Pattern | Recommended Hint |
|---------------------|-----------------|
| Read-only lookup tables | `cudaMemAdviseSetReadMostly` |
| GPU-primary computation | `cudaMemAdviseSetPreferredLocation` (GPU) |
| CPU produces, GPU consumes | `cudaMemAdviseSetPreferredLocation` (CPU) + prefetch |
| Multi-GPU shared access | `cudaMemAdviseSetAccessedBy` on all GPUs |

### Performance Tips

1. **Always prefetch** - Explicit prefetching is faster than page faults
2. **Use memory advise** - Helps the driver make better decisions
3. **Double buffer for streaming** - Overlap transfer and compute
4. **Profile migrations** - Use Nsight Systems to find bottlenecks

## Process Integration

This skill integrates with the following processes:
- `gpu-cpu-data-transfer-optimization.js` - Data transfer optimization
- `gpu-memory-optimization.js` - Memory management strategies
- `multi-gpu-programming.js` - Multi-GPU memory handling

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "unified-memory-setup",
  "status": "success",
  "allocations": [
    {
      "name": "inputData",
      "size_bytes": 104857600,
      "type": "managed",
      "hints": ["cudaMemAdviseSetPreferredLocation:CPU"],
      "prefetch_device": 0
    }
  ],
  "performance": {
    "page_faults": 0,
    "migration_events": 2,
    "total_migrated_bytes": 209715200
  },
  "recommendations": [
    "Data shows 98% GPU access - consider SetPreferredLocation(GPU)",
    "Large sequential access detected - prefetching recommended"
  ],
  "artifacts": ["memory_config.yaml", "migration_report.txt"]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `cudaErrorNotSupported` | GPU doesn't support UM feature | Check compute capability |
| Excessive page faults | Missing prefetch hints | Add prefetch calls |
| Slow CPU access | Data on GPU | Prefetch to CPU before access |
| OOM with oversubscription | Too aggressive allocation | Reduce working set size |

## Constraints

- Full Unified Memory features require compute capability 6.0+
- Performance depends heavily on proper prefetching
- Oversubscription has performance implications
- Multi-GPU requires peer access for optimal performance
- Profile to verify migration behavior
