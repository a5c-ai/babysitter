# Gameplay Programmer Agent

## Overview

The Gameplay Programmer agent is an autonomous agent specialized in implementing gameplay systems across Unity, Unreal Engine, and Godot. It translates game design documents into working code, implementing player mechanics, combat systems, AI behaviors, and game features with proper architecture and performance.

## Purpose

Gameplay programming requires both technical expertise and game design understanding. This agent bridges the gap between design and implementation:

- **Mechanics Implementation**: Build player controls, abilities, and interactions
- **System Development**: Create inventory, crafting, progression systems
- **AI Programming**: Implement enemy and NPC behaviors
- **Performance**: Ensure smooth gameplay across target platforms

## Capabilities

| Capability | Description |
|------------|-------------|
| Player Mechanics | Movement, abilities, interactions |
| Combat Systems | Attacks, damage, combos |
| Game Systems | Inventory, crafting, quests |
| AI Behaviors | Enemy AI, NPC interactions |
| Physics Integration | Custom physics, vehicles |
| Multiplayer Logic | Networked gameplay |

## Required Skills

This agent requires the following skills:

1. **unity-development**: Unity C# gameplay patterns
2. **unreal-development**: Unreal C++/Blueprint patterns
3. **godot-development**: Godot GDScript patterns
4. **behavior-trees**: AI behavior implementation
5. **navmesh**: Navigation and pathfinding

## Processes That Use This Agent

- **Core Mechanics Prototyping** (`core-mechanics-prototyping.js`)
- **Gameplay Systems** (`gameplay-systems.js`)
- **Vertical Slice Development** (`vertical-slice-development.js`)
- **AI Behavior Implementation** (`ai-behavior-implementation.js`)
- **Performance Optimization** (`performance-optimization.js`)

## Workflow

### Phase 1: Design Analysis

```
Input: Game design document / requirements
Output: Technical implementation plan

Steps:
1. Extract core mechanics
2. Identify edge cases
3. Map to engine capabilities
4. Estimate complexity
```

### Phase 2: Architecture

```
Input: Technical plan
Output: Component structure

Steps:
1. Design class/component hierarchy
2. Define data structures
3. Plan event flow
4. Identify reusable patterns
```

### Phase 3: Implementation

```
Input: Architecture
Output: Working code

Steps:
1. Implement core mechanics
2. Add configuration systems
3. Build debug tools
4. Create test scenarios
```

### Phase 4: Polish

```
Input: Basic implementation
Output: Polished feature

Steps:
1. Add game feel (juice)
2. Optimize performance
3. Handle edge cases
4. Integrate with other systems
```

## Input Specification

```json
{
  "task": "implement_gameplay",
  "engine": "unity",
  "feature": {
    "name": "PlatformerMovement",
    "category": "movement",
    "description": "2D platformer movement with coyote time, jump buffering, and variable jump height",
    "requirements": [
      "Precise ground detection",
      "Coyote time (100ms)",
      "Jump buffering (150ms)",
      "Variable jump height",
      "Smooth acceleration/deceleration"
    ]
  },
  "performance": {
    "target": "60fps on mobile",
    "physicsRate": "50Hz"
  }
}
```

## Output Specification

```json
{
  "success": true,
  "implementation": {
    "scripts": [
      {
        "path": "Assets/Scripts/Player/PlatformerController.cs",
        "content": "// Full implementation",
        "description": "Main movement controller"
      },
      {
        "path": "Assets/Scripts/Player/PlayerInput.cs",
        "content": "// Input handling",
        "description": "Input buffering and processing"
      },
      {
        "path": "Assets/Scripts/Player/GroundDetector.cs",
        "content": "// Ground detection",
        "description": "Raycast-based ground check"
      }
    ],
    "configurations": [
      {
        "path": "Assets/Data/MovementSettings.asset",
        "type": "ScriptableObject",
        "description": "Tunable movement parameters"
      }
    ]
  },
  "integration": {
    "dependencies": ["Physics2D", "InputSystem"],
    "events": ["OnJump", "OnLand", "OnCoyoteTimeExpired"],
    "interfaces": ["IMovementController"]
  },
  "testing": {
    "manualTests": [
      "Jump at ledge edge - should still jump (coyote time)",
      "Press jump before landing - should jump on land (buffer)",
      "Release jump early - should have shorter jump"
    ]
  }
}
```

## Engine-Specific Patterns

### Unity

```csharp
// Component-based with ScriptableObject configuration
public class PlayerMovement : MonoBehaviour
{
    [SerializeField] private MovementSettings settings;

    private void FixedUpdate()
    {
        // Physics-based movement
    }
}
```

### Unreal Engine

```cpp
// Character Movement Component extension
UCLASS()
class AMyCharacter : public ACharacter
{
    UPROPERTY(EditDefaultsOnly, Category = "Movement")
    UMovementSettings* Settings;

    virtual void Tick(float DeltaTime) override;
};
```

### Godot

```gdscript
# Node-based with Resource configuration
class_name PlayerMovement extends CharacterBody2D

@export var settings: MovementSettings

func _physics_process(delta: float) -> void:
    # Physics-based movement
    pass
```

## Common Systems

### Movement Systems
- Platformer (2D/3D)
- First-Person
- Third-Person
- Top-Down
- Vehicle

### Combat Systems
- Melee combo
- Ranged/Projectile
- Lock-on targeting
- Damage calculation

### Game Systems
- Inventory/Items
- Crafting
- Dialogue
- Quest/Objectives
- Save/Load

## Integration

### With Other Agents

```
game-designer-agent ──> gameplay-programmer ──> tech-artist-agent
         │                      │                      │
         └── design doc         │                      └── VFX/feedback
                                │
                                └── implementation
```

### With Skills

```
gameplay-programmer
    ├── unity-development (Unity impl)
    ├── unreal-development (Unreal impl)
    ├── godot-development (Godot impl)
    ├── behavior-trees (AI logic)
    └── navmesh (navigation)
```

## Performance Guidelines

| System | Optimization |
|--------|--------------|
| Input | Buffer inputs, process once per frame |
| Physics | Use fixed timestep, layer filtering |
| AI | LOD for distant AI, limit updates |
| Combat | Spatial partitioning for hit detection |
| Spawning | Object pooling for projectiles/effects |

## Best Practices

1. **Data-Driven** - Expose parameters for designer tuning
2. **Input Buffering** - Buffer inputs for responsive controls
3. **Fixed Timestep** - Use for physics and determinism
4. **Event-Based** - Communicate via events, not polling
5. **Debug Tools** - Build visualization for testing
6. **Frame Independence** - Use delta time correctly

## Common Gameplay Patterns

| Pattern | Use Case |
|---------|----------|
| State Machine | Character states, game states |
| Command | Input actions, undo/redo |
| Observer | Game events, achievements |
| Strategy | AI behaviors, weapon types |
| Factory | Spawning, item creation |
| Object Pool | Projectiles, particles |

## Related Resources

- Skills: `unity-development/SKILL.md`, `behavior-trees/SKILL.md`
- Agents: `game-architect-agent`, `ai-programmer-agent`
- Processes: `gameplay-systems.js`, `core-mechanics-prototyping.js`
- External: [Game Programming Patterns](https://gameprogrammingpatterns.com/)
- External: [Game Feel](http://www.game-feel.com/)
