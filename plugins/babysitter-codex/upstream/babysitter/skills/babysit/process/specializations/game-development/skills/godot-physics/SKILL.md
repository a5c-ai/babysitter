---
name: godot-physics
description: Godot physics skill for rigid bodies, areas, collision layers, and raycasting.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Godot Physics Skill

Physics system implementation for Godot Engine.

## Overview

This skill provides capabilities for implementing physics-based gameplay in Godot.

## Capabilities

- Configure RigidBody2D/3D
- Set up collision layers and masks
- Implement raycasting and shape casting
- Handle Area2D/3D triggers
- Configure physics materials

## Usage Patterns

```gdscript
extends RigidBody2D

func _physics_process(delta):
    var space_state = get_world_2d().direct_space_state
    var query = PhysicsRayQueryParameters2D.create(position, target)
    var result = space_state.intersect_ray(query)
```

## References

- [Godot Physics](https://docs.godotengine.org/en/stable/tutorials/physics/)
