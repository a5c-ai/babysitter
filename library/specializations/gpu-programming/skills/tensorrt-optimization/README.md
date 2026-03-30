# TensorRT Optimization Skill

## Overview

The `tensorrt-optimization` skill provides NVIDIA TensorRT model optimization and deployment capabilities for high-performance deep learning inference.

## Quick Start

### Prerequisites

1. **TensorRT 8.5+** - Inference optimizer
2. **CUDA Toolkit 11.0+** - Base toolkit
3. **Python tensorrt** - Python bindings

### Installation

```bash
# Verify TensorRT
trtexec --help | head -5

# Python package
pip install tensorrt
```

## Usage

### Basic Operations

```bash
# Convert ONNX to TensorRT
/skill tensorrt-optimization convert --input model.onnx --output model.engine

# Enable FP16
/skill tensorrt-optimization optimize --model model.onnx --precision fp16

# INT8 calibration
/skill tensorrt-optimization calibrate --model model.onnx --data calibration/

# Benchmark
/skill tensorrt-optimization benchmark --engine model.engine --iterations 1000
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(tensorrtTask, {
  operation: 'build-engine',
  inputModel: 'model.onnx',
  precision: ['fp16', 'int8'],
  dynamicShapes: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Model Conversion** | ONNX/PyTorch to TensorRT |
| **Precision Modes** | FP32, FP16, INT8, TF32 |
| **Dynamic Shapes** | Variable batch/dimensions |
| **INT8 Calibration** | Quantization calibration |
| **Plugin Development** | Custom operators |
| **Profiling** | Latency/throughput analysis |

## Precision Comparison

| Precision | Speedup | Accuracy | Use Case |
|-----------|---------|----------|----------|
| FP32 | 1x | Baseline | Development |
| TF32 | 2-3x | ~FP32 | Training |
| FP16 | 2-4x | Minimal loss | Production |
| INT8 | 3-6x | Calibration needed | Edge |

## Process Integration

1. **ml-inference-optimization.js** - Inference optimization
2. **tensor-core-programming.js** - Tensor core usage

## Related Skills

- **cublas-cudnn** - Library integration
- **cutlass-triton** - Kernel templates
- **ml-inference-optimizer** - Agent expertise

## References

- [TensorRT Documentation](https://docs.nvidia.com/deeplearning/tensorrt/)
- [TensorRT Developer Guide](https://docs.nvidia.com/deeplearning/tensorrt/developer-guide/)
- [TensorRT Best Practices](https://docs.nvidia.com/deeplearning/tensorrt/best-practices/)

---

**Backlog ID:** SK-008
**Category:** ML Inference
**Status:** Active
