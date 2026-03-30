---
name: glsl
description: GLSL shader programming skill for OpenGL/Vulkan, fragment and vertex shaders.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# GLSL Skill

GLSL shader programming for OpenGL/Vulkan.

## Overview

This skill provides capabilities for writing GLSL shaders.

## Capabilities

- Vertex and fragment shaders
- Geometry shaders
- Uniform handling
- Cross-platform shading

## Usage Patterns

```glsl
#version 450

layout(location = 0) in vec3 position;
layout(location = 0) out vec4 fragColor;

uniform mat4 mvp;

void main() {
    gl_Position = mvp * vec4(position, 1.0);
}
```

## References

- [GLSL Specification](https://www.khronos.org/opengl/wiki/Core_Language_(GLSL))
