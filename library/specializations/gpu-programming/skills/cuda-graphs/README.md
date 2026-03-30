# CUDA Graphs Skill

## Overview

The `cuda-graphs` skill provides expert capabilities for CUDA Graph capture and optimization. It enables significant reduction of kernel launch overhead through graph-based execution patterns, particularly beneficial for inference workloads and repetitive kernel sequences.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 10.0+** - Basic graph support
2. **CUDA 11.0+** - Graph updates
3. **CUDA 12.0+** - Conditional nodes
4. **GPU CC 7.0+** - Full graph features

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

## Usage

### Basic Operations

```bash
# Capture stream to graph
/skill cuda-graphs capture --stream main --output graph.bin

# Analyze graph structure
/skill cuda-graphs analyze --graph graph.bin

# Benchmark graph vs stream
/skill cuda-graphs benchmark --iterations 1000

# Export graph visualization
/skill cuda-graphs visualize --graph graph.bin --output graph.dot
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(cudaGraphsTask, {
  operation: 'optimize-pipeline',
  kernelSequence: ['preprocess', 'inference', 'postprocess'],
  updateStrategy: 'parameter-only',
  outputFile: 'optimized_pipeline.cu'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Stream Capture** | Capture operations to graph |
| **Explicit Construction** | Programmatic graph building |
| **Graph Updates** | Modify without reinstantiation |
| **Node Management** | Add/modify kernel, memcpy, memset nodes |
| **Conditional Execution** | Branching within graphs (CUDA 12+) |
| **Performance Analysis** | Launch overhead comparison |

## Examples

### Example 1: Basic Graph Capture

```bash
# Capture inference pipeline to graph
/skill cuda-graphs capture \
  --source inference.cu \
  --entry runInference \
  --output inference_graph.bin
```

### Example 2: Benchmark Comparison

```bash
# Compare graph vs stream execution
/skill cuda-graphs benchmark \
  --graph inference_graph.bin \
  --iterations 10000 \
  --warmup 100 \
  --json
```

Output:
```json
{
  "stream_execution": {
    "total_ms": 1523.5,
    "per_iteration_us": 152.35
  },
  "graph_execution": {
    "total_ms": 285.2,
    "per_iteration_us": 28.52
  },
  "speedup": "5.34x"
}
```

### Example 3: Graph Analysis

```bash
# Analyze graph structure
/skill cuda-graphs analyze \
  --graph inference_graph.bin \
  --output analysis.md
```

### Example 4: Graph Visualization

```bash
# Export DOT file for visualization
/skill cuda-graphs visualize \
  --graph inference_graph.bin \
  --output graph.dot

# Convert to image
dot -Tpng graph.dot -o graph.png
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CUDA_GRAPH_CAPTURE_MODE` | Capture mode | `global` |
| `CUDA_GRAPH_DEBUG` | Enable debug output | `0` |

### Skill Configuration

```yaml
# .babysitter/skills/cuda-graphs.yaml
cuda-graphs:
  defaults:
    capture_mode: global
    update_strategy: topology-preserving
    export_debug: true
  benchmark:
    iterations: 1000
    warmup: 100
```

## Graph Node Types

| Node Type | Description | Use Case |
|-----------|-------------|----------|
| Kernel | Kernel execution | Computation |
| Memcpy | Memory transfer | Data movement |
| Memset | Memory initialization | Buffer clearing |
| Host | Host function callback | CPU-side operations |
| Event Record/Wait | Synchronization | Stream coordination |
| Empty | Dependency only | Graph structure |
| Conditional | Branching (CUDA 12+) | Dynamic flows |

## Process Integration

### Processes Using This Skill

1. **cuda-stream-concurrency.js** - Stream optimization
2. **ml-inference-optimization.js** - Inference pipelines
3. **dynamic-parallelism-implementation.js** - Execution patterns

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const optimizeInferenceTask = defineTask({
  name: 'optimize-inference-graph',
  description: 'Convert inference pipeline to CUDA graph',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Optimize ${inputs.modelName} with CUDA Graphs`,
      skill: {
        name: 'cuda-graphs',
        context: {
          operation: 'capture-inference',
          model: inputs.modelName,
          layers: inputs.layers,
          enableUpdates: true,
          benchmarkAfter: true
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Performance Guidelines

### When to Use Graphs

| Scenario | Use Graph? | Reason |
|----------|------------|--------|
| Many small kernels | Yes | Amortize launch overhead |
| Inference pipeline | Yes | Consistent low latency |
| Dynamic workloads | No | Cannot capture variable patterns |
| Single large kernel | No | Launch overhead minimal |

### Expected Speedups

| Kernel Count | Typical Speedup |
|--------------|-----------------|
| 5-10 kernels | 2-3x |
| 10-50 kernels | 5-10x |
| 50-100 kernels | 10-20x |
| 100+ kernels | 20-50x |

### Graph Update Strategies

| Strategy | When to Use |
|----------|-------------|
| Full reinstantiation | Topology changes |
| Graph update | Same topology, new capture |
| Node parameter update | Only parameters change |

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Capture fails | Unsupported operation | Remove printf, device malloc |
| Update rejected | Topology changed | Reinstantiate graph |
| No speedup | Large kernels | Launch overhead not bottleneck |
| Inconsistent results | Missing dependencies | Fix node dependencies |

### Debug Tips

```bash
# Enable CUDA graph debug output
export CUDA_GRAPH_DEBUG=1

# Export graph for visualization
/skill cuda-graphs visualize --graph graph.bin --verbose

# Verify graph structure
/skill cuda-graphs validate --graph graph.bin
```

## Related Skills

- **cuda-toolkit** - Kernel development
- **cuda-stream-concurrency** - Stream management
- **gpu-benchmarking** - Performance measurement

## References

- [CUDA Graphs Documentation](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#cuda-graphs)
- [CUDA Graphs Best Practices](https://developer.nvidia.com/blog/cuda-graphs/)
- [NVIDIA CUDA Samples - Graphs](https://github.com/NVIDIA/cuda-samples)
- [Nsight Systems Graph Profiling](https://developer.nvidia.com/nsight-systems)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-017
**Category:** Execution Optimization
**Status:** Active
