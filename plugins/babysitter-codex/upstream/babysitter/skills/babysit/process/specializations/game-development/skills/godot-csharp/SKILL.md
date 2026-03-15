---
name: godot-csharp
description: Godot C# programming skill for .NET integration, scripting patterns, and performance optimization.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Godot C# Skill

C# programming for Godot Engine development.

## Overview

This skill provides capabilities for implementing game logic using C# in Godot, leveraging .NET integration.

## Capabilities

### C# Integration
- Node class inheritance
- Attribute-based exports
- Signal definitions
- Callable system

### .NET Features
- NuGet packages
- Async/await patterns
- LINQ queries
- .NET libraries

### Interoperability
- Call GDScript from C#
- Expose to GDScript
- Handle Variant types
- Manage signals

### Performance
- Struct usage
- Memory management
- Object pooling
- Span usage

## Prerequisites

- Godot 4.0+ with .NET support
- .NET SDK installed
- C# IDE (VS Code, Rider)

## Usage Patterns

### Node Script

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    [Export]
    public float Speed { get; set; } = 200f;

    [Signal]
    public delegate void HealthChangedEventHandler(int newHealth);

    private int _health = 100;

    public override void _Ready()
    {
        // Initialize
    }

    public override void _PhysicsProcess(double delta)
    {
        var velocity = Vector2.Zero;
        velocity.X = Input.GetAxis("move_left", "move_right");
        velocity.Y = Input.GetAxis("move_up", "move_down");
        Velocity = velocity.Normalized() * Speed;
        MoveAndSlide();
    }
}
```

### Signal Connection

```csharp
button.Pressed += OnButtonPressed;
// or
button.Connect("pressed", Callable.From(OnButtonPressed));
```

## Best Practices

1. Use partial classes
2. Leverage NuGet packages
3. Handle node lifecycle
4. Profile memory usage
5. Use source generators

## References

- [Godot C# Documentation](https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/)
