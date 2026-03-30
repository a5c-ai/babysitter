---
name: cuda-graphs
description: Expert skill for CUDA Graph capture and optimization for reduced launch overhead. Capture CUDA operations into graphs, instantiate and execute graph instances, update graph node parameters, profile graph vs stream execution, design graph-friendly kernel patterns, and optimize launch latency for inference.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: execution-optimization
  backlog-id: SK-017
---

# cuda-graphs

You are **cuda-graphs** - a specialized skill for CUDA Graph capture and optimization. This skill provides expert capabilities for reducing kernel launch overhead and optimizing execution patterns through graph-based workflows.

## Overview

This skill enables AI-powered CUDA Graph operations including:
- Capturing CUDA operations into graphs
- Instantiating and executing graph instances
- Updating graph node parameters
- Profiling graph vs stream execution
- Designing graph-friendly kernel patterns
- Handling conditional graph execution
- Integrating graphs with NCCL operations
- Optimizing launch latency for inference

## Prerequisites

- NVIDIA CUDA Toolkit 10.0+ (basic graphs)
- CUDA 11.0+ for graph updates
- CUDA 12.0+ for conditional nodes
- GPU with compute capability 7.0+
- Nsight Systems for graph profiling

## Capabilities

### 1. Stream Capture Basic

Capture stream operations into a graph:

```cuda
#include <cuda_runtime.h>

cudaGraph_t graph;
cudaGraphExec_t graphExec;
cudaStream_t stream;

cudaStreamCreate(&stream);

// Begin stream capture
cudaStreamBeginCapture(stream, cudaStreamCaptureModeGlobal);

// Record operations to be captured
kernel1<<<grid1, block1, 0, stream>>>(args1);
kernel2<<<grid2, block2, 0, stream>>>(args2);
kernel3<<<grid3, block3, 0, stream>>>(args3);

// End capture and create graph
cudaStreamEndCapture(stream, &graph);

// Instantiate the graph for execution
cudaGraphInstantiate(&graphExec, graph, NULL, NULL, 0);

// Execute the graph (much lower overhead than individual launches)
for (int i = 0; i < iterations; i++) {
    cudaGraphLaunch(graphExec, stream);
}
cudaStreamSynchronize(stream);

// Cleanup
cudaGraphExecDestroy(graphExec);
cudaGraphDestroy(graph);
cudaStreamDestroy(stream);
```

### 2. Explicit Graph Construction

Build graphs programmatically:

```cuda
cudaGraph_t graph;
cudaGraphCreate(&graph, 0);

// Create kernel nodes
cudaKernelNodeParams kernelParams1 = {0};
kernelParams1.func = (void*)kernel1;
kernelParams1.gridDim = grid1;
kernelParams1.blockDim = block1;
kernelParams1.sharedMemBytes = 0;
kernelParams1.kernelParams = kernelArgs1;

cudaKernelNodeParams kernelParams2 = {0};
kernelParams2.func = (void*)kernel2;
kernelParams2.gridDim = grid2;
kernelParams2.blockDim = block2;
kernelParams2.sharedMemBytes = 0;
kernelParams2.kernelParams = kernelArgs2;

cudaGraphNode_t node1, node2;

// Add first kernel (no dependencies)
cudaGraphAddKernelNode(&node1, graph, NULL, 0, &kernelParams1);

// Add second kernel (depends on first)
cudaGraphNode_t dependencies[] = {node1};
cudaGraphAddKernelNode(&node2, graph, dependencies, 1, &kernelParams2);

// Instantiate and execute
cudaGraphExec_t graphExec;
cudaGraphInstantiate(&graphExec, graph, NULL, NULL, 0);
cudaGraphLaunch(graphExec, stream);
```

### 3. Graph Node Types

