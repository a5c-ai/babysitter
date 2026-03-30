# Unity Development Skill

## Overview

The Unity Development skill provides comprehensive integration with Unity Engine for AI-assisted game development. It enables automated project setup, C# script generation, scene manipulation, and build pipeline management through direct editor integration or file-based workflows.

## Purpose

Unity is one of the most widely used game engines, powering thousands of games across all platforms. This skill bridges LLM capabilities with Unity's development workflows, enabling:

- **Automated Script Generation**: Create MonoBehaviours, ScriptableObjects, and Editor scripts
- **Project Configuration**: Set up and modify project settings programmatically
- **Scene Manipulation**: Create and modify scenes, GameObjects, and prefabs
- **Build Automation**: Configure and trigger builds for multiple platforms

## Use Cases

### 1. Rapid Prototyping
Generate gameplay scripts quickly based on natural language descriptions, accelerating the iteration cycle.

### 2. Code Generation
Create boilerplate code for common patterns like singletons, object pools, state machines, and event systems.

### 3. Project Setup
Configure new Unity projects with proper folder structure, assembly definitions, and package dependencies.

### 4. Build Pipeline
Automate build processes for multiple platforms with proper settings and optimizations.

## Processes That Use This Skill

- **Game Engine Setup** (`game-engine-setup.js`)
- **Core Mechanics Prototyping** (`core-mechanics-prototyping.js`)
- **Vertical Slice Development** (`vertical-slice-development.js`)
- **UI/UX Implementation** (`uiux-implementation.js`)
- **Performance Optimization** (`performance-optimization.js`)

## Installation

### MCP Server Setup (Recommended)

For direct Unity Editor integration:

```bash
# Using npx (Node.js required)
npx -y unity-mcp

# Or install globally
npm install -g unity-mcp
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "unity": {
      "command": "npx",
      "args": ["-y", "unity-mcp"],
      "env": {
        "UNITY_PROJECT_PATH": "/path/to/your/unity/project"
      }
    }
  }
}
```

### Alternative MCP Servers

| Server | Best For |
|--------|----------|
| unity-mcp (CoplayDev) | General Unity development |
| Unity-MCP (IvanMurzak) | Editor + Runtime integration |
| mcp-unity (CoderGamester) | IDE integration (Cursor, VSCode) |
| GDAI MCP Server | Visual debugging with screenshots |

## Capabilities

| Capability | Description | MCP Tool |
|------------|-------------|----------|
| Create GameObject | Instantiate objects in scene | `unity_create_gameobject` |
| Add Component | Add components to GameObjects | `unity_add_component` |
| Generate Script | Create C# scripts | `unity_create_script` |
| Modify Scene | Edit scene hierarchy | `unity_modify_scene` |
| Build Project | Trigger platform builds | `unity_build` |
| Run Tests | Execute unit/integration tests | `unity_run_tests` |
| Import Assets | Import and configure assets | `unity_import_asset` |
| Query Project | Read project structure | `unity_get_project_info` |

## Example Workflows

### Creating a New Player Controller

```
Input: "Create a 2D platformer player controller with movement and jumping"

Steps:
1. Generate PlayerController.cs with movement logic
2. Generate PlayerInput.cs for input handling
3. Create player prefab with required components
4. Set up input action assets
5. Configure physics settings
```

### Setting Up an Enemy System

```
Input: "Create a data-driven enemy system with scriptable objects"

Steps:
1. Generate EnemyData.cs ScriptableObject
2. Generate EnemyBase.cs MonoBehaviour
3. Generate EnemySpawner.cs for wave management
4. Create sample enemy data assets
5. Set up object pooling
```

### Build Pipeline Setup

```
Input: "Configure builds for Steam and Nintendo Switch"

Steps:
1. Configure PC build settings for Steam
2. Set up Steam achievements/cloud saves integration
3. Configure Switch-specific settings
4. Create build scripts for CI/CD
5. Generate build documentation
```

## Integration with Other Skills

- **unity-urp-skill**: Render pipeline configuration
- **unity-netcode-skill**: Multiplayer networking
- **unity-addressables-skill**: Asset management
- **unity-input-system-skill**: Input handling
- **behavior-trees-skill**: AI behavior

## Troubleshooting

### Common Issues

1. **MCP Connection Failed**: Ensure Unity Editor is running with the MCP server plugin installed
2. **Script Compilation Errors**: Check for missing namespace imports or assembly references
3. **Asset Import Failures**: Verify asset paths and import settings
4. **Build Errors**: Review build logs for platform-specific issues

### Debug Commands

```bash
# Verify MCP server is running
curl http://localhost:8080/health

# Check Unity project path
echo $UNITY_PROJECT_PATH

# Test Unity CLI
unity -batchmode -quit -projectPath /path/to/project -logFile -
```

## Best Practices

1. **Use Assembly Definitions** - Organize code into separate assemblies for faster compilation
2. **Follow Unity Naming Conventions** - PascalCase for public members, camelCase for private
3. **Leverage ScriptableObjects** - Use for configuration data and events
4. **Implement Object Pooling** - Avoid runtime allocations
5. **Write Unit Tests** - Use Unity Test Framework for automated testing

## Version Compatibility

| Unity Version | Support Level |
|---------------|---------------|
| 2021.3 LTS | Full |
| 2022.3 LTS | Full |
| Unity 6 | Experimental |

## References

- [Unity Documentation](https://docs.unity3d.com/)
- [Unity MCP (CoplayDev)](https://github.com/CoplayDev/unity-mcp)
- [Unity-MCP (IvanMurzak)](https://github.com/IvanMurzak/Unity-MCP)
- [mcp-unity (CoderGamester)](https://github.com/CoderGamester/mcp-unity)
- [Unity MCP Guide](https://apidog.com/blog/unity-mcp-server/)
- [MCP-Unity: Protocol-Driven Framework (ACM 2025)](https://dl.acm.org/doi/10.1145/XXXXX)
