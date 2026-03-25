---
name: unreal-niagara
description: Unreal Engine Niagara VFX skill for particle simulations, GPU sprites, and procedural visual effects.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal Niagara Skill

Niagara visual effects system for Unreal Engine.

## Overview

This skill provides capabilities for creating visual effects using Unreal's Niagara system, including particle simulations, GPU particles, and procedural effects.

## Capabilities

### Particle Systems
- Create emitter modules
- Configure spawn, update, render
- Handle particle attributes
- Implement GPU simulation

### Module Development
- Create custom modules
- Implement scratch pad modules
- Handle data interfaces
- Build reusable libraries

### Integration
- Spawn from Blueprints/C++
- Handle events and triggers
- Integrate with gameplay
- Manage performance

### Advanced Features
- Implement mesh particles
- Create ribbon effects
- Handle simulation stages
- Build fluid simulations

## Prerequisites

- Unreal Engine 5.0+
- Niagara plugin enabled

## Usage Patterns

### Spawning Effects

```cpp
// C++ spawn
UNiagaraComponent* NiagaraComp = UNiagaraFunctionLibrary::SpawnSystemAtLocation(
    GetWorld(),
    ExplosionEffect,
    Location,
    Rotation
);

// Set parameters
NiagaraComp->SetVariableFloat(FName("Scale"), 2.0f);
```

### Blueprint Integration

```
1. Add Niagara Component
2. Set Niagara System Asset
3. Call Activate/Deactivate
4. Set User Parameters
5. Handle completion events
```

## Best Practices

1. Use GPU simulation for large counts
2. Create module libraries
3. Profile with Niagara debugger
4. Set scalability settings
5. Use LOD for distant effects

## References

- [Niagara Documentation](https://docs.unrealengine.com/5.0/en-US/visual-effects-in-unreal-engine/)
