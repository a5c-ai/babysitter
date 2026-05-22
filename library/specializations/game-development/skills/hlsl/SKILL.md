---
name: hlsl
description: HLSL shader programming skill for DirectX, compute shaders, and optimization.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
graph:
  domains: [domain:gaming]
  specializations: [specialization:game-development]
  skillAreas: [skill-area:shader-programming, skill-area:graphics-rendering]
  roles: [role:game-developer]
---

# HLSL Skill

HLSL shader programming for DirectX.

## Overview

This skill provides capabilities for writing HLSL shaders for DirectX-based engines.

## Capabilities

- Vertex and pixel shaders
- Compute shaders
- Constant buffer management
- Shader optimization

## Usage Patterns

```hlsl
cbuffer ConstantBuffer : register(b0)
{
    float4x4 WorldViewProj;
}

float4 PSMain(PSInput input) : SV_TARGET
{
    return input.Color;
}
```

## References

- [HLSL Documentation](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/)
