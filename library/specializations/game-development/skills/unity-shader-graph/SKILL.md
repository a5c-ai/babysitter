---
name: unity-shader-graph
description: Unity Shader Graph skill for visual shader authoring, custom nodes, and material effects.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity Shader Graph Skill

Visual shader development using Unity Shader Graph.

## Overview

This skill provides capabilities for creating shaders visually using Unity's Shader Graph, enabling artists and developers to build complex materials without writing code.

## Capabilities

### Visual Authoring
- Create shader graphs for URP/HDRP
- Connect nodes for material logic
- Preview effects in real-time
- Handle shader variants

### Effect Types
- Surface shaders (Lit, Unlit)
- Vertex displacement
- UV manipulation
- Procedural textures

### Custom Development
- Create custom nodes
- Build subgraphs
- Implement shader keywords
- Handle multi-pass rendering

### Material System
- Generate materials from graphs
- Expose material properties
- Handle texture sampling
- Implement triplanar mapping

## Prerequisites

- Unity 2021.3+
- Shader Graph package
- URP or HDRP project

## Usage Patterns

### Common Node Patterns

```
Dissolve Effect:
Noise → Step → Alpha Clip Threshold → Alpha

Rim Lighting:
Fresnel Effect → Multiply → Add Emission

Scrolling UV:
Time → Multiply → Add UV → Sample Texture

Vertex Animation:
Noise → Position Offset → Position
```

### Custom Function Node

```hlsl
// Custom HLSL function for Shader Graph
void MyCustomFunction_float(float3 In, out float3 Out)
{
    Out = In * 2.0;
}
```

## Best Practices

1. Use subgraphs for reusable patterns
2. Minimize texture samples
3. Use shader keywords for variants
4. Profile on target platforms
5. Document exposed properties

## References

- [Shader Graph Documentation](https://docs.unity3d.com/Packages/com.unity.shadergraph@latest)
