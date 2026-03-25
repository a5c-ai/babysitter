---
name: stencil-convolution
description: Expert skill for optimized stencil and convolution pattern implementations on GPU. Design tiled stencil algorithms with halos, implement 2D/3D convolution kernels, optimize boundary condition handling, apply temporal blocking techniques, generate separable filter implementations, and profile stencil memory bandwidth.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: domain-algorithms
  backlog-id: SK-013
---

# stencil-convolution

You are **stencil-convolution** - a specialized skill for optimized stencil and convolution pattern implementations on GPU. This skill provides expert capabilities for scientific computing, image processing, and numerical simulations requiring neighborhood computations.

## Overview

This skill enables AI-powered stencil and convolution operations including:
- Designing tiled stencil algorithms with halos
- Implementing 2D/3D convolution kernels
- Optimizing boundary condition handling
- Applying temporal blocking techniques
- Generating separable filter implementations
- Configuring shared memory tiling strategies
- Profiling stencil memory bandwidth
- Supporting multi-resolution stencils

## Prerequisites

- NVIDIA CUDA Toolkit 11.0+
- GPU with compute capability 3.5+
- Understanding of memory coalescing patterns
- Nsight Compute for memory analysis
- Optional: cuDNN for optimized convolutions

## Capabilities

### 1. Basic 2D Stencil (5-Point Laplacian)

```cuda
// Naive 5-point stencil (for comparison)
__global__ void laplacian2D_naive(
    float* out, const float* in,
    int width, int height
) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;

    if (x >= 1 && x < width - 1 && y >= 1 && y < height - 1) {
        int idx = y * width + x;
        out[idx] = -4.0f * in[idx]
                 + in[idx - 1]      // left
                 + in[idx + 1]      // right
                 + in[idx - width]  // up
                 + in[idx + width]; // down
    }
}
```

### 2. Tiled Stencil with Shared Memory and Halo

```cuda
#define TILE_X 32
#define TILE_Y 32
#define HALO 1

__global__ void laplacian2D_tiled(
    float* out, const float* in,
    int width, int height
) {
    // Shared memory with halo
    __shared__ float tile[TILE_Y + 2 * HALO][TILE_X + 2 * HALO];

    // Global coordinates
    int gx = blockIdx.x * TILE_X + threadIdx.x;
    int gy = blockIdx.y * TILE_Y + threadIdx.y;

    // Local coordinates in shared memory (offset by halo)
    int lx = threadIdx.x + HALO;
    int ly = threadIdx.y + HALO;

    // Load center tile
    if (gx < width && gy < height) {
        tile[ly][lx] = in[gy * width + gx];
    }

    // Load halo regions
    // Left halo
    if (threadIdx.x < HALO && gx >= HALO) {
        tile[ly][lx - HALO] = in[gy * width + (gx - HALO)];
    }
    // Right halo
    if (threadIdx.x >= TILE_X - HALO && gx + HALO < width) {
        tile[ly][lx + HALO] = in[gy * width + (gx + HALO)];
    }
    // Top halo
    if (threadIdx.y < HALO && gy >= HALO) {
        tile[ly - HALO][lx] = in[(gy - HALO) * width + gx];
    }
    // Bottom halo
    if (threadIdx.y >= TILE_Y - HALO && gy + HALO < height) {
        tile[ly + HALO][lx] = in[(gy + HALO) * width + gx];
    }

    // Corner halos (if needed for larger stencils)
    // ...

    __syncthreads();

    // Compute stencil using shared memory
    if (gx >= 1 && gx < width - 1 && gy >= 1 && gy < height - 1) {
        out[gy * width + gx] = -4.0f * tile[ly][lx]
                             + tile[ly][lx - 1]
                             + tile[ly][lx + 1]
                             + tile[ly - 1][lx]
                             + tile[ly + 1][lx];
    }
}
```

### 3. Generic N-Point Stencil with Configurable Radius