```cuda
// Memory copy node
cudaMemcpy3DParms copyParams = {0};
// ... configure copy parameters
cudaGraphNode_t copyNode;
cudaGraphAddMemcpyNode(&copyNode, graph, NULL, 0, &copyParams);

// Memset node
cudaMemsetParams memsetParams = {0};
memsetParams.dst = d_array;
memsetParams.value = 0;
memsetParams.pitch = 0;
memsetParams.elementSize = sizeof(int);
memsetParams.width = N;
memsetParams.height = 1;
cudaGraphNode_t memsetNode;
cudaGraphAddMemsetNode(&memsetNode, graph, NULL, 0, &memsetParams);

// Host function node
cudaHostNodeParams hostParams = {0};
hostParams.fn = hostCallback;
hostParams.userData = userData;
cudaGraphNode_t hostNode;
cudaGraphAddHostNode(&hostNode, graph, dependencies, numDeps, &hostParams);

// Event record/wait nodes (CUDA 11.1+)
cudaEvent_t event;
cudaEventCreate(&event);
cudaGraphNode_t eventRecordNode, eventWaitNode;
cudaGraphAddEventRecordNode(&eventRecordNode, graph, deps, numDeps, event);
cudaGraphAddEventWaitNode(&eventWaitNode, graph, deps, numDeps, event);

// Empty node (for dependencies only)
cudaGraphNode_t emptyNode;
cudaGraphAddEmptyNode(&emptyNode, graph, deps, numDeps);
```

### 4. Graph Updates (CUDA 11+)

Update graph parameters without rebuilding:

```cuda
cudaGraph_t graph;
cudaGraphExec_t graphExec;

// Initial capture
cudaStreamBeginCapture(stream, cudaStreamCaptureModeGlobal);
myKernel<<<grid, block, 0, stream>>>(d_input, d_output, N);
cudaStreamEndCapture(stream, &graph);
cudaGraphInstantiate(&graphExec, graph, NULL, NULL, 0);

// Execute initial graph
cudaGraphLaunch(graphExec, stream);
cudaStreamSynchronize(stream);

// Update the graph with new capture
cudaGraph_t newGraph;
cudaStreamBeginCapture(stream, cudaStreamCaptureModeGlobal);
myKernel<<<grid, block, 0, stream>>>(d_input2, d_output2, N);  // Different pointers
cudaStreamEndCapture(stream, &newGraph);

// Update executable graph
cudaGraphExecUpdateResult updateResult;
cudaGraphExecUpdate(graphExec, newGraph, NULL, &updateResult);

if (updateResult == cudaGraphExecUpdateSuccess) {
    // Graph updated successfully
    cudaGraphLaunch(graphExec, stream);
} else {
    // Need to reinstantiate
    cudaGraphExecDestroy(graphExec);
    cudaGraphInstantiate(&graphExec, newGraph, NULL, NULL, 0);
    cudaGraphLaunch(graphExec, stream);
}

cudaGraphDestroy(newGraph);
```

### 5. Kernel Node Parameter Updates

```cuda
// Get kernel node from graph
cudaGraphNode_t* nodes;
size_t numNodes;
cudaGraphGetNodes(graph, NULL, &numNodes);
nodes = new cudaGraphNode_t[numNodes];
cudaGraphGetNodes(graph, nodes, &numNodes);

// Find and update kernel node
for (size_t i = 0; i < numNodes; i++) {
    cudaGraphNodeType nodeType;
    cudaGraphNodeGetType(nodes[i], &nodeType);

    if (nodeType == cudaGraphNodeTypeKernel) {
        cudaKernelNodeParams params;
        cudaGraphKernelNodeGetParams(nodes[i], &params);

        // Update parameters
        void* newArgs[] = {&newInput, &newOutput, &newN};
        params.kernelParams = newArgs;

        // Set new parameters
        cudaGraphExecKernelNodeSetParams(graphExec, nodes[i], &params);
    }
}

delete[] nodes;
```

### 6. Graph Performance Benchmarking

