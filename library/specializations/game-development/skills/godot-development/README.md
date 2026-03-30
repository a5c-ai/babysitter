# Godot Development Skill

## Overview

The Godot Development skill provides comprehensive integration with Godot Engine for AI-assisted game development. It enables automated project setup, GDScript/C# script generation, scene manipulation, and export pipeline management through direct editor integration or file-based workflows.

## Purpose

Godot is an open-source game engine gaining significant momentum due to its lightweight nature, permissive license, and powerful features. This skill bridges LLM capabilities with Godot's development workflows, enabling:

- **Automated Script Generation**: Create GDScript and C# node scripts
- **Project Configuration**: Set up and modify project settings programmatically
- **Scene Manipulation**: Create and modify scenes, nodes, and resources
- **Export Automation**: Configure and trigger exports for multiple platforms

## Use Cases

### 1. Rapid Prototyping
Generate gameplay scripts quickly based on natural language descriptions, accelerating the iteration cycle.

### 2. Code Generation
Create boilerplate code for common patterns like state machines, resource management, and event systems.

### 3. Project Setup
Configure new Godot projects with proper folder structure, autoloads, and input mappings.

### 4. Asset Pipeline
Automate resource imports and scene organization.

## Processes That Use This Skill

- **Game Engine Setup** (`game-engine-setup.js`)
- **Core Mechanics Prototyping** (`core-mechanics-prototyping.js`)
- **Vertical Slice Development** (`vertical-slice-development.js`)
- **UI/UX Implementation** (`uiux-implementation.js`)
- **Level Design Process** (`level-design-process.js`)

## Installation

### MCP Server Setup (Recommended)

For direct Godot Editor integration:

```bash
# Using pip
pip install godot-mcp

# Or using npx
npx -y godot-mcp
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "godot": {
      "command": "python",
      "args": ["-m", "godot_mcp"],
      "env": {
        "GODOT_PROJECT_PATH": "/path/to/your/godot/project",
        "GODOT_EXECUTABLE": "/path/to/godot"
      }
    }
  }
}
```

### Alternative MCP Servers

| Server | Best For |
|--------|----------|
| Godot-MCP (ee0pdt) | Comprehensive editor integration |
| godot-mcp (Coding-Solo) | Project launch and debugging |
| GDAI MCP Server | Visual debugging with screenshots |
| godot-mcp (satelliteoflove) | Viewport and selection management |
| mcp_godot_rag (weekitmo) | Documentation RAG access |

## Capabilities

| Capability | Description | MCP Tool |
|------------|-------------|----------|
| Create Node | Instantiate nodes in scene | `godot_create_node` |
| Modify Node | Change node properties | `godot_modify_node` |
| Generate Script | Create GDScript/C# scripts | `godot_create_script` |
| Run Project | Launch in editor | `godot_run_project` |
| Run Scene | Run specific scene | `godot_run_scene` |
| Export | Export for platform | `godot_export` |
| Query Scene | Get scene tree | `godot_get_scene_tree` |
| Read Errors | Get error output | `godot_read_errors` |
| Screenshot | Capture viewport | `godot_screenshot` |

## Example Workflows

### Creating a Player Controller

```
Input: "Create a 2D platformer player with double jump"

Steps:
1. Generate player.gd with CharacterBody2D extension
2. Add movement and jump logic with double jump tracking
3. Create player.tscn scene
4. Configure collision layers
5. Set up input actions in project.godot
```

### Setting Up an Enemy System

```
Input: "Create a data-driven enemy system with resources"

Steps:
1. Generate enemy_data.gd Resource class
2. Generate enemy_base.gd base script
3. Create enemy spawner with object pooling
4. Create sample enemy data .tres files
5. Set up enemy scene inheritance
```

### State Machine Implementation

```
Input: "Create a finite state machine for character states"

Steps:
1. Generate state.gd base State class
2. Generate state_machine.gd manager
3. Create idle_state.gd, walk_state.gd, jump_state.gd
4. Set up state transition signals
5. Create example usage scene
```

## Integration with Other Skills

- **godot-shaders-skill**: Custom shader development
- **godot-physics-skill**: Physics configuration
- **godot-networking-skill**: Multiplayer support
- **behavior-trees-skill**: AI behavior trees
- **navmesh-skill**: Navigation mesh

## Troubleshooting

### Common Issues

1. **MCP Connection Failed**: Ensure Godot Editor has the MCP plugin enabled
2. **Script Parse Errors**: Check for GDScript syntax issues
3. **Scene Load Errors**: Verify resource paths are correct
4. **Export Failures**: Check export template installation

### Debug Commands

```bash
# Verify MCP server is running
curl http://localhost:8080/health

# Check Godot project path
echo $GODOT_PROJECT_PATH

# Run Godot headless
godot --headless --path /path/to/project --script res://scripts/test.gd
```

## Best Practices

1. **Use Type Hints** - GDScript supports static typing for performance
2. **Follow Style Guide** - Use snake_case for variables, PascalCase for classes
3. **Signals for Decoupling** - Prefer signals over direct node references
4. **Scene Composition** - Build with small, reusable scenes
5. **Resources for Data** - Use custom Resources for game data
6. **Autoload Sparingly** - Prefer dependency injection

## Version Compatibility

| Godot Version | Support Level |
|---------------|---------------|
| 3.5.x | Limited (different syntax) |
| 4.0 | Full |
| 4.1 | Full |
| 4.2 | Full |
| 4.3+ | Experimental |

## Key Node Types

| Node | Purpose |
|------|---------|
| CharacterBody2D/3D | Player/NPC movement |
| RigidBody2D/3D | Physics objects |
| Area2D/3D | Triggers and detection |
| TileMap | 2D level design |
| NavigationAgent | Pathfinding |
| AnimationPlayer | Animation control |
| AudioStreamPlayer | Sound playback |

## References

- [Godot Documentation](https://docs.godotengine.org/)
- [Godot-MCP (ee0pdt)](https://github.com/ee0pdt/Godot-MCP)
- [godot-mcp (Coding-Solo)](https://github.com/Coding-Solo/godot-mcp)
- [GDAI MCP Server](https://gdaimcp.com/)
- [Godot MCP Deep Dive](https://skywork.ai/skypage/en/godot-ai-mcp-server/1978727584661884928)
- [GDScript Reference](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_basics.html)
- [Godot Best Practices](https://docs.godotengine.org/en/stable/tutorials/best_practices/)