```cuda
template <int RADIUS>
__global__ void stencil2D_generic(
    float* out, const float* in,
    const float* weights,  // Stencil weights
    int width, int height
) {
    extern __shared__ float tile[];

    const int TILE_X = blockDim.x;
    const int TILE_Y = blockDim.y;
    const int TILE_PITCH = TILE_X + 2 * RADIUS;

    int gx = blockIdx.x * TILE_X + threadIdx.x;
    int gy = blockIdx.y * TILE_Y + threadIdx.y;

    int lx = threadIdx.x + RADIUS;
    int ly = threadIdx.y + RADIUS;

    // Load tile with halos
    // ... (similar to above but generic)

    __syncthreads();

    if (gx >= RADIUS && gx < width - RADIUS &&
        gy >= RADIUS && gy < height - RADIUS) {

        float result = 0.0f;
        int wIdx = 0;

        // Apply stencil weights
        for (int dy = -RADIUS; dy <= RADIUS; dy++) {
            for (int dx = -RADIUS; dx <= RADIUS; dx++) {
                result += weights[wIdx++] * tile[(ly + dy) * TILE_PITCH + (lx + dx)];
            }
        }

        out[gy * width + gx] = result;
    }
}
```

### 4. 2D Convolution with Arbitrary Kernel

```cuda
#define CONV_TILE_X 32
#define CONV_TILE_Y 32
#define MAX_KERNEL_RADIUS 8

// Kernel weights in constant memory for fast access
__constant__ float c_kernel[(2 * MAX_KERNEL_RADIUS + 1) * (2 * MAX_KERNEL_RADIUS + 1)];

__global__ void convolution2D(
    float* out, const float* in,
    int width, int height,
    int kernelRadius
) {
    extern __shared__ float tile[];

    int TILE_PITCH = CONV_TILE_X + 2 * kernelRadius;

    int gx = blockIdx.x * CONV_TILE_X + threadIdx.x;
    int gy = blockIdx.y * CONV_TILE_Y + threadIdx.y;

    int lx = threadIdx.x + kernelRadius;
    int ly = threadIdx.y + kernelRadius;

    // Load center
    if (gx < width && gy < height) {
        tile[ly * TILE_PITCH + lx] = in[gy * width + gx];
    } else {
        tile[ly * TILE_PITCH + lx] = 0.0f;  // Zero padding
    }

    // Load halos with boundary handling
    // Left
    if (threadIdx.x < kernelRadius) {
        int srcX = gx - kernelRadius;
        tile[ly * TILE_PITCH + (lx - kernelRadius)] =
            (srcX >= 0 && gy < height) ? in[gy * width + srcX] : 0.0f;
    }
    // Right
    if (threadIdx.x >= CONV_TILE_X - kernelRadius) {
        int srcX = gx + kernelRadius;
        tile[ly * TILE_PITCH + (lx + kernelRadius)] =
            (srcX < width && gy < height) ? in[gy * width + srcX] : 0.0f;
    }
    // Top and bottom (similar pattern)
    // ...

    __syncthreads();

    if (gx < width && gy < height) {
        float sum = 0.0f;
        int kernelSize = 2 * kernelRadius + 1;

        for (int ky = -kernelRadius; ky <= kernelRadius; ky++) {
            for (int kx = -kernelRadius; kx <= kernelRadius; kx++) {
                int kidx = (ky + kernelRadius) * kernelSize + (kx + kernelRadius);
                sum += c_kernel[kidx] * tile[(ly + ky) * TILE_PITCH + (lx + kx)];
            }
        }

        out[gy * width + gx] = sum;
    }
}
```

### 5. Separable Convolution (2-Pass for Performance)

```cuda
// Separable convolution is faster: O(2*r) vs O(r^2)
// First pass: horizontal convolution
__global__ void convolutionRow(
    float* out, const float* in,
    int width, int height, int radius
) {
    extern __shared__ float tile[];

    int gx = blockIdx.x * blockDim.x + threadIdx.x;
    int gy = blockIdx.y;

    int TILE_WIDTH = blockDim.x + 2 * radius;
    int lx = threadIdx.x + radius;

    // Load with halos
    if (gx < width) {
        tile[lx] = in[gy * width + gx];
    }
    if (threadIdx.x < radius) {
        tile[threadIdx.x] = (gx >= radius) ? in[gy * width + gx - radius] : 0.0f;
        tile[lx + blockDim.x] = (gx + blockDim.x < width) ?
            in[gy * width + gx + blockDim.x] : 0.0f;
    }

    __syncthreads();

    if (gx < width) {
        float sum = 0.0f;
        for (int k = -radius; k <= radius; k++) {
            sum += c_kernelRow[k + radius] * tile[lx + k];
        }
        out[gy * width + gx] = sum;
    }
}

// Second pass: vertical convolution
__global__ void convolutionColumn(
    float* out, const float* in,
    int width, int height, int radius
) {
    extern __shared__ float tile[];

    int gx = blockIdx.x;
    int gy = blockIdx.y * blockDim.y + threadIdx.y;

    int TILE_HEIGHT = blockDim.y + 2 * radius;
    int ly = threadIdx.y + radius;

    // Load with halos
    if (gy < height) {
        tile[ly] = in[gy * width + gx];
    }
    if (threadIdx.y < radius) {
        tile[threadIdx.y] = (gy >= radius) ? in[(gy - radius) * width + gx] : 0.0f;
        tile[ly + blockDim.y] = (gy + blockDim.y < height) ?
            in[(gy + blockDim.y) * width + gx] : 0.0f;
    }

    __syncthreads();

    if (gy < height) {
        float sum = 0.0f;
        for (int k = -radius; k <= radius; k++) {
            sum += c_kernelCol[k + radius] * tile[ly + k];
        }
        out[gy * width + gx] = sum;
    }
}
```

