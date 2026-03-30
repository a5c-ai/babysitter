# Stencil and Convolution Skill

## Overview

The `stencil-convolution` skill provides expert capabilities for optimized stencil and convolution pattern implementations on GPU. It enables efficient neighborhood computations for scientific computing, image processing, and numerical simulations.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 11.0+** - Shared memory features
2. **GPU CC 3.5+** - Basic stencil support
3. **Nsight Compute** - Memory bandwidth analysis
4. **Optional**: cuDNN for optimized convolutions

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

## Usage

### Basic Operations

```bash
# Generate optimized stencil kernel
/skill stencil-convolution generate \
  --type laplacian-2d \
  --radius 1 \
  --boundary replicate

# Generate separable convolution
/skill stencil-convolution generate \
  --type gaussian \
  --radius 3 \
  --separable

# Benchmark stencil performance
/skill stencil-convolution benchmark \
  --kernel stencil.cu \
  --size 4096x4096
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(stencilConvolutionTask, {
  operation: 'generate-optimized-kernel',
  stencilType: 'box-filter',
  dimensions: 2,
  radius: 2,
  boundaryCondition: 'reflect',
  enableTemporalBlocking: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Tiled Stencils** | Shared memory optimization with halos |
| **2D/3D Convolution** | Arbitrary kernel convolution |
| **Separable Filters** | 2-pass optimization for separable kernels |
| **Boundary Handling** | Zero, replicate, reflect, periodic |
| **Temporal Blocking** | Multi-timestep optimization |
| **Performance Analysis** | Memory bandwidth profiling |

## Examples

### Example 1: 5-Point Laplacian Stencil

```bash
# Generate optimized 5-point Laplacian
/skill stencil-convolution generate \
  --type laplacian-2d \
  --tile-size 32x32 \
  --output laplacian_kernel.cu
```

### Example 2: Gaussian Blur (Separable)

```bash
# Generate separable Gaussian blur
/skill stencil-convolution generate \
  --type gaussian \
  --radius 5 \
  --sigma 1.5 \
  --separable \
  --output gaussian_blur.cu
```

### Example 3: 3D Stencil for Simulation

```bash
# Generate 7-point 3D Laplacian
/skill stencil-convolution generate \
  --type laplacian-3d \
  --dimensions 256x256x256 \
  --boundary periodic \
  --output laplacian_3d.cu
```

### Example 4: Performance Benchmark

```bash
# Benchmark stencil implementation
/skill stencil-convolution benchmark \
  --kernel laplacian_kernel.cu \
  --size 4096x4096 \
  --iterations 1000 \
  --compare naive
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STENCIL_TILE_X` | Default tile X dimension | `32` |
| `STENCIL_TILE_Y` | Default tile Y dimension | `32` |
| `STENCIL_BOUNDARY` | Default boundary condition | `replicate` |

### Skill Configuration

```yaml
# .babysitter/skills/stencil-convolution.yaml
stencil-convolution:
  defaults:
    tile_size: [32, 32]
    boundary: replicate
    use_constant_memory: true
  optimization:
    enable_separable: true
    temporal_blocking_timesteps: 4
    shared_memory_padding: 1
```

## Stencil Patterns

### Common Stencil Types

| Type | Points | Use Case |
|------|--------|----------|
| Laplacian 2D | 5 | Heat diffusion, image sharpening |
| Laplacian 3D | 7 | CFD, volume processing |
| Box Filter | 9/25/etc | Image smoothing |
| Sobel | 9 | Edge detection |
| Gaussian | Variable | Blur, smoothing |

### Boundary Conditions

| Condition | Description | Use Case |
|-----------|-------------|----------|
| Zero | Pad with zeros | General purpose |
| Replicate | Extend edge values | Image processing |
| Reflect | Mirror at boundary | Signal processing |
| Periodic | Wrap around | Physical simulations |

## Process Integration

### Processes Using This Skill

1. **stencil-computation-optimization.js** - Stencil workflows
2. **gpu-image-video-processing.js** - Image filtering
3. **parallel-algorithm-design.js** - Algorithm patterns

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const optimizeStencilTask = defineTask({
  name: 'optimize-stencil',
  description: 'Generate optimized stencil implementation',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Generate ${inputs.stencilType} stencil`,
      skill: {
        name: 'stencil-convolution',
        context: {
          operation: 'generate',
          stencilType: inputs.stencilType,
          dimensions: inputs.dimensions,
          radius: inputs.radius,
          boundary: inputs.boundary,
          optimization: {
            tileSize: inputs.tileSize,
            temporalBlocking: inputs.enableTemporalBlocking,
            separable: inputs.enableSeparable
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

## Performance Guidelines

### Memory Bandwidth Efficiency

| Implementation | Efficiency | Notes |
|----------------|------------|-------|
| Naive (global memory) | 10-20% | Poor memory reuse |
| Tiled (shared memory) | 40-60% | Good for small stencils |
| Temporal blocking | 60-80% | Multiple timesteps |
| Separable (2-pass) | 70-90% | For separable kernels |

### Tile Size Selection

```
Recommended tile sizes by stencil radius:
- Radius 1: 32x32
- Radius 2: 32x32 or 24x24
- Radius 3+: 16x16 (shared memory limited)

Formula: (TILE + 2*RADIUS)^2 * sizeof(float) < shared_memory_limit
```

### Optimization Checklist

1. Use shared memory with halo regions
2. Ensure coalesced global memory access
3. Avoid shared memory bank conflicts (add padding)
4. Use constant memory for stencil weights
5. Consider separable implementation
6. Profile actual vs theoretical bandwidth

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Low bandwidth | Non-coalesced access | Align thread access |
| Wrong results at edges | Boundary handling | Check halo loading |
| Bank conflicts | Shared memory layout | Add padding |
| Insufficient shared memory | Large tile/radius | Reduce tile size |

### Profiling Tips

```bash
# Profile memory efficiency with Nsight Compute
ncu --metrics \
  l1tex__t_bytes_pipe_lsu_mem_global_op_ld.sum.per_second,\
  l1tex__t_bytes_pipe_lsu_mem_global_op_st.sum.per_second \
  ./stencil_app
```

## Related Skills

- **gpu-memory-analysis** - Memory access patterns
- **parallel-patterns** - Algorithm patterns
- **cuda-toolkit** - Kernel development

## References

- [NVIDIA CUDA Stencil Examples](https://github.com/NVIDIA/cuda-samples)
- [ENCCS CUDA Training - Stencils](https://enccs.github.io/cuda/)
- [Temporal Blocking Techniques](https://developer.nvidia.com/blog/efficient-stencil-computations-cuda/)
- [cuDNN Convolution](https://docs.nvidia.com/deeplearning/cudnn/api/index.html)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-013
**Category:** Domain Algorithms
**Status:** Active
