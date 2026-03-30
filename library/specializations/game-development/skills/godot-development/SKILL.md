---
name: godot-development
description: Godot Engine integration skill for GDScript/C# development, scene composition, node management, and editor automation. Enables LLMs to interact with Godot Editor through MCP servers for asset manipulation, script generation, and automated workflows.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Godot Development Skill

Comprehensive Godot Engine development integration for AI-assisted game creation, editor automation, and project management.

## Overview

This skill provides capabilities for interacting with Godot projects, including GDScript and C# development, scene manipulation, node management, and export automation. It leverages the Godot MCP ecosystem for direct editor integration when available.

## Capabilities

### Project Management
- Create and configure Godot projects
- Manage project settings (project.godot)
- Configure export presets
- Set up autoloads and singletons

### GDScript Development
- Generate scripts extending Node, Node2D, Node3D, etc.
- Create custom Resources for data-driven design
- Implement signals and signal connections
- Write tool scripts for editor functionality
- Generate unit tests using GUT or gdUnit4

### C# Development (Godot Mono)
- Generate C# scripts with proper Godot bindings
- Create custom Resources in C#
- Implement partial classes for node scripts
- Interface with .NET libraries

### Scene Composition
- Create and modify scenes programmatically
- Instantiate and configure nodes
- Set up node hierarchies and ownership
- Configure scene inheritance

### Resource System
- Create custom Resource types
- Generate data resources
- Manage resource paths and loading
- Configure resource imports

### Export System
- Configure export presets for multiple platforms
- Create export scripts for automation
- Set up CI/CD export pipelines
- Manage platform-specific configurations

## Prerequisites

### Godot Installation
- Godot 4.0 or higher recommended
- Godot Editor installed with required export templates

### MCP Server (Recommended)
For direct Godot Editor integration:

```json
{
  "mcpServers": {
    "godot": {
      "command": "npx",
      "args": ["-y", "godot-mcp"],
      "env": {
        "GODOT_PROJECT_PATH": "/path/to/godot/project"
      }
    }
  }
}
```

Alternative MCP servers:
- `Godot-MCP` (ee0pdt) - Comprehensive editor integration
- `godot-mcp` (Coding-Solo) - Project launch and debugging
- `GDAI MCP Server` - Script fixing with screenshots

## Usage Patterns

### Creating a Character Controller (GDScript)

```gdscript
extends CharacterBody2D
class_name PlayerController

## Movement speed in pixels per second
@export var move_speed: float = 200.0
## Jump velocity
@export var jump_velocity: float = -400.0

## Gravity from project settings
var gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity")

## Emitted when the player takes damage
signal damage_taken(amount: int)
## Emitted when the player dies
signal died

var _is_alive: bool = true

func _physics_process(delta: float) -> void:
    if not _is_alive:
        return

    _apply_gravity(delta)
    _handle_jump()
    _handle_movement()
    move_and_slide()

func _apply_gravity(delta: float) -> void:
    if not is_on_floor():
        velocity.y += gravity * delta

func _handle_jump() -> void:
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

func _handle_movement() -> void:
    var direction := Input.get_axis("move_left", "move_right")
    if direction:
        velocity.x = direction * move_speed
    else:
        velocity.x = move_toward(velocity.x, 0, move_speed)

func take_damage(amount: int) -> void:
    damage_taken.emit(amount)

func die() -> void:
    _is_alive = false
    died.emit()
```

### Creating a Custom Resource (GDScript)

```gdscript
@tool
extends Resource
class_name EnemyData

## Display name of the enemy
@export var enemy_name: String = "Enemy"
## Enemy icon for UI
@export var icon: Texture2D
## Maximum health points
@export var max_health: int = 100
## Movement speed
@export var move_speed: float = 100.0

@export_group("Combat")
## Damage dealt per attack
@export var attack_damage: int = 10
## Range of attack in pixels
@export var attack_range: float = 50.0
## Cooldown between attacks
@export var attack_cooldown: float = 1.0

@export_group("Rewards")
## Experience points awarded on death
@export var exp_reward: int = 50
## Items that can drop
@export var loot_table: Array[PackedScene]

## Get damage per second potential
func get_dps() -> float:
    return attack_damage / attack_cooldown
```

### State Machine Pattern (GDScript)

```gdscript
extends Node
class_name StateMachine

## Emitted when state changes
signal state_changed(old_state: State, new_state: State)

@export var initial_state: State

var current_state: State
var states: Dictionary = {}

func _ready() -> void:
    for child in get_children():
        if child is State:
            states[child.name.to_lower()] = child
            child.state_machine = self

    if initial_state:
        current_state = initial_state
        current_state.enter()

func _process(delta: float) -> void:
    if current_state:
        current_state.update(delta)

func _physics_process(delta: float) -> void:
    if current_state:
        current_state.physics_update(delta)

func _unhandled_input(event: InputEvent) -> void:
    if current_state:
        current_state.handle_input(event)

func transition_to(state_name: String) -> void:
    var new_state: State = states.get(state_name.to_lower())
    if new_state == null:
        push_warning("State '%s' not found" % state_name)
        return

    if current_state:
        current_state.exit()

    var old_state := current_state
    current_state = new_state
    current_state.enter()
    state_changed.emit(old_state, new_state)
```