### 6. 3D Stencil (7-Point Laplacian)

```cuda
#define TILE_X 16
#define TILE_Y 16
#define TILE_Z 4

__global__ void laplacian3D(
    float* out, const float* in,
    int nx, int ny, int nz
) {
    __shared__ float current[TILE_Y + 2][TILE_X + 2];
    __shared__ float above[TILE_Y][TILE_X];
    __shared__ float below[TILE_Y][TILE_X];

    int gx = blockIdx.x * TILE_X + threadIdx.x;
    int gy = blockIdx.y * TILE_Y + threadIdx.y;
    int gz = blockIdx.z * TILE_Z;

    int lx = threadIdx.x + 1;
    int ly = threadIdx.y + 1;

    // Process TILE_Z planes
    for (int z = gz; z < min(gz + TILE_Z, nz - 1); z++) {
        if (z == 0) continue;

        // Load current plane with halos
        if (gx < nx && gy < ny) {
            current[ly][lx] = in[z * ny * nx + gy * nx + gx];
        }

        // Load halos
        if (threadIdx.x == 0 && gx > 0) {
            current[ly][0] = in[z * ny * nx + gy * nx + (gx - 1)];
        }
        if (threadIdx.x == TILE_X - 1 && gx < nx - 1) {
            current[ly][TILE_X + 1] = in[z * ny * nx + gy * nx + (gx + 1)];
        }
        if (threadIdx.y == 0 && gy > 0) {
            current[0][lx] = in[z * ny * nx + (gy - 1) * nx + gx];
        }
        if (threadIdx.y == TILE_Y - 1 && gy < ny - 1) {
            current[TILE_Y + 1][lx] = in[z * ny * nx + (gy + 1) * nx + gx];
        }

        // Load above and below planes
        if (gx < nx && gy < ny) {
            above[threadIdx.y][threadIdx.x] = in[(z + 1) * ny * nx + gy * nx + gx];
            below[threadIdx.y][threadIdx.x] = in[(z - 1) * ny * nx + gy * nx + gx];
        }

        __syncthreads();

        // Compute 7-point stencil
        if (gx >= 1 && gx < nx - 1 && gy >= 1 && gy < ny - 1) {
            out[z * ny * nx + gy * nx + gx] =
                -6.0f * current[ly][lx]
                + current[ly][lx - 1]   // x-1
                + current[ly][lx + 1]   // x+1
                + current[ly - 1][lx]   // y-1
                + current[ly + 1][lx]   // y+1
                + above[threadIdx.y][threadIdx.x]    // z+1
                + below[threadIdx.y][threadIdx.x];   // z-1
        }

        __syncthreads();
    }
}
```

### 7. Temporal Blocking (Multi-Timestep)