```cuda
void benchmarkGraphVsStreams(int numKernels, int iterations) {
    cudaEvent_t start, stop;
    cudaEventCreate(&start);
    cudaEventCreate(&stop);

    // Benchmark stream-based execution
    cudaEventRecord(start);
    for (int i = 0; i < iterations; i++) {
        for (int k = 0; k < numKernels; k++) {
            smallKernel<<<grid, block, 0, stream>>>(d_data, N);
        }
    }
    cudaEventRecord(stop);
    cudaEventSynchronize(stop);

    float streamTime;
    cudaEventElapsedTime(&streamTime, start, stop);

    // Benchmark graph-based execution
    cudaGraph_t graph;
    cudaStreamBeginCapture(stream, cudaStreamCaptureModeGlobal);
    for (int k = 0; k < numKernels; k++) {
        smallKernel<<<grid, block, 0, stream>>>(d_data, N);
    }
    cudaStreamEndCapture(stream, &graph);

    cudaGraphExec_t graphExec;
    cudaGraphInstantiate(&graphExec, graph, NULL, NULL, 0);

    cudaEventRecord(start);
    for (int i = 0; i < iterations; i++) {
        cudaGraphLaunch(graphExec, stream);
    }
    cudaEventRecord(stop);
    cudaEventSynchronize(stop);

    float graphTime;
    cudaEventElapsedTime(&graphTime, start, stop);

    printf("Stream execution: %.3f ms\n", streamTime);
    printf("Graph execution:  %.3f ms\n", graphTime);
    printf("Speedup: %.2fx\n", streamTime / graphTime);

    cudaGraphExecDestroy(graphExec);
    cudaGraphDestroy(graph);
}
```

### 7. Inference Pipeline with Graphs

```cuda
class InferenceGraphPipeline {
private:
    cudaGraph_t graph;
    cudaGraphExec_t graphExec;
    cudaStream_t stream;

    // Model weights (constant during inference)
    float* d_weights1;
    float* d_weights2;

    // Buffers (reused per inference)
    float* d_input;
    float* d_hidden;
    float* d_output;

public:
    void initGraph() {
        cudaStreamCreate(&stream);

        // Capture inference operations
        cudaStreamBeginCapture(stream, cudaStreamCaptureModeGlobal);

        // Layer 1: Input -> Hidden
        matmulKernel<<<grid1, block1, 0, stream>>>(d_input, d_weights1, d_hidden, M, K, N1);
        reluKernel<<<(N1 + 255)/256, 256, 0, stream>>>(d_hidden, N1);

        // Layer 2: Hidden -> Output
        matmulKernel<<<grid2, block2, 0, stream>>>(d_hidden, d_weights2, d_output, M, N1, N2);
        softmaxKernel<<<M, 256, 0, stream>>>(d_output, N2);

        cudaStreamEndCapture(stream, &graph);
        cudaGraphInstantiate(&graphExec, graph, NULL, NULL, 0);
    }

    void infer(float* h_input, float* h_output, int batchSize) {
        // Copy input to device
        cudaMemcpyAsync(d_input, h_input, batchSize * inputSize * sizeof(float),
                        cudaMemcpyHostToDevice, stream);

        // Execute inference graph - very low overhead!
        cudaGraphLaunch(graphExec, stream);

        // Copy output to host
        cudaMemcpyAsync(h_output, d_output, batchSize * outputSize * sizeof(float),
                        cudaMemcpyDeviceToHost, stream);

        cudaStreamSynchronize(stream);
    }

    void updateInputBuffer(float* newInput) {
        // Update graph to use new input buffer
        // ... graph update code
    }
};
```

### 8. Conditional Graphs (CUDA 12+)

```cuda
// CUDA 12.0+ conditional graph execution
cudaGraph_t graph;
cudaGraphCreate(&graph, 0);

// Create conditional node
cudaGraphConditionalHandle conditionalHandle;
cudaGraphConditionalHandleCreate(&conditionalHandle, graph, 0, 0);

// Create condition check node
cudaGraphNode_t conditionNode;
cudaKernelNodeParams condParams = {0};
condParams.func = (void*)checkConditionKernel;
// ... configure params
cudaGraphAddKernelNode(&conditionNode, graph, NULL, 0, &condParams);

// Create conditional body graph
cudaGraph_t bodyGraph;
cudaGraphCreate(&bodyGraph, 0);
// ... add nodes to body graph

// Add conditional node
cudaGraphNodeParams nodeParams = {0};
nodeParams.type = cudaGraphNodeTypeConditional;
nodeParams.conditional.handle = conditionalHandle;
nodeParams.conditional.type = cudaGraphCondTypeIf;
nodeParams.conditional.size = 1;
nodeParams.conditional.phGraph_out = &bodyGraph;

cudaGraphNode_t conditionalNode;
cudaGraphAddNode(&conditionalNode, graph, &conditionNode, 1, &nodeParams);
```

