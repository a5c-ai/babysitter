---
name: vulkan-compute
description: Vulkan compute shader development and pipeline configuration. Generate GLSL/HLSL compute shaders, compile to SPIR-V, configure compute pipelines, manage descriptor sets and resource bindings, implement memory barriers and synchronization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: compute-shaders
  backlog-id: SK-004
---

# vulkan-compute

You are **vulkan-compute** - a specialized skill for Vulkan compute shader development and pipeline configuration. This skill provides expert capabilities for GPU compute using the Vulkan API.

## Overview

This skill enables AI-powered Vulkan compute operations including:
- Generate GLSL/HLSL compute shaders
- Compile shaders to SPIR-V bytecode
- Configure Vulkan compute pipelines
- Manage descriptor sets and resource bindings
- Handle push constants and specialization constants
- Configure workgroup dimensions and dispatch
- Implement memory barriers and synchronization
- Support Vulkan validation layers for debugging

## Prerequisites

- Vulkan SDK 1.3+
- glslangValidator or glslc (SPIR-V compiler)
- SPIRV-Tools (optional)
- Vulkan-capable GPU

## Capabilities

### 1. GLSL Compute Shader Generation

Generate GLSL compute shaders:

```glsl
#version 450

// Workgroup size specification
layout(local_size_x = 256, local_size_y = 1, local_size_z = 1) in;

// Buffer bindings
layout(set = 0, binding = 0) readonly buffer InputBuffer {
    float inputData[];
};

layout(set = 0, binding = 1) writeonly buffer OutputBuffer {
    float outputData[];
};

// Push constants for runtime parameters
layout(push_constant) uniform PushConstants {
    uint dataSize;
    float multiplier;
} pc;

void main() {
    uint gid = gl_GlobalInvocationID.x;

    if (gid < pc.dataSize) {
        outputData[gid] = inputData[gid] * pc.multiplier;
    }
}
```

### 2. SPIR-V Compilation

Compile shaders to SPIR-V:

```bash
# Using glslangValidator
glslangValidator -V compute.glsl -o compute.spv

# Using glslc (Google's compiler)
glslc -fshader-stage=compute compute.glsl -o compute.spv

# With optimization
glslc -O compute.glsl -o compute.spv

# Generate human-readable SPIR-V
spirv-dis compute.spv -o compute.spvasm

# Validate SPIR-V
spirv-val compute.spv

# Optimize SPIR-V
spirv-opt -O compute.spv -o compute_opt.spv
```

### 3. Compute Pipeline Creation

Create Vulkan compute pipelines:

```c
// Load SPIR-V shader
VkShaderModuleCreateInfo shaderInfo = {
    .sType = VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO,
    .codeSize = spirvSize,
    .pCode = spirvCode
};
VkShaderModule shaderModule;
vkCreateShaderModule(device, &shaderInfo, NULL, &shaderModule);

// Pipeline layout with descriptor set and push constants
VkPushConstantRange pushConstantRange = {
    .stageFlags = VK_SHADER_STAGE_COMPUTE_BIT,
    .offset = 0,
    .size = sizeof(PushConstants)
};

VkPipelineLayoutCreateInfo layoutInfo = {
    .sType = VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO,
    .setLayoutCount = 1,
    .pSetLayouts = &descriptorSetLayout,
    .pushConstantRangeCount = 1,
    .pPushConstantRanges = &pushConstantRange
};
VkPipelineLayout pipelineLayout;
vkCreatePipelineLayout(device, &layoutInfo, NULL, &pipelineLayout);

// Create compute pipeline
VkComputePipelineCreateInfo pipelineInfo = {
    .sType = VK_STRUCTURE_TYPE_COMPUTE_PIPELINE_CREATE_INFO,
    .stage = {
        .sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO,
        .stage = VK_SHADER_STAGE_COMPUTE_BIT,
        .module = shaderModule,
        .pName = "main"
    },
    .layout = pipelineLayout
};
VkPipeline computePipeline;
vkCreateComputePipelines(device, VK_NULL_HANDLE, 1, &pipelineInfo, NULL, &computePipeline);
```

### 4. Descriptor Set Management

Configure resource bindings:

```c
// Descriptor set layout
VkDescriptorSetLayoutBinding bindings[] = {
    {
        .binding = 0,
        .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
        .descriptorCount = 1,
        .stageFlags = VK_SHADER_STAGE_COMPUTE_BIT
    },
    {
        .binding = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
        .descriptorCount = 1,
        .stageFlags = VK_SHADER_STAGE_COMPUTE_BIT
    }
};

VkDescriptorSetLayoutCreateInfo layoutInfo = {
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO,
    .bindingCount = 2,
    .pBindings = bindings
};
VkDescriptorSetLayout descriptorSetLayout;
vkCreateDescriptorSetLayout(device, &layoutInfo, NULL, &descriptorSetLayout);

// Allocate and update descriptor set
VkDescriptorBufferInfo inputBufferInfo = {
    .buffer = inputBuffer,
    .offset = 0,
    .range = VK_WHOLE_SIZE
};

VkDescriptorBufferInfo outputBufferInfo = {
    .buffer = outputBuffer,
    .offset = 0,
    .range = VK_WHOLE_SIZE
};

VkWriteDescriptorSet writes[] = {
    {
        .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .dstSet = descriptorSet,
        .dstBinding = 0,
        .descriptorCount = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
        .pBufferInfo = &inputBufferInfo
    },
    {
        .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .dstSet = descriptorSet,
        .dstBinding = 1,
        .descriptorCount = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
        .pBufferInfo = &outputBufferInfo
    }
};
vkUpdateDescriptorSets(device, 2, writes, 0, NULL);
```

