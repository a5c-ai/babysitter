---
name: unreal-control-rig
description: Unreal Engine Control Rig skill for procedural animation, IK chains, and runtime rig modifications.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal Control Rig Skill

Control Rig for procedural animation in Unreal Engine.

## Overview

This skill provides capabilities for implementing procedural animation using Unreal's Control Rig system.

## Capabilities

### Rig Development
- Create Control Rig blueprints
- Implement IK solvers
- Configure FK chains
- Handle rig hierarchies

### Procedural Animation
- Implement look-at systems
- Create foot IK
- Handle hand IK
- Manage aim offsets

### Runtime Modifications
- Modify bones at runtime
- Blend rig outputs
- Handle animation layers
- Manage rig performance

### Integration
- Connect with Animation BP
- Handle anim graph nodes
- Integrate with gameplay
- Support retargeting

## Prerequisites

- Unreal Engine 5.0+
- Control Rig plugin enabled

## Usage Patterns

### Foot IK Setup

```
1. Create Control Rig asset
2. Add foot controls
3. Implement two-bone IK
4. Handle ground detection
5. Apply in Animation BP
```

### Animation Blueprint Integration

```
Animation Graph:
Linked Anim Layers -> Control Rig Node -> Output Pose
```

## Best Practices

1. Use rig for runtime adjustments
2. Profile rig complexity
3. Test with LOD
4. Handle edge cases
5. Document rig setup

## References

- [Control Rig Documentation](https://docs.unrealengine.com/5.0/en-US/control-rig-in-unreal-engine/)
