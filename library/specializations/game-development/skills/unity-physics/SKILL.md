---
name: unity-physics
description: Unity Physics skill for collision detection, rigidbody dynamics, raycasting, and physics configuration.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity Physics Skill

Physics system configuration and implementation in Unity.

## Overview

This skill provides capabilities for implementing physics-based gameplay using Unity's physics systems (PhysX 3D and Box2D 2D).

## Capabilities

### Rigidbody Configuration
- Configure mass, drag, constraints
- Set up continuous collision detection
- Handle interpolation modes
- Manage sleep thresholds

### Collision Detection
- Configure colliders and triggers
- Set up collision layers and masks
- Handle collision events
- Implement compound colliders

### Raycasting
- Perform raycasts and spherecasts
- Use overlap tests
- Handle layer filtering
- Batch physics queries

### Physics Settings
- Configure fixed timestep
- Set up solver iterations
- Handle physics materials
- Manage auto-sync transforms

## Prerequisites

- Unity 2021.3+
- Physics module (built-in)

## Usage Patterns

### Rigidbody Setup

```csharp
public class PhysicsObject : MonoBehaviour
{
    private Rigidbody rb;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
        rb.interpolation = RigidbodyInterpolation.Interpolate;
        rb.collisionDetectionMode = CollisionDetectionMode.Continuous;
    }

    void FixedUpdate()
    {
        rb.AddForce(Vector3.forward * 10f, ForceMode.Force);
    }
}
```

### Raycasting

```csharp
public bool CheckGround(out RaycastHit hit)
{
    return Physics.Raycast(
        transform.position,
        Vector3.down,
        out hit,
        1.1f,
        groundLayer,
        QueryTriggerInteraction.Ignore
    );
}
```

## Best Practices

1. Use FixedUpdate for physics
2. Avoid scaling colliders at runtime
3. Use layers for filtering
4. Profile physics queries
5. Consider Physics.autoSyncTransforms

## References

- [Physics Documentation](https://docs.unity3d.com/Manual/PhysicsSection.html)