### 5. Specialization Constants

Runtime shader customization:

```glsl
// In shader
layout(constant_id = 0) const uint WORKGROUP_SIZE = 256;
layout(constant_id = 1) const bool USE_FAST_MATH = false;

layout(local_size_x_id = 0) in;
```

```c
// In C code
VkSpecializationMapEntry entries[] = {
    {0, 0, sizeof(uint32_t)},  // WORKGROUP_SIZE
    {1, sizeof(uint32_t), sizeof(VkBool32)}  // USE_FAST_MATH
};

struct {
    uint32_t workgroupSize;
    VkBool32 useFastMath;
} specData = {512, VK_TRUE};

VkSpecializationInfo specInfo = {
    .mapEntryCount = 2,
    .pMapEntries = entries,
    .dataSize = sizeof(specData),
    .pData = &specData
};

// Use in pipeline creation
pipelineInfo.stage.pSpecializationInfo = &specInfo;
```

### 6. Compute Dispatch

Execute compute work:

```c
// Record command buffer
vkCmdBindPipeline(commandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, computePipeline);
vkCmdBindDescriptorSets(commandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE,
    pipelineLayout, 0, 1, &descriptorSet, 0, NULL);
vkCmdPushConstants(commandBuffer, pipelineLayout, VK_SHADER_STAGE_COMPUTE_BIT,
    0, sizeof(PushConstants), &pushConstants);

// Dispatch
uint32_t groupCountX = (dataSize + 255) / 256;
vkCmdDispatch(commandBuffer, groupCountX, 1, 1);

// Indirect dispatch
vkCmdDispatchIndirect(commandBuffer, indirectBuffer, 0);
```

### 7. Memory Barriers and Synchronization

Proper synchronization:

```c
// Buffer memory barrier
VkBufferMemoryBarrier barrier = {
    .sType = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER,
    .srcAccessMask = VK_ACCESS_SHADER_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_SHADER_READ_BIT,
    .srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
    .buffer = buffer,
    .offset = 0,
    .size = VK_WHOLE_SIZE
};

vkCmdPipelineBarrier(commandBuffer,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,
    0, 0, NULL, 1, &barrier, 0, NULL);

// Memory barrier for compute-to-transfer
VkMemoryBarrier memoryBarrier = {
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER,
    .srcAccessMask = VK_ACCESS_SHADER_WRITE_BIT,
    .dstAccessMask = VK_ACCESS_TRANSFER_READ_BIT
};

vkCmdPipelineBarrier(commandBuffer,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,
    VK_PIPELINE_STAGE_TRANSFER_BIT,
    0, 1, &memoryBarrier, 0, NULL, 0, NULL);
```

### 8. Validation Layers

Debug with validation:

```c
// Enable validation layers
const char* validationLayers[] = {
    "VK_LAYER_KHRONOS_validation"
};

VkInstanceCreateInfo createInfo = {
    .enabledLayerCount = 1,
    .ppEnabledLayerNames = validationLayers
};

// Debug messenger callback
VkDebugUtilsMessengerCreateInfoEXT debugInfo = {
    .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_MESSENGER_CREATE_INFO_EXT,
    .messageSeverity = VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT |
                       VK_DEBUG_UTILS_MESSAGE_SEVERITY_ERROR_BIT_EXT,
    .messageType = VK_DEBUG_UTILS_MESSAGE_TYPE_VALIDATION_BIT_EXT |
                   VK_DEBUG_UTILS_MESSAGE_TYPE_PERFORMANCE_BIT_EXT,
    .pfnUserCallback = debugCallback
};
```

## Process Integration

This skill integrates with the following processes:
- `compute-shader-development.js` - Compute shader workflows

## Output Format

```json
{
  "operation": "compile-shader",
  "status": "success",
  "input": "compute.glsl",
  "output": "compute.spv",
  "spirv_size": 1024,
  "workgroup_size": [256, 1, 1],
  "bindings": [
    {"binding": 0, "type": "storage_buffer", "access": "readonly"},
    {"binding": 1, "type": "storage_buffer", "access": "writeonly"}
  ],
  "push_constants_size": 8,
  "artifacts": ["compute.spv", "compute.spvasm"]
}
```

## Dependencies

- Vulkan SDK 1.3+
- glslangValidator or glslc
- SPIRV-Tools (optional)

## Constraints

- Workgroup size limited by device (usually 1024 threads)
- Descriptor set count limited (usually 4)
- Push constant size limited (128+ bytes)
- SPIR-V version must match Vulkan version