### Creating a C# Script (Godot Mono)

```csharp
using Godot;
using System;

public partial class PlayerController : CharacterBody2D
{
    [Export]
    public float MoveSpeed { get; set; } = 200.0f;

    [Export]
    public float JumpVelocity { get; set; } = -400.0f;

    [Signal]
    public delegate void DamageTakenEventHandler(int amount);

    [Signal]
    public delegate void DiedEventHandler();

    private float _gravity = ProjectSettings.GetSetting("physics/2d/default_gravity").AsSingle();
    private bool _isAlive = true;

    public override void _PhysicsProcess(double delta)
    {
        if (!_isAlive) return;

        Vector2 velocity = Velocity;

        // Apply gravity
        if (!IsOnFloor())
        {
            velocity.Y += _gravity * (float)delta;
        }

        // Handle jump
        if (Input.IsActionJustPressed("jump") && IsOnFloor())
        {
            velocity.Y = JumpVelocity;
        }

        // Handle movement
        float direction = Input.GetAxis("move_left", "move_right");
        velocity.X = direction != 0 ? direction * MoveSpeed : Mathf.MoveToward(velocity.X, 0, MoveSpeed);

        Velocity = velocity;
        MoveAndSlide();
    }

    public void TakeDamage(int amount)
    {
        EmitSignal(SignalName.DamageTaken, amount);
    }

    public void Die()
    {
        _isAlive = false;
        EmitSignal(SignalName.Died);
    }
}
```

## Integration with Babysitter SDK

### Task Definition Example

```javascript
const godotScriptTask = defineTask({
  name: 'godot-script-generation',
  description: 'Generate Godot script',

  inputs: {
    language: { type: 'string', required: true }, // gdscript, csharp
    baseClass: { type: 'string', required: true },
    className: { type: 'string', required: true },
    features: { type: 'array', required: true },
    outputPath: { type: 'string', required: true }
  },

  outputs: {
    scriptPath: { type: 'string' },
    success: { type: 'boolean' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Generate Godot script: ${inputs.className}`,
      skill: {
        name: 'godot-development',
        context: {
          operation: 'generate_script',
          language: inputs.language,
          baseClass: inputs.baseClass,
          className: inputs.className,
          features: inputs.features,
          outputPath: inputs.outputPath
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Integration

### Available MCP Tools (via godot-mcp)

| Tool | Description |
|------|-------------|
| `godot_create_node` | Create node in scene |
| `godot_modify_node` | Modify node properties |
| `godot_create_script` | Generate and attach script |
| `godot_run_project` | Launch project in editor |
| `godot_run_scene` | Run specific scene |
| `godot_export` | Export for target platform |
| `godot_get_scene_tree` | Query scene structure |
| `godot_read_errors` | Get editor error output |
| `godot_screenshot` | Capture viewport screenshot |

### Configuration

```json
{
  "mcpServers": {
    "godot": {
      "command": "python",
      "args": ["-m", "godot_mcp"],
      "env": {
        "GODOT_PROJECT_PATH": "/path/to/godot/project",
        "GODOT_EXECUTABLE": "/path/to/godot"
      }
    }
  }
}
```

## Best Practices

1. **Use Static Typing**: Always use type hints for better performance and autocompletion
2. **Signals Over Direct Calls**: Use signals for loose coupling between nodes
3. **Resource Preloading**: Use preload() for frequently used resources
4. **Scene Inheritance**: Use inherited scenes for variants
5. **Autoloads**: Use sparingly, prefer dependency injection
6. **@tool Scripts**: Mark scripts that need to run in editor

## Platform Considerations

| Platform | Key Considerations |
|----------|-------------------|
| PC/Mac/Linux | Full feature support |
| Mobile | Touch input, reduced shaders, export templates |
| Web | No threading, WASM limitations |
| Console | Requires third-party publishing partners |

## References

- [Godot Documentation](https://docs.godotengine.org/)
- [Godot-MCP (ee0pdt)](https://github.com/ee0pdt/Godot-MCP)
- [godot-mcp (Coding-Solo)](https://github.com/Coding-Solo/godot-mcp)
- [GDAI MCP Server](https://gdaimcp.com/)
- [GDScript Style Guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html)
- [Godot Best Practices](https://docs.godotengine.org/en/stable/tutorials/best_practices/)
