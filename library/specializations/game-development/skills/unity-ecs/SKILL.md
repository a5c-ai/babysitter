---
name: unity-ecs
description: Unity DOTS/ECS skill for data-oriented design, jobs system, burst compiler optimization, and high-performance gameplay systems.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity ECS Skill

Data-Oriented Technology Stack (DOTS) and Entity Component System development for Unity.

## Overview

This skill provides capabilities for implementing high-performance gameplay systems using Unity's Entity Component System, Jobs System, and Burst compiler.

## Capabilities

### Entity Component System
- Create IComponentData structs
- Implement ISystem and SystemBase
- Manage entity archetypes
- Handle entity queries and batching

### Jobs System
- Create IJob implementations
- Implement IJobEntity for entity processing
- Handle job dependencies and scheduling
- Manage native containers

### Burst Compiler
- Enable Burst compilation for jobs
- Optimize with SIMD instructions
- Profile Burst-compiled code
- Handle Burst limitations

### Hybrid Workflow
- Bridge ECS with GameObjects
- Use companion components
- Convert existing systems to ECS
- Implement baking workflow

## Prerequisites

- Unity 2022.3+ recommended
- Entities package (1.0+)
- Mathematics package
- Burst package

## Usage Patterns

### Component Data

```csharp
public struct MoveSpeed : IComponentData
{
    public float Value;
}

public struct Velocity : IComponentData
{
    public float3 Value;
}
```

### System Implementation

```csharp
[BurstCompile]
public partial struct MovementSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        foreach (var (transform, velocity) in
            SystemAPI.Query<RefRW<LocalTransform>, RefRO<Velocity>>())
        {
            transform.ValueRW.Position += velocity.ValueRO.Value * deltaTime;
        }
    }
}
```

### Job Example

```csharp
[BurstCompile]
public partial struct MovementJob : IJobEntity
{
    public float DeltaTime;

    void Execute(ref LocalTransform transform, in Velocity velocity)
    {
        transform.Position += velocity.Value * DeltaTime;
    }
}
```

## Best Practices

1. Keep components small and focused
2. Use Burst for all performance-critical jobs
3. Batch entity operations
4. Minimize structural changes
5. Profile with Entity Debugger

## References

- [Unity DOTS Documentation](https://docs.unity3d.com/Packages/com.unity.entities@latest)
- [Burst Manual](https://docs.unity3d.com/Packages/com.unity.burst@latest)
