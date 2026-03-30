---
name: unreal-nanite
description: Unreal Engine Nanite skill for virtualized geometry, mesh streaming, and LOD-free workflows.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal Nanite Skill

Nanite virtualized geometry system for Unreal Engine.

## Overview

This skill provides capabilities for implementing Nanite virtualized geometry in Unreal Engine, enabling high-fidelity assets without traditional LOD workflows.

## Capabilities

### Mesh Configuration
- Enable Nanite on meshes
- Configure fallback meshes
- Handle displacement
- Manage precision settings

### Streaming
- Configure streaming pool
- Handle mesh streaming
- Manage memory budgets
- Optimize loading

### Integration
- Combine with Lumen
- Handle materials constraints
- Integrate with World Partition
- Manage visibility

### Optimization
- Configure cluster culling
- Handle overdraw
- Manage triangle budgets
- Profile Nanite performance

## Prerequisites

- Unreal Engine 5.0+
- SM5+ capable hardware
- High-poly source meshes

## Usage Patterns

### Enabling Nanite

```
1. Import high-poly mesh
2. Open Static Mesh Editor
3. Enable Nanite in Details panel
4. Configure settings
5. Apply to instances
```

### Settings Configuration

```
Nanite Settings:
- Position Precision: Auto
- Percent Triangles: 100%
- Fallback Relative Error: 1.0
- Displacement: Enabled for terrain
```

## Best Practices

1. Use Nanite for hero assets
2. Keep fallback meshes
3. Monitor GPU memory
4. Test on target hardware
5. Use Nanite Visualizations

## References

- [Nanite Documentation](https://docs.unrealengine.com/5.0/en-US/nanite-virtualized-geometry-in-unreal-engine/)
