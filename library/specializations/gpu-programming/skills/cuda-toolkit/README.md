# CUDA Toolkit Skill

## Overview

The `cuda-toolkit` skill provides deep integration with the NVIDIA CUDA toolkit for kernel development, compilation, and debugging. It enables automated kernel code generation, compilation optimization, and PTX/SASS analysis.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 11.0+** - With nvcc compiler
2. **NVIDIA GPU** - Compute capability 3.5+
3. **cuobjdump** - For binary analysis (optional)

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

```bash
# Verify CUDA installation
nvcc --version

# Check available GPUs
nvidia-smi
```

## Usage

### Basic Operations

```bash
# Compile CUDA program
/skill cuda-toolkit compile --source program.cu --arch sm_80

# Generate kernel code
/skill cuda-toolkit generate-kernel --pattern reduction --type float

# Analyze PTX
/skill cuda-toolkit analyze-ptx --binary program

# Calculate launch config
/skill cuda-toolkit launch-config --kernel myKernel --elements 1000000
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(cudaToolkitTask, {
  operation: 'compile',
  source: 'kernel.cu',
  flags: ['-O3', '-arch=sm_80'],
  outputFile: 'kernel'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Compilation** | nvcc with optimization flags |
| **Code Generation** | CUDA kernel templates |
| **PTX Analysis** | Assembly optimization insights |
| **Launch Config** | Optimal grid/block calculation |
| **Memory Management** | Host-device transfer patterns |
| **Error Handling** | CUDA error checking macros |

## Examples

### Example 1: Compile with Optimization

```bash
/skill cuda-toolkit compile \
  --source matrix_multiply.cu \
  --arch sm_80 \
  --flags "-O3 -use_fast_math" \
  --output matrix_multiply
```

### Example 2: Generate Kernel

```bash
/skill cuda-toolkit generate-kernel \
  --pattern map \
  --input-type "float*" \
  --output-type "float*" \
  --operation "x * 2.0f"
```

### Example 3: Analyze Resources

```bash
/skill cuda-toolkit analyze \
  --binary program \
  --output-format json
```

## Process Integration

### Processes Using This Skill

1. **cuda-kernel-development.js** - Kernel development
2. **cuda-stream-concurrency.js** - Stream management
3. **custom-cuda-operator-development.js** - Custom operators
4. **dynamic-parallelism-implementation.js** - Dynamic parallelism

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CUDA_HOME` | CUDA installation path | `/usr/local/cuda` |
| `CUDA_VISIBLE_DEVICES` | GPU selection | `0` |

## Related Skills

- **nsight-profiler** - Performance profiling
- **cuda-debugging** - Debugging tools
- **warp-primitives** - Low-level optimization

## References

- [CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
- [NVCC Documentation](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/)
- [PTX ISA](https://docs.nvidia.com/cuda/parallel-thread-execution/)

---

**Backlog ID:** SK-001
**Category:** CUDA Development
**Status:** Active
