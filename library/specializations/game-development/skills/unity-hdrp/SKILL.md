---
name: unity-hdrp
description: High Definition Render Pipeline configuration for Unity, including ray tracing, volumetric effects, and high-fidelity graphics setup.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity HDRP Skill

High Definition Render Pipeline configuration for high-fidelity graphics in Unity.

## Overview

This skill provides capabilities for configuring and extending Unity's High Definition Render Pipeline, enabling ray tracing, volumetric effects, and AAA-quality graphics.

## Capabilities

### Pipeline Configuration
- Configure HDRP Asset quality settings
- Set up frame settings and render features
- Manage diffusion profiles and materials
- Configure volume framework

### Ray Tracing
- Enable ray-traced reflections and GI
- Configure ray-traced ambient occlusion
- Set up ray-traced shadows
- Implement path tracing for offline rendering

### Volumetric Effects
- Configure volumetric fog and lighting
- Set up atmospheric scattering
- Implement volumetric clouds
- Create god ray effects

### Material System
- Create HDRP Lit materials
- Configure subsurface scattering
- Set up fabric and hair shaders
- Implement decal projectors

### Lighting
- Configure physical light units
- Set up area lights and line lights
- Implement sky systems
- Configure reflection probes

## Prerequisites

- Unity 2021.3+ with HDRP package
- DirectX 12 / Vulkan capable hardware
- For ray tracing: RTX 2000+ or equivalent

## Usage Patterns

### HDRP Material Setup

```csharp
// Configure HDRP Lit material
var material = new Material(Shader.Find("HDRP/Lit"));
material.SetFloat("_Metallic", 0.8f);
material.SetFloat("_Smoothness", 0.9f);
material.EnableKeyword("_NORMALMAP");
```

### Volume Configuration

```
1. Create Volume (Global or Local)
2. Add Volume Profile
3. Add overrides (Fog, Exposure, etc.)
4. Configure priority and blend distance
```

## Best Practices

1. Use physical light units for realistic lighting
2. Profile ray tracing performance early
3. Create LOD settings for volumetric effects
4. Use HDRP Wizard for project setup
5. Test on target hardware frequently

## References

- [HDRP Documentation](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@latest)
- [Ray Tracing in HDRP](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@latest/index.html?subfolder=/manual/Ray-Tracing-Getting-Started.html)
