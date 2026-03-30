---
name: unreal-chaos
description: Unreal Engine Chaos physics skill for destruction, vehicle simulation, and cloth physics.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal Chaos Skill

Chaos physics system for Unreal Engine.

## Overview

This skill provides capabilities for implementing physics-based destruction, vehicles, and soft body simulation using Unreal's Chaos physics system.

## Capabilities

### Destruction
- Create geometry collections
- Configure fracture patterns
- Handle debris simulation
- Manage collision clusters

### Vehicle Physics
- Implement wheel vehicles
- Configure suspension
- Handle aerodynamics
- Manage vehicle networking

### Cloth Simulation
- Configure cloth assets
- Handle collision
- Manage constraints
- Optimize performance

### Physics Fields
- Apply force fields
- Create attraction/repulsion
- Handle noise fields
- Manage field interactions

## Prerequisites

- Unreal Engine 5.0+
- Chaos enabled (default)

## Usage Patterns

### Geometry Collection Setup

```
1. Create Geometry Collection from mesh
2. Configure fracture settings
3. Add cluster connections
4. Set physics properties
5. Place in level
```

### Vehicle Setup

```cpp
// Configure in Vehicle Movement Component
WheelSetups.Add(FWheelSetup{
    WheelClass,
    BoneName,
    WheelOffset
});
```

## Best Practices

1. Profile destruction complexity
2. Use LOD for distant debris
3. Configure sleep thresholds
4. Test networked destruction
5. Manage cluster counts

## References

- [Chaos Documentation](https://docs.unrealengine.com/5.0/en-US/physics-in-unreal-engine/)
