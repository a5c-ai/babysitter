---
name: unreal-lumen
description: Unreal Engine Lumen skill for global illumination, reflections, and dynamic lighting.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal Lumen Skill

Lumen global illumination and reflections for Unreal Engine.

## Overview

This skill provides capabilities for implementing Lumen dynamic global illumination and reflections in Unreal Engine.

## Capabilities

### Global Illumination
- Configure Lumen GI settings
- Handle final gather
- Manage infinite bounces
- Optimize trace settings

### Reflections
- Configure reflection method
- Handle screen traces
- Manage reflection captures
- Optimize quality settings

### Integration
- Combine with Nanite
- Handle emissive materials
- Manage sky light
- Configure exposure

### Performance
- Hardware ray tracing option
- Software ray tracing fallback
- Scene complexity handling
- Platform scalability

## Prerequisites

- Unreal Engine 5.0+
- Modern GPU (RTX for HW RT)

## Usage Patterns

### Project Settings

```
Lumen Global Illumination:
- Enable in Project Settings
- Configure final gather quality
- Set trace distance
- Configure scene detail
```

### Post Process Volume

```
1. Add Post Process Volume
2. Enable Infinite Extent
3. Configure Lumen settings
4. Adjust quality per area
```

## Best Practices

1. Use emissive for small lights
2. Keep scenes well-lit
3. Avoid very dark areas
4. Profile with Lumen visualizations
5. Test SW and HW ray tracing

## References

- [Lumen Documentation](https://docs.unrealengine.com/5.0/en-US/lumen-global-illumination-and-reflections-in-unreal-engine/)
