# OpenCL Runtime Skill

## Overview

The `opencl-runtime` skill provides cross-vendor OpenCL runtime management and kernel development capabilities. It enables portable GPU programming across NVIDIA, AMD, and Intel platforms.

## Quick Start

### Prerequisites

1. **OpenCL SDK** - NVIDIA, AMD, or Intel
2. **OpenCL ICD Loader** - For multi-vendor support
3. **clinfo** - Device enumeration utility

### Installation

```bash
# Verify OpenCL installation
clinfo --list

# Check SDK version
clinfo | grep "OpenCL"
```

## Usage

### Basic Operations

```bash
# Enumerate devices
/skill opencl-runtime enumerate-devices

# Compile kernel
/skill opencl-runtime compile --source kernel.cl --device 0

# Generate portable kernel
/skill opencl-runtime generate-kernel --pattern reduction
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(openclRuntimeTask, {
  operation: 'compile-kernel',
  source: 'kernel.cl',
  options: '-cl-fast-relaxed-math',
  targetPlatform: 'all'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Platform Enumeration** | Query all OpenCL platforms/devices |
| **Kernel Generation** | Portable OpenCL C kernels |
| **Program Compilation** | Build with caching support |
| **Memory Management** | Buffer creation and transfers |
| **Vendor Extensions** | Handle platform-specific features |

## Supported Platforms

| Vendor | SDK | Notes |
|--------|-----|-------|
| NVIDIA | CUDA | Full OpenCL 3.0 support |
| AMD | ROCm/AMDGPU-PRO | OpenCL 2.1+ |
| Intel | oneAPI | OpenCL 3.0 with SYCL |

## Process Integration

1. **opencl-application-development.js** - Application development
2. **hip-porting-cross-platform.js** - Cross-platform porting

## Related Skills

- **hip-rocm** - AMD HIP development
- **vulkan-compute** - Vulkan compute shaders
- **cross-platform-gpu-expert** - Portability agent

## References

- [OpenCL Specification](https://www.khronos.org/opencl/)
- [OpenCL C Language](https://www.khronos.org/registry/OpenCL/specs/3.0-unified/html/OpenCL_C.html)

---

**Backlog ID:** SK-003
**Category:** OpenCL Development
**Status:** Active
