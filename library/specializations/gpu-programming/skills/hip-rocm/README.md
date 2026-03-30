# HIP/ROCm Skill

## Overview

The `hip-rocm` skill provides AMD HIP and ROCm ecosystem capabilities for cross-platform GPU development targeting AMD GPUs.

## Quick Start

### Prerequisites

1. **ROCm 5.0+** - AMD GPU platform
2. **HIP Runtime** - Portable GPU programming
3. **hipify tools** - CUDA to HIP conversion

### Installation

```bash
# Verify ROCm
rocminfo | head -20

# Check HIP
hipcc --version

# Verify hipify
hipify-perl --version
```

## Usage

### Basic Operations

```bash
# Convert CUDA to HIP
/skill hip-rocm hipify --input kernel.cu --output kernel.cpp

# Compile HIP code
/skill hip-rocm compile --source kernel.cpp --arch gfx90a

# Profile application
/skill hip-rocm profile --program ./app --tool rocprof
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(hipRocmTask, {
  operation: 'hipify',
  inputFiles: ['kernel.cu'],
  targetArch: 'gfx90a',
  optimize: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Hipify** | CUDA to HIP conversion |
| **Compilation** | ROCm toolchain builds |
| **Profiling** | rocprof/omniperf analysis |
| **Libraries** | hipBLAS, rocBLAS, RCCL |

## AMD GPU Architectures

| Architecture | GPU | Codename |
|--------------|-----|----------|
| gfx908 | MI100 | Arcturus |
| gfx90a | MI200 | Aldebaran |
| gfx942 | MI300 | Aqua Vanjaram |

## Key Differences from CUDA

| CUDA | HIP | Notes |
|------|-----|-------|
| Warp (32) | Wavefront (64) | Different parallelism |
| `__syncthreads()` | `__syncthreads()` | Same API |
| cuBLAS | hipBLAS/rocBLAS | Different libraries |
| NCCL | RCCL | Same API |

## Process Integration

1. **hip-porting-cross-platform.js** - Porting workflows
2. **multi-gpu-programming.js** - Multi-GPU development

## Related Skills

- **opencl-runtime** - Cross-vendor alternative
- **cross-platform-gpu-expert** - Portability agent

## References

- [ROCm Documentation](https://rocm.docs.amd.com/)
- [HIP Programming Guide](https://rocm.docs.amd.com/projects/HIP/)
- [Hipify Documentation](https://rocm.docs.amd.com/projects/HIPIFY/)

---

**Backlog ID:** SK-009
**Category:** Cross-Platform
**Status:** Active
