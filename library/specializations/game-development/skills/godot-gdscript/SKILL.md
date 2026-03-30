---
name: godot-gdscript
description: GDScript programming skill for Godot Engine, including signals, coroutines, and performance optimization.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Godot GDScript Skill

GDScript programming for Godot Engine development.

## Overview

This skill provides capabilities for implementing game logic using GDScript, Godot's Python-like scripting language.

## Capabilities

### Language Features
- Classes and inheritance
- Signals and connections
- Coroutines with await
- Static typing

### Node Interaction
- Scene tree navigation
- Node references
- Group management
- Signal connections

### Performance
- Object pooling patterns
- Cache node references
- Optimize loops
- Use typed arrays

### Best Patterns
- State machines
- Singletons (autoload)
- Resource management
- Export variables

## Prerequisites

- Godot 4.0+
- GDScript knowledge

## Usage Patterns

### Signal Pattern

```gdscript
class_name Player extends CharacterBody2D

signal health_changed(new_health: int)
signal died

@export var max_health: int = 100
var health: int = max_health

func take_damage(amount: int) -> void:
    health = max(0, health - amount)
    health_changed.emit(health)
    if health <= 0:
        died.emit()
```

### Coroutine Pattern

```gdscript
func spawn_enemies() -> void:
    for i in range(10):
        spawn_enemy()
        await get_tree().create_timer(1.0).timeout
```

## Best Practices

1. Use static typing
2. Cache node references in _ready
3. Use signals for decoupling
4. Prefer composition over inheritance
5. Profile with built-in profiler

## References

- [GDScript Documentation](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/)
