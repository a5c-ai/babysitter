---
name: nccl-communication
description: NVIDIA Collective Communications Library integration for multi-GPU operations. Initialize NCCL communicators, execute collective operations, configure communication topologies, profile collective performance, and support RCCL for AMD compatibility.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: multi-gpu
  backlog-id: SK-007
---

# nccl-communication

You are **nccl-communication** - a specialized skill for NVIDIA Collective Communications Library (NCCL) integration. This skill provides expert capabilities for multi-GPU collective operations.

## Overview

This skill enables AI-powered multi-GPU communication including:
- Initialize NCCL communicators
- Execute all-reduce, all-gather, reduce-scatter operations
- Configure ring and tree communication topologies
- Handle multi-node NCCL communication
- Profile collective operation performance
- Optimize for NVLink vs PCIe topology
- Integrate with CUDA streams for async collectives
- Support RCCL for AMD GPU compatibility

## Prerequisites

- CUDA Toolkit 11.0+
- NCCL 2.10+
- Multiple GPUs (for meaningful use)
- MPI (for multi-node, optional)

## Capabilities

### 1. NCCL Initialization

Initialize communicators:

```c
#include <nccl.h>

// Single-node multi-GPU initialization
int numGPUs = 4;
ncclComm_t comms[4];
int devs[4] = {0, 1, 2, 3};

ncclCommInitAll(comms, numGPUs, devs);

// Per-rank initialization for MPI integration
ncclUniqueId id;
ncclComm_t comm;

if (rank == 0) {
    ncclGetUniqueId(&id);
}
MPI_Bcast(&id, sizeof(id), MPI_BYTE, 0, MPI_COMM_WORLD);

cudaSetDevice(localRank);
ncclCommInitRank(&comm, worldSize, id, rank);

// Cleanup
ncclCommDestroy(comm);
```

### 2. All-Reduce Operations

Reduce across all GPUs:

```c
// Synchronous all-reduce
ncclAllReduce(sendbuff, recvbuff, count, ncclFloat,
    ncclSum, comm, stream);
cudaStreamSynchronize(stream);

// In-place all-reduce
ncclAllReduce(buff, buff, count, ncclFloat, ncclSum, comm, stream);

// Supported reduction operations:
// ncclSum, ncclProd, ncclMax, ncclMin, ncclAvg

// Multiple data types:
// ncclInt8, ncclUint8, ncclInt32, ncclUint32, ncclInt64, ncclUint64
// ncclFloat16, ncclFloat32, ncclFloat64, ncclBfloat16
```

### 3. All-Gather Operations

Gather data from all GPUs:

```c
// All-gather: each GPU contributes sendcount elements
// Result: recvbuff has numGPUs * sendcount elements per GPU
ncclAllGather(sendbuff, recvbuff, sendcount, ncclFloat, comm, stream);

// Verify output size
size_t totalElements = sendcount * numGPUs;
```

### 4. Reduce-Scatter Operations

```c
// Reduce-scatter: reduces and scatters to each GPU
// Each GPU gets 1/numGPUs of the reduced result
ncclReduceScatter(sendbuff, recvbuff, recvcount, ncclFloat,
    ncclSum, comm, stream);

// Useful for gradient reduction in data parallelism
```

### 5. Broadcast and Reduce

```c
// Broadcast from root to all
int root = 0;
ncclBroadcast(sendbuff, recvbuff, count, ncclFloat, root, comm, stream);

// In-place broadcast
ncclBroadcast(buff, buff, count, ncclFloat, root, comm, stream);

// Reduce to root
ncclReduce(sendbuff, recvbuff, count, ncclFloat, ncclSum, root, comm, stream);
```

### 6. Group Operations

Batch multiple operations:

```c
// Start group
ncclGroupStart();

// Queue multiple operations
ncclAllReduce(buff1, buff1, count1, ncclFloat, ncclSum, comm, stream);
ncclAllReduce(buff2, buff2, count2, ncclFloat, ncclSum, comm, stream);
ncclBroadcast(buff3, buff3, count3, ncclFloat, 0, comm, stream);

// End group - operations execute efficiently
ncclGroupEnd();

// Useful for:
// - Multiple collectives in single launch
// - Send/Recv pairs for point-to-point
```

### 7. Point-to-Point Communication

