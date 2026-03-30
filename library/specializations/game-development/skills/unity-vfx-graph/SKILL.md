---
name: unity-vfx-graph
description: Unity Visual Effect Graph skill for GPU particle systems, procedural effects, and high-performance visual effects.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity VFX Graph Skill

Visual Effect Graph development for GPU-accelerated particle systems in Unity.

## Overview

This skill provides capabilities for creating high-performance visual effects using Unity's Visual Effect Graph, leveraging GPU compute for millions of particles.

## Capabilities

### Particle Systems
- Create GPU particle systems
- Configure spawn, initialize, update, output contexts
- Handle particle attributes
- Implement particle collision

### Procedural Effects
- Use noise and turbulence
- Implement SDF-based effects
- Create mesh sampling effects
- Build camera-based interactions

### Visual Authoring
- Design effects in VFX Graph editor
- Create subgraphs for reuse
- Implement property sheets
- Build event-driven effects

### Integration
- Connect to C# scripts
- Handle events and parameters
- Integrate with Timeline
- Manage performance budgets

## Prerequisites

- Unity 2021.3+ with VFX Graph package
- SRP (URP or HDRP) project
- Compute shader capable hardware

## Usage Patterns

### Spawning Particles from Code

```csharp
public class VFXController : MonoBehaviour
{
    [SerializeField] private VisualEffect vfx;

    void Start()
    {
        // Set properties
        vfx.SetFloat("SpawnRate", 100f);
        vfx.SetVector3("EmitterPosition", transform.position);
    }

    public void TriggerBurst()
    {
        // Send event
        vfx.SendEvent("OnBurst");
    }
}
```

### Property Binding

```csharp
// Expose VFX properties via C# bindings
vfx.SetInt("ParticleCount", 1000);
vfx.SetGradient("ColorOverLife", gradient);
vfx.SetTexture("ParticleTexture", texture);
```

## Best Practices

1. Use subgraphs for reusable components
2. Profile GPU performance
3. Set particle count limits
4. Use LOD for distant effects
5. Optimize texture sampling

## References

- [VFX Graph Documentation](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@latest)
