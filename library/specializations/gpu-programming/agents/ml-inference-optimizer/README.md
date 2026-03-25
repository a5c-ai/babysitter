# ML Inference Optimizer Agent

## Overview

The `ml-inference-optimizer` agent embodies the expertise of an ML Infrastructure Engineer specializing in GPU-accelerated model optimization for production inference. It provides guidance on TensorRT, quantization, serving patterns, and latency/throughput optimization.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | ML Infrastructure Engineer |
| **Experience** | 6+ years in ML systems optimization |
| **Background** | MLOps, inference serving, deep learning |
| **Philosophy** | "Optimize for the metric that matters" |

## Core Principles

1. **Production-First** - Optimize for real serving conditions
2. **Measure Everything** - Profile before and after
3. **Accuracy-Performance Tradeoff** - Quantify the tradeoff
4. **Scalability** - Design for variable load
5. **Reproducibility** - Deterministic builds
6. **Cost-Aware** - Consider TCO

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **TensorRT** | Engine building, optimization profiles |
| **Quantization** | PTQ, QAT, INT8/FP8 calibration |
| **Kernel Fusion** | Operator fusion patterns |
| **Dynamic Batching** | Batch optimization strategies |
| **ONNX Optimization** | Model transformation pipeline |
| **Serving Patterns** | Triton, TorchServe, scaling |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(inferenceOptimizationTask, {
  agentName: 'ml-inference-optimizer',
  prompt: {
    role: 'ML Infrastructure Engineer',
    task: 'Optimize BERT model for production inference',
    context: {
      modelType: 'bert-base',
      targetHardware: 'A100',
      latencySLO: '10ms',
      throughputTarget: '1000 qps'
    },
    instructions: [
      'Recommend optimization pipeline',
      'Suggest precision/quantization strategy',
      'Design batching configuration',
      'Estimate expected performance'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Optimize model for inference
/agent ml-inference-optimizer optimize \
  --model bert-base.onnx \
  --target-latency 10ms \
  --hardware A100

# Design quantization strategy
/agent ml-inference-optimizer quantize \
  --model model.onnx \
  --strategy int8 \
  --calibration-data cal_data.npy

# Analyze latency/throughput tradeoffs
/agent ml-inference-optimizer analyze \
  --model model.trt \
  --batch-sizes 1,4,8,16,32
```

## Common Tasks

### 1. TensorRT Optimization

```bash
/agent ml-inference-optimizer build-tensorrt \
  --model model.onnx \
  --precision fp16 \
  --dynamic-batch 1-32
```

Provides:
- Builder configuration
- Optimization profile setup
- Engine serialization code
- Benchmark results

### 2. Quantization Planning

```bash
/agent ml-inference-optimizer plan-quantization \
  --model bert-base \
  --accuracy-tolerance 1% \
  --target-speedup 2x
```

Provides:
- Precision recommendation
- Calibration data requirements
- Expected accuracy/speed tradeoff
- Validation procedure

### 3. Serving Configuration

```bash
/agent ml-inference-optimizer design-serving \
  --model optimized.trt \
  --traffic-pattern "bursty" \
  --latency-slo 20ms
```

Provides:
- Batching strategy
- Instance configuration
- Auto-scaling rules
- Monitoring setup

### 4. Performance Analysis

```bash
/agent ml-inference-optimizer analyze-performance \
  --model model.trt \
  --profile-data nsys_report.qdrep
```

Provides:
- Bottleneck identification
- Optimization opportunities
- Expected improvements
- Implementation priorities

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `ml-inference-optimization.js` | All optimization phases |
| `custom-cuda-operator-development.js` | PyTorch/TF integration |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const optimizeModelTask = defineTask({
  name: 'optimize-model',
  description: 'Optimize ML model for production inference',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Optimize ${inputs.modelName} for inference`,
      agent: {
        name: 'ml-inference-optimizer',
        prompt: {
          role: 'ML Infrastructure Engineer',
          task: 'Create comprehensive optimization plan',
          context: {
            model: inputs.modelName,
            currentMetrics: inputs.baselineMetrics,
            constraints: {
              latencySLO: inputs.latencySLO,
              accuracyTolerance: inputs.accuracyTolerance,
              memoryLimit: inputs.memoryLimit
            },
            targetHardware: inputs.hardware
          },
          instructions: [
            'Analyze current model performance',
            'Identify optimization opportunities',
            'Create step-by-step optimization plan',
            'Estimate final performance metrics',
            'Provide implementation code'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['analysis', 'plan', 'expectedMetrics'],
          properties: {
            analysis: { type: 'object' },
            plan: { type: 'array' },
            expectedMetrics: { type: 'object' }
          }
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

## Optimization Reference

### Precision Comparison

| Precision | Speedup | Accuracy Loss | Use Case |
|-----------|---------|---------------|----------|
| FP32 | 1x | Baseline | Development |
| FP16 | 1.5-2x | <0.1% | Most workloads |
| INT8 | 2-4x | 0.1-1% | Throughput critical |
| FP8 | 2-3x over FP16 | <0.5% | Hopper+ GPUs |

### Batching Strategies

| Strategy | Latency | Throughput | Use Case |
|----------|---------|------------|----------|
| Static | Predictable | Lower | Latency critical |
| Dynamic | Variable | Higher | Throughput critical |
| Continuous | Optimal for LLMs | Highest | Variable-length |

### Common Optimizations

| Optimization | Expected Impact |
|--------------|-----------------|
| ONNX fusion | 10-20% |
| FP16 conversion | 40-50% |
| TensorRT build | 20-40% |
| INT8 quantization | 100-200% |
| Kernel fusion | 20-30% |

## Interaction Guidelines

### What to Expect

- **Data-driven recommendations** with benchmarks
- **Trade-off analysis** for accuracy vs speed
- **Production-ready code** and configurations
- **Cost analysis** for infrastructure

### Best Practices

1. Provide baseline metrics
2. Specify latency/throughput SLOs
3. Define accuracy tolerance
4. Describe target hardware
5. Share traffic patterns

## Related Resources

- [tensorrt-optimization skill](../skills/tensorrt-optimization/) - TensorRT expertise
- [cuda-graphs skill](../skills/cuda-graphs/) - Execution optimization
- [gpu-benchmarking skill](../skills/gpu-benchmarking/) - Performance measurement

## References

- [NVIDIA TensorRT Documentation](https://developer.nvidia.com/tensorrt)
- [TensorRT-LLM](https://github.com/NVIDIA/TensorRT-LLM)
- [NVIDIA Model Optimizer](https://github.com/NVIDIA/TensorRT-Model-Optimizer)
- [Triton Inference Server](https://developer.nvidia.com/triton-inference-server)
- [NVIDIA NeMo Agent Toolkit MCP](https://docs.nvidia.com/nemo/agent-toolkit/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-009
**Category:** Machine Learning
**Status:** Active
