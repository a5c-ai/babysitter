# Vulkan Compute Skill

## Overview

The `vulkan-compute` skill provides Vulkan compute shader development and pipeline configuration capabilities. It enables GPU compute operations using the Vulkan API with GLSL/HLSL shaders compiled to SPIR-V.

## Quick Start

### Prerequisites

1. **Vulkan SDK 1.3+** - Vulkan development kit
2. **glslc or glslangValidator** - SPIR-V compiler
3. **SPIRV-Tools** - Optional validation and optimization

### Installation

```bash
# Verify Vulkan SDK
vulkaninfo | head -20

# Verify SPIR-V compiler
glslc --version
```

## Usage

### Basic Operations

```bash
# Compile compute shader
/skill vulkan-compute compile --source shader.glsl --output shader.spv

# Generate shader template
/skill vulkan-compute generate --pattern reduction --workgroup-size 256

# Validate SPIR-V
/skill vulkan-compute validate --spirv shader.spv
```

### Within Babysitter Processes

```javascript
const result = await ctx.task(vulkanComputeTask, {
  operation: 'compile',
  source: 'compute.glsl',
  optimize: true,
  outputFile: 'compute.spv'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Shader Generation** | GLSL compute shader templates |
| **SPIR-V Compilation** | Compile and optimize shaders |
| **Pipeline Setup** | Compute pipeline configuration |
| **Descriptor Sets** | Resource binding management |
| **Synchronization** | Memory barriers and fences |

## Common Patterns

### Parallel Reduction

```glsl
#version 450
layout(local_size_x = 256) in;
// ... reduction implementation
```

### Image Processing

```glsl
#version 450
layout(local_size_x = 16, local_size_y = 16) in;
layout(set = 0, binding = 0, rgba8) uniform image2D img;
```

## Process Integration

1. **compute-shader-development.js** - Shader development workflow

## Related Skills

- **opencl-runtime** - Cross-vendor compute
- **cuda-toolkit** - NVIDIA CUDA development
- **graphics-compute-expert** - Graphics/compute agent

## References

- [Vulkan Specification](https://www.khronos.org/vulkan/)
- [GLSL Specification](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)
- [SPIR-V Specification](https://www.khronos.org/spir/)

---

**Backlog ID:** SK-004
**Category:** Compute Shaders
**Status:** Active
