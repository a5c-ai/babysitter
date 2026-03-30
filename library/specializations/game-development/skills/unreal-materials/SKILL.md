---
name: unreal-materials
description: Unreal Engine Material Editor skill for PBR workflows, material instances, shader complexity, and material functions.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal Materials Skill

Material development using Unreal Engine's Material Editor.

## Overview

This skill provides capabilities for creating materials in Unreal Engine, including PBR workflows, material instances, and custom shader development.

## Capabilities

### Material Creation
- Build PBR materials
- Configure material domains
- Handle blend modes
- Manage material properties

### Material Instances
- Create instance hierarchies
- Expose parameters
- Handle static switches
- Manage instance overrides

### Material Functions
- Create reusable functions
- Build material layers
- Handle function inputs
- Manage function libraries

### Advanced Techniques
- World position offset
- Pixel depth offset
- Custom UV manipulation
- Subsurface scattering

## Prerequisites

- Unreal Engine 5.0+
- Material Editor knowledge

## Usage Patterns

### Material Parameter Setup

```
1. Create Material Parameter Collection
2. Define scalar/vector parameters
3. Reference in materials
4. Update from Blueprint/C++
```

### Material Instance Dynamic

```cpp
UMaterialInstanceDynamic* DynMat =
    UMaterialInstanceDynamic::Create(BaseMaterial, this);
DynMat->SetScalarParameterValue(FName("Damage"), DamageAmount);
MeshComponent->SetMaterial(0, DynMat);
```

### Material Layers

```
1. Create Material Layer asset
2. Define layer parameters
3. Create Material Layer Blend
4. Configure blending
5. Use in Material
```

## Best Practices

1. Use material instances for variants
2. Create material functions for reuse
3. Monitor shader complexity
4. Use LOD material switching
5. Profile with GPU visualizer

## References

- [Material Documentation](https://docs.unrealengine.com/5.0/en-US/unreal-engine-materials/)