### 9. Graph Debugging and Visualization

```cuda
// Export graph to DOT format for visualization
void exportGraphToDot(cudaGraph_t graph, const char* filename) {
    cudaGraphDebugDotPrint(graph, filename, cudaGraphDebugDotFlagsVerbose);
}

// Get graph statistics
void printGraphStats(cudaGraph_t graph) {
    cudaGraphNode_t* nodes;
    size_t numNodes;
    cudaGraphGetNodes(graph, NULL, &numNodes);
    nodes = new cudaGraphNode_t[numNodes];
    cudaGraphGetNodes(graph, nodes, &numNodes);

    int kernelCount = 0, memcpyCount = 0, memsetCount = 0;

    for (size_t i = 0; i < numNodes; i++) {
        cudaGraphNodeType nodeType;
        cudaGraphNodeGetType(nodes[i], &nodeType);

        switch (nodeType) {
            case cudaGraphNodeTypeKernel: kernelCount++; break;
            case cudaGraphNodeTypeMemcpy: memcpyCount++; break;
            case cudaGraphNodeTypeMemset: memsetCount++; break;
        }
    }

    printf("Graph Statistics:\n");
    printf("  Total nodes: %zu\n", numNodes);
    printf("  Kernel nodes: %d\n", kernelCount);
    printf("  Memcpy nodes: %d\n", memcpyCount);
    printf("  Memset nodes: %d\n", memsetCount);

    delete[] nodes;
}
```

## Best Practices

### When to Use CUDA Graphs

| Use Case | Benefit |
|----------|---------|
| Many small kernels | Reduces launch overhead |
| Repeated execution patterns | Amortize capture cost |
| ML inference | Consistent low latency |
| Batch processing | Efficient repeated execution |

### Graph Design Guidelines

1. **Capture stable patterns** - Don't capture dynamic workloads
2. **Use graph updates** - Avoid reinstantiation overhead
3. **Profile first** - Ensure launch overhead is the bottleneck
4. **Batch operations** - Maximize work per graph launch

### Launch Overhead Reduction

| Scenario | Traditional | With Graph | Speedup |
|----------|-------------|------------|---------|
| 10 small kernels | ~20-50us overhead | ~10us overhead | 2-5x |
| 100 small kernels | ~200-500us overhead | ~10us overhead | 20-50x |
| Inference pipeline | Variable | Consistent | Lower latency variance |

## Process Integration

This skill integrates with the following processes:
- `cuda-stream-concurrency.js` - Stream optimization
- `ml-inference-optimization.js` - Inference pipelines
- `dynamic-parallelism-implementation.js` - Execution patterns

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "capture-graph",
  "status": "success",
  "graph": {
    "nodes": 15,
    "kernels": 10,
    "memcpys": 3,
    "memsets": 2,
    "dependencies": 14
  },
  "performance": {
    "capture_time_ms": 0.5,
    "instantiate_time_ms": 1.2,
    "launch_overhead_us": 8.5,
    "traditional_overhead_us": 45.0,
    "speedup": "5.3x"
  },
  "recommendations": [
    "Graph suitable for repeated execution",
    "Consider batching memcpy nodes"
  ],
  "artifacts": ["graph_debug.dot", "graph_stats.json"]
}
```

## Constraints

- Graph capture requires consistent execution paths
- Some operations cannot be captured (printf, malloc in kernels)
- Graph updates limited to same topology
- Conditional nodes require CUDA 12.0+
- Profiling with graphs requires Nsight Systems 2021.4+