```cuda
// Process multiple timesteps before writing back to global memory
template <int TIMESTEPS>
__global__ void stencil_temporal_blocking(
    float* out, const float* in,
    int width, int height
) {
    // Larger shared memory to accommodate temporal expansion
    // Each timestep expands the halo by 1
    const int HALO = TIMESTEPS;
    extern __shared__ float smem[];

    float* current = smem;
    float* next = smem + (blockDim.y + 2 * HALO) * (blockDim.x + 2 * HALO);

    // Load initial data with expanded halo
    // ...

    __syncthreads();

    // Multiple timesteps in shared memory
    for (int t = 0; t < TIMESTEPS; t++) {
        int shrinkHalo = TIMESTEPS - t - 1;
        int validXStart = shrinkHalo;
        int validXEnd = blockDim.x + 2 * HALO - shrinkHalo;
        int validYStart = shrinkHalo;
        int validYEnd = blockDim.y + 2 * HALO - shrinkHalo;

        int lx = threadIdx.x + HALO;
        int ly = threadIdx.y + HALO;

        // Only threads in valid region compute
        if (lx >= validXStart + 1 && lx < validXEnd - 1 &&
            ly >= validYStart + 1 && ly < validYEnd - 1) {

            int PITCH = blockDim.x + 2 * HALO;
            next[ly * PITCH + lx] = -4.0f * current[ly * PITCH + lx]
                                  + current[ly * PITCH + lx - 1]
                                  + current[ly * PITCH + lx + 1]
                                  + current[(ly - 1) * PITCH + lx]
                                  + current[(ly + 1) * PITCH + lx];
        }

        __syncthreads();

        // Swap buffers
        float* temp = current;
        current = next;
        next = temp;

        __syncthreads();
    }

    // Write final result to global memory
    // ...
}
```

### 8. Boundary Condition Patterns

```cuda
// Different boundary condition strategies
enum BoundaryCondition {
    BC_ZERO,       // Zero padding
    BC_REPLICATE,  // Replicate edge values
    BC_REFLECT,    // Mirror reflection
    BC_PERIODIC    // Wrap around
};

__device__ inline int applyBoundary(int idx, int size, BoundaryCondition bc) {
    if (idx >= 0 && idx < size) return idx;

    switch (bc) {
        case BC_ZERO:
            return -1;  // Signal to use zero
        case BC_REPLICATE:
            return (idx < 0) ? 0 : size - 1;
        case BC_REFLECT:
            if (idx < 0) return -idx - 1;
            if (idx >= size) return 2 * size - idx - 1;
            return idx;
        case BC_PERIODIC:
            return ((idx % size) + size) % size;
        default:
            return idx;
    }
}

__device__ inline float loadWithBoundary(
    const float* data, int x, int y,
    int width, int height, BoundaryCondition bc
) {
    int bx = applyBoundary(x, width, bc);
    int by = applyBoundary(y, height, bc);

    if (bx < 0 || by < 0) return 0.0f;

    return data[by * width + bx];
}
```

## Best Practices

### Memory Access Patterns

| Pattern | Impact | Recommendation |
|---------|--------|----------------|
| Coalesced global reads | High | Align thread access to memory layout |
| Shared memory bank conflicts | Medium | Pad shared memory arrays |
| Halo loading efficiency | Medium | Use cooperative loading |

### Tile Size Selection

| GPU Architecture | Recommended Tile Size |
|-----------------|----------------------|
| Volta/Turing | 32x32 or 16x16 |
| Ampere | 32x32 |
| Hopper | 32x32 or 64x32 |

### Performance Tips

1. **Use constant memory** for stencil weights
2. **Maximize data reuse** in shared memory
3. **Consider separable filters** for 2D convolutions
4. **Temporal blocking** for iterative stencils
5. **Profile memory bandwidth** - stencils are memory-bound

## Process Integration

This skill integrates with the following processes:
- `stencil-computation-optimization.js` - Stencil optimization workflows
- `gpu-image-video-processing.js` - Image filtering
- `parallel-algorithm-design.js` - Algorithm patterns

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "generate-stencil",
  "status": "success",
  "stencil": {
    "type": "2D",
    "points": 5,
    "radius": 1,
    "boundary": "replicate"
  },
  "optimization": {
    "tile_size": [32, 32],
    "shared_memory_bytes": 4624,
    "halo_size": 1,
    "temporal_blocking": false
  },
  "performance": {
    "achieved_bandwidth_gbps": 850,
    "peak_bandwidth_gbps": 1555,
    "efficiency_percent": 54.7
  },
  "recommendations": [
    "Consider separable implementation for Gaussian filter",
    "Temporal blocking could reduce memory traffic by 2x"
  ],
  "artifacts": ["stencil_kernel.cu", "benchmark_results.json"]
}
```

## Constraints

- Stencils are typically memory-bandwidth bound
- Shared memory limits tile size
- Boundary handling adds complexity
- 3D stencils have higher memory requirements
- Profile to ensure memory coalescing
