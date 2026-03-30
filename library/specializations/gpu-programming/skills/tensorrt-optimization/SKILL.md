---
name: tensorrt-optimization
description: NVIDIA TensorRT model optimization and deployment. Convert models to TensorRT engines, configure optimization profiles and precision modes, apply INT8 calibration, analyze kernel fusion, generate custom plugins, and profile inference performance.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: ml-inference
  backlog-id: SK-008
---

# tensorrt-optimization

You are **tensorrt-optimization** - a specialized skill for NVIDIA TensorRT model optimization and deployment. This skill provides expert capabilities for optimizing deep learning models for inference.

## Overview

This skill enables AI-powered TensorRT optimization including:
- Convert models to TensorRT engines
- Configure optimization profiles and precision modes
- Apply INT8 calibration and quantization
- Analyze kernel fusion opportunities
- Generate custom TensorRT plugins
- Profile inference latency and throughput
- Handle dynamic shapes and batch sizes
- Compare TensorRT vs framework inference

## Prerequisites

- TensorRT 8.5+
- CUDA Toolkit 11.0+
- ONNX Runtime (for ONNX models)
- Python TensorRT package

## Capabilities

### 1. Model Conversion to TensorRT

Convert models from various frameworks:

```python
import tensorrt as trt

# Create builder and network
logger = trt.Logger(trt.Logger.WARNING)
builder = trt.Builder(logger)
network = builder.create_network(
    1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH))

# Parse ONNX model
parser = trt.OnnxParser(network, logger)
with open("model.onnx", "rb") as f:
    parser.parse(f.read())

# Configure builder
config = builder.create_builder_config()
config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, 1 << 30)  # 1GB

# Build engine
engine = builder.build_serialized_network(network, config)

# Save engine
with open("model.engine", "wb") as f:
    f.write(engine)
```

### 2. Precision Configuration

Configure FP16, INT8, and TF32:

```python
# Enable FP16
config.set_flag(trt.BuilderFlag.FP16)

# Enable INT8 (requires calibration)
config.set_flag(trt.BuilderFlag.INT8)

# Enable TF32 (Ampere+)
config.clear_flag(trt.BuilderFlag.TF32)  # Disable if needed

# Enable sparse tensor cores
config.set_flag(trt.BuilderFlag.SPARSE_WEIGHTS)

# Prefer precision per layer
config.set_flag(trt.BuilderFlag.PREFER_PRECISION_CONSTRAINTS)

# Force strict types
config.set_flag(trt.BuilderFlag.STRICT_TYPES)
```

### 3. INT8 Calibration

```python
class Calibrator(trt.IInt8EntropyCalibrator2):
    def __init__(self, data_loader, cache_file):
        super().__init__()
        self.data_loader = iter(data_loader)
        self.cache_file = cache_file
        self.batch_size = data_loader.batch_size
        self.device_input = cuda.mem_alloc(
            self.batch_size * 3 * 224 * 224 * 4)

    def get_batch_size(self):
        return self.batch_size

    def get_batch(self, names):
        try:
            batch = next(self.data_loader)
            cuda.memcpy_htod(self.device_input, batch.numpy())
            return [int(self.device_input)]
        except StopIteration:
            return None

    def read_calibration_cache(self):
        if os.path.exists(self.cache_file):
            with open(self.cache_file, "rb") as f:
                return f.read()
        return None

    def write_calibration_cache(self, cache):
        with open(self.cache_file, "wb") as f:
            f.write(cache)

# Use calibrator
calibrator = Calibrator(calibration_loader, "calibration.cache")
config.int8_calibrator = calibrator
config.set_flag(trt.BuilderFlag.INT8)
```

### 4. Dynamic Shapes

Handle variable input sizes:

```python
# Create optimization profile
profile = builder.create_optimization_profile()

# Define shape ranges [min, optimal, max]
profile.set_shape("input",
    min=(1, 3, 224, 224),     # Minimum shape
    opt=(8, 3, 224, 224),     # Optimal shape
    max=(32, 3, 224, 224))    # Maximum shape

config.add_optimization_profile(profile)

# Multiple profiles for different scenarios
profile_small = builder.create_optimization_profile()
profile_small.set_shape("input", (1, 3, 224, 224), (4, 3, 224, 224), (8, 3, 224, 224))
config.add_optimization_profile(profile_small)

profile_large = builder.create_optimization_profile()
profile_large.set_shape("input", (16, 3, 224, 224), (32, 3, 224, 224), (64, 3, 224, 224))
config.add_optimization_profile(profile_large)
```

### 5. Inference Execution