```c
// Send from rank 0 to rank 1
if (rank == 0) {
    ncclSend(sendbuff, count, ncclFloat, 1, comm, stream);
} else if (rank == 1) {
    ncclRecv(recvbuff, count, ncclFloat, 0, comm, stream);
}

// Bidirectional exchange using groups
ncclGroupStart();
ncclSend(sendbuff, count, ncclFloat, peerRank, comm, stream);
ncclRecv(recvbuff, count, ncclFloat, peerRank, comm, stream);
ncclGroupEnd();
```

### 8. Topology Optimization

Configure for hardware topology:

```bash
# Check GPU topology
nvidia-smi topo -m

# Environment variables for optimization
export NCCL_TOPO_FILE=/path/to/topo.xml
export NCCL_GRAPH_FILE=/path/to/graph.xml

# Algorithm selection
export NCCL_ALGO=Tree       # Tree reduction
export NCCL_ALGO=Ring       # Ring reduction
export NCCL_ALGO=CollnetDirect  # NVSwitch direct

# Protocol selection
export NCCL_PROTO=Simple    # Default
export NCCL_PROTO=LL        # Low-latency
export NCCL_PROTO=LL128     # Low-latency 128-byte

# Network settings
export NCCL_IB_DISABLE=0    # Enable InfiniBand
export NCCL_NET_GDR_LEVEL=5 # GPU Direct RDMA level
```

### 9. Multi-Node Setup

```c
// Multi-node with MPI
#include <mpi.h>
#include <nccl.h>

int main(int argc, char* argv[]) {
    MPI_Init(&argc, &argv);

    int worldSize, rank;
    MPI_Comm_size(MPI_COMM_WORLD, &worldSize);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);

    // Get local rank for GPU assignment
    int localRank;
    MPI_Comm localComm;
    MPI_Comm_split_type(MPI_COMM_WORLD, MPI_COMM_TYPE_SHARED, rank,
        MPI_INFO_NULL, &localComm);
    MPI_Comm_rank(localComm, &localRank);

    // Initialize NCCL
    ncclUniqueId id;
    if (rank == 0) ncclGetUniqueId(&id);
    MPI_Bcast(&id, sizeof(id), MPI_BYTE, 0, MPI_COMM_WORLD);

    cudaSetDevice(localRank);
    ncclComm_t comm;
    ncclCommInitRank(&comm, worldSize, id, rank);

    // Use comm for collectives...

    ncclCommDestroy(comm);
    MPI_Finalize();
    return 0;
}
```

### 10. Performance Profiling

```c
// NCCL timing with CUDA events
cudaEvent_t start, stop;
cudaEventCreate(&start);
cudaEventCreate(&stop);

cudaEventRecord(start, stream);
ncclAllReduce(buff, buff, count, ncclFloat, ncclSum, comm, stream);
cudaEventRecord(stop, stream);
cudaEventSynchronize(stop);

float milliseconds;
cudaEventElapsedTime(&milliseconds, start, stop);

// Calculate bandwidth
size_t bytes = count * sizeof(float);
float algoBW = bytes / milliseconds / 1e6;  // GB/s
float busBW = algoBW * 2 * (numGPUs - 1) / numGPUs;  // Bus bandwidth
printf("AllReduce: %.2f ms, %.2f GB/s (bus: %.2f GB/s)\n",
    milliseconds, algoBW, busBW);
```

```bash
# Enable NCCL debug output
export NCCL_DEBUG=INFO
export NCCL_DEBUG_SUBSYS=ALL

# NCCL tests for benchmarking
./build/all_reduce_perf -b 8 -e 256M -f 2 -g 4
```

## Process Integration

This skill integrates with the following processes:
- `multi-gpu-programming.js` - Multi-GPU development
- `gpu-cluster-computing.js` - Cluster computing

## Output Format

```json
{
  "operation": "all-reduce",
  "status": "success",
  "configuration": {
    "num_gpus": 4,
    "data_size_bytes": 268435456,
    "data_type": "float32",
    "reduction": "sum"
  },
  "performance": {
    "time_ms": 2.34,
    "algorithm_bandwidth_gbps": 114.5,
    "bus_bandwidth_gbps": 171.8
  },
  "topology": {
    "interconnect": "NVLink",
    "algorithm": "Tree",
    "protocol": "LL128"
  }
}
```

## Dependencies

- CUDA Toolkit 11.0+
- NCCL 2.10+
- MPI (optional, for multi-node)

## Constraints

- All ranks must call collective operations in same order
- Buffer sizes must match across ranks
- Stream ordering must be consistent
- Group operations must be balanced (send/recv pairs)
