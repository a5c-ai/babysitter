# Unreal Development Skill

## Overview

The Unreal Development skill provides comprehensive integration with Unreal Engine for AI-assisted game development. It enables automated C++ class generation, Blueprint creation, level manipulation, and build pipeline management through direct editor integration or file-based workflows.

## Purpose

Unreal Engine is the industry standard for AAA game development and high-fidelity experiences. This skill bridges LLM capabilities with Unreal's development workflows, enabling:

- **Automated Code Generation**: Create Actors, Components, and Gameplay Ability System classes
- **Blueprint Generation**: Design and generate Blueprint classes and functions
- **Level Manipulation**: Create and modify levels programmatically
- **Build Automation**: Configure and trigger builds for multiple platforms

## Use Cases

### 1. Rapid Prototyping
Generate gameplay classes quickly based on natural language descriptions, accelerating the iteration cycle.

### 2. Code Generation
Create boilerplate code for common patterns like GAS abilities, AI controllers, and state machines.

### 3. Blueprint to C++ Migration
Convert Blueprint logic to optimized C++ implementations.

### 4. Plugin Development
Generate editor plugins and tools for team workflows.

## Processes That Use This Skill

- **Game Engine Setup** (`game-engine-setup.js`)
- **Core Mechanics Prototyping** (`core-mechanics-prototyping.js`)
- **Vertical Slice Development** (`vertical-slice-development.js`)
- **Gameplay Systems** (`gameplay-systems.js`)
- **AI Behavior Implementation** (`ai-behavior-implementation.js`)

## Installation

### MCP Server Setup (Recommended)

For direct Unreal Editor integration:

```bash
# Using pip
pip install unreal-mcp

# Or clone and install
git clone https://github.com/chongdashu/unreal-mcp
cd unreal-mcp
pip install -e .
```

### Unreal Plugin Installation

Install the MCP bridge plugin in your project:

1. Copy plugin to `Plugins/UnrealMCP`
2. Enable in Project Settings > Plugins
3. Restart editor

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "unreal": {
      "command": "python",
      "args": ["-m", "unreal_mcp"],
      "env": {
        "UNREAL_PROJECT_PATH": "/path/to/YourProject.uproject",
        "UNREAL_ENGINE_PATH": "/path/to/UE_5.3"
      }
    }
  }
}
```

### Alternative MCP Servers

| Server | Best For |
|--------|----------|
| UnrealMCP (kvick-games) | TCP-based control |
| unreal-mcp (chongdashu) | Natural language commands |
| Unreal_mcp (ChiR24) | C++ automation bridge |
| UnrealMCPBridge (appleweed) | Python API access |
| py-ue5-mcp-server (edi3on) | UE5 specific features |

## Capabilities

| Capability | Description | MCP Tool |
|------------|-------------|----------|
| Spawn Actor | Create actors in level | `unreal_spawn_actor` |
| Modify Actor | Change actor properties | `unreal_modify_actor` |
| Create Blueprint | Generate BP classes | `unreal_create_blueprint` |
| Generate Code | Create C++ classes | `unreal_generate_cpp` |
| Compile | Hot reload/compile | `unreal_compile` |
| Build | Platform builds | `unreal_build` |
| Run Tests | Automation tests | `unreal_run_automation` |
| Query Level | Get level info | `unreal_query_level` |
| Execute Python | Run Unreal Python | `unreal_python_exec` |

## Example Workflows

### Creating a Character Class

```
Input: "Create a third-person character with GAS abilities support"

Steps:
1. Generate AMyCharacter.h/.cpp with camera and input
2. Generate UMyAbilitySystemComponent class
3. Create ability input bindings
4. Generate Enhanced Input action assets
5. Create Animation Blueprint base
```

### Setting Up Gameplay Abilities

```
Input: "Create a fireball ability with GAS"

Steps:
1. Generate UGA_Fireball GameplayAbility
2. Create FireballProjectile actor
3. Generate damage GameplayEffect
4. Set up cooldown GameplayEffect
5. Configure ability tags
```

### Build Pipeline Setup

```
Input: "Configure builds for Steam and PlayStation 5"

Steps:
1. Configure Shipping build settings
2. Set up Steam Online Subsystem
3. Configure PS5 submission settings
4. Create BuildGraph scripts
5. Generate build documentation
```

## Integration with Other Skills

- **unreal-blueprint-skill**: Visual scripting
- **unreal-niagara-skill**: VFX systems
- **unreal-networking-skill**: Multiplayer
- **unreal-gamesframework-skill**: GAS integration
- **behavior-trees-skill**: AI behavior trees

## Troubleshooting

### Common Issues

1. **MCP Connection Failed**: Ensure Unreal Editor is running with Python enabled
2. **Compilation Errors**: Check UCLASS/UPROPERTY specifiers
3. **Hot Reload Issues**: Full rebuild may be required for header changes
4. **Blueprint Compilation**: Check parent class compatibility

### Debug Commands

```bash
# Verify MCP server
curl http://localhost:9090/health

# Check project settings
cat /path/to/project/Config/DefaultEngine.ini

# Run automation tests
UnrealEditor-Cmd.exe /path/to/project.uproject -ExecCmds="Automation RunTests"
```

## Best Practices

1. **Use UCLASS Specifiers** - BlueprintType, Blueprintable, NotBlueprintable as needed
2. **Property Categories** - Organize with Category="SectionName|Subsection"
3. **Avoid Tick When Possible** - Use Timers, Delegates, or Event-driven patterns
4. **Gameplay Tags** - Use for flexible categorization and ability targeting
5. **Data Assets** - Store configuration in UDataAsset subclasses
6. **Module Dependencies** - Declare in Build.cs to avoid circular references

## Version Compatibility

| UE Version | Support Level |
|------------|---------------|
| 5.0 | Full |
| 5.1 | Full |
| 5.2 | Full |
| 5.3 | Full |
| 5.4+ | Experimental |

## Key Modules

| Module | Purpose |
|--------|---------|
| Core | Fundamental types |
| CoreUObject | UObject system |
| Engine | Game framework |
| GameplayAbilities | GAS |
| AIModule | AI framework |
| EnhancedInput | Input system |
| Niagara | VFX |

## References

- [Unreal Engine Documentation](https://dev.epicgames.com/documentation/)
- [UnrealMCP (kvick-games)](https://github.com/kvick-games/UnrealMCP)
- [unreal-mcp (chongdashu)](https://github.com/chongdashu/unreal-mcp)
- [ClaudeAI Plugin for UE5](https://claudeaiplugin.com/)
- [UnrealClaude](https://github.com/Natfii/UnrealClaude)
- [Unreal Engine Code Analyzer](https://glama.ai/mcp/servers/@ayeletstudioindia/unreal-analyzer-mcp)
- [Unreal MCP Guide](https://apidog.com/blog/unreal-engine-mcp-server/)