```python
# Load engine
runtime = trt.Runtime(logger)
with open("model.engine", "rb") as f:
    engine = runtime.deserialize_cuda_engine(f.read())

# Create execution context
context = engine.create_execution_context()

# Set input shape for dynamic shapes
context.set_input_shape("input", (batch_size, 3, 224, 224))

# Allocate buffers
inputs = []
outputs = []
bindings = []

for i in range(engine.num_io_tensors):
    name = engine.get_tensor_name(i)
    dtype = trt.nptype(engine.get_tensor_dtype(name))
    shape = context.get_tensor_shape(name)
    size = trt.volume(shape)

    buffer = cuda.mem_alloc(size * dtype.itemsize)
    bindings.append(int(buffer))

    if engine.get_tensor_mode(name) == trt.TensorIOMode.INPUT:
        inputs.append(buffer)
    else:
        outputs.append(buffer)

# Execute inference
cuda.memcpy_htod(inputs[0], input_data)
context.execute_v2(bindings)
cuda.memcpy_dtoh(output_data, outputs[0])
```

### 6. Plugin Development

Create custom operations:

```cpp
// Plugin class
class CustomPlugin : public nvinfer1::IPluginV2DynamicExt {
public:
    int getNbOutputs() const noexcept override { return 1; }

    nvinfer1::DimsExprs getOutputDimensions(
        int outputIndex,
        const nvinfer1::DimsExprs* inputs,
        int nbInputs,
        nvinfer1::IExprBuilder& exprBuilder) noexcept override {
        return inputs[0];  // Same shape as input
    }

    int enqueue(
        const nvinfer1::PluginTensorDesc* inputDesc,
        const nvinfer1::PluginTensorDesc* outputDesc,
        const void* const* inputs,
        void* const* outputs,
        void* workspace,
        cudaStream_t stream) noexcept override {
        // Launch custom CUDA kernel
        customKernel<<<blocks, threads, 0, stream>>>(
            inputs[0], outputs[0], inputDesc[0].dims);
        return 0;
    }
};

// Register plugin
REGISTER_TENSORRT_PLUGIN(CustomPluginCreator);
```

### 7. Performance Profiling

```python
# Enable profiling
config.profiling_verbosity = trt.ProfilingVerbosity.DETAILED

# Use timing cache for faster builds
timing_cache_file = "timing.cache"
if os.path.exists(timing_cache_file):
    with open(timing_cache_file, "rb") as f:
        cache = config.create_timing_cache(f.read())
else:
    cache = config.create_timing_cache(b"")
config.set_timing_cache(cache, ignore_mismatch=False)

# Profile inference
profiler = trt.Profiler()
context.profiler = profiler

# Benchmark
import time
warmup = 10
iterations = 100

for _ in range(warmup):
    context.execute_v2(bindings)
cuda.Context.synchronize()

start = time.perf_counter()
for _ in range(iterations):
    context.execute_v2(bindings)
cuda.Context.synchronize()
end = time.perf_counter()

latency = (end - start) / iterations * 1000
throughput = batch_size * iterations / (end - start)
print(f"Latency: {latency:.2f} ms, Throughput: {throughput:.2f} samples/s")
```

### 8. Kernel Fusion Analysis

```bash
# Use trtexec for analysis
trtexec --onnx=model.onnx \
    --fp16 \
    --workspace=4096 \
    --verbose \
    --dumpLayerInfo \
    --exportLayerInfo=layers.json

# Profile with Nsight Systems
nsys profile -o trt_profile \
    trtexec --loadEngine=model.engine --iterations=100

# View layer timing
trtexec --loadEngine=model.engine \
    --dumpProfile \
    --separateProfileRun
```

## Command Line Tools

```bash
# Convert ONNX to TensorRT
trtexec --onnx=model.onnx --saveEngine=model.engine

# With FP16
trtexec --onnx=model.onnx --fp16 --saveEngine=model_fp16.engine

# With INT8 calibration
trtexec --onnx=model.onnx --int8 \
    --calib=calibration.cache --saveEngine=model_int8.engine

# Dynamic shapes
trtexec --onnx=model.onnx \
    --minShapes=input:1x3x224x224 \
    --optShapes=input:8x3x224x224 \
    --maxShapes=input:32x3x224x224 \
    --saveEngine=model_dynamic.engine

# Benchmark existing engine
trtexec --loadEngine=model.engine \
    --iterations=1000 \
    --warmUp=500 \
    --duration=10
```

## Process Integration

This skill integrates with the following processes:
- `ml-inference-optimization.js` - ML inference optimization
- `tensor-core-programming.js` - Tensor core usage

## Output Format

```json
{
  "operation": "build-engine",
  "status": "success",
  "input_model": "model.onnx",
  "output_engine": "model.engine",
  "configuration": {
    "precision": ["FP16", "INT8"],
    "workspace_mb": 1024,
    "dynamic_shapes": true
  },
  "optimization": {
    "layer_fusions": 23,
    "reformats_eliminated": 8,
    "tactics_selected": 156
  },
  "performance": {
    "build_time_s": 45.2,
    "engine_size_mb": 28.5,
    "estimated_latency_ms": 1.2
  }
}
```

## Dependencies

- TensorRT 8.5+
- CUDA Toolkit 11.0+
- ONNX Runtime (optional)
- Python tensorrt package

## Constraints

- INT8 requires representative calibration data
- Dynamic shapes increase build time
- Custom plugins need careful memory management
- Engine files are GPU-architecture specific
