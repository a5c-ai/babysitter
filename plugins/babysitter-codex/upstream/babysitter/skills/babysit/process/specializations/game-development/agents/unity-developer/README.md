# Unity Developer Agent

## Overview

The Unity Developer agent is an autonomous agent specialized in Unity Engine development. It handles gameplay implementation, editor tool creation, system integration, and Unity-specific technical challenges, producing production-quality C# code following Unity best practices.

## Purpose

Unity development requires deep knowledge of the engine's patterns, APIs, and best practices. This agent automates implementation tasks:

- **Gameplay Features**: Implement controllers, systems, and mechanics
- **Editor Tools**: Create custom inspectors and editor windows
- **System Integration**: Configure packages and third-party SDKs
- **Optimization**: Profile and optimize for target platforms

## Capabilities

| Capability | Description |
|------------|-------------|
| Gameplay Scripting | MonoBehaviours, systems, mechanics |
| ScriptableObjects | Data-driven asset creation |
| Editor Extensions | Custom inspectors, windows, tools |
| Input System | New Input System configuration |
| Physics | Rigidbody, collisions, raycasting |
| UI | UI Toolkit and UGUI implementation |
| Optimization | Profiling, pooling, GC reduction |

## Required Skills

This agent requires the following skills:

1. **unity-development**: Core Unity APIs and patterns
2. **behavior-trees**: AI behavior implementation
3. **navmesh**: Navigation and pathfinding

## Processes That Use This Agent

- **Core Mechanics Prototyping** (`core-mechanics-prototyping.js`)
- **Gameplay Systems** (`gameplay-systems.js`)
- **UI/UX Implementation** (`uiux-implementation.js`)
- **Vertical Slice Development** (`vertical-slice-development.js`)
- **Performance Optimization** (`performance-optimization.js`)

## Workflow

### Phase 1: Analysis

```
Input: Feature requirements
Output: Implementation plan

Steps:
1. Parse requirements
2. Check Unity version compatibility
3. Identify required packages
4. Plan component structure
```

### Phase 2: Implementation

```
Input: Implementation plan
Output: Scripts and assets

Steps:
1. Create MonoBehaviour scripts
2. Define ScriptableObjects
3. Implement interfaces
4. Add editor support
```

### Phase 3: Integration

```
Input: Implemented scripts
Output: Configured prefabs

Steps:
1. Create prefabs
2. Configure components
3. Set up references
4. Test functionality
```

### Phase 4: Documentation

```
Input: Complete implementation
Output: Usage documentation

Steps:
1. Write usage guide
2. Document configuration
3. List dependencies
4. Provide examples
```

## Input Specification

```json
{
  "task": "implement_feature",
  "feature": {
    "name": "InventorySystem",
    "type": "gameplay",
    "description": "Grid-based inventory with item stacking and drag-drop",
    "requirements": [
      "Support 100+ unique item types",
      "Stack identical items",
      "Drag and drop between slots",
      "Persist inventory state"
    ]
  },
  "project": {
    "unityVersion": "2022.3.20f1",
    "renderPipeline": "URP",
    "targetPlatform": "PC",
    "existingCode": ["Assets/Scripts/"]
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
        "path": "Assets/Scripts/Inventory/InventoryManager.cs",
        "content": "using UnityEngine;\n...",
        "description": "Central inventory management"
      },
      {
        "path": "Assets/Scripts/Inventory/ItemSlot.cs",
        "content": "using UnityEngine;\n...",
        "description": "Individual inventory slot"
      },
      {
        "path": "Assets/Scripts/Inventory/ItemData.cs",
        "content": "[CreateAssetMenu...]\n...",
        "description": "Item definition ScriptableObject"
      }
    ],
    "assets": [
      {
        "path": "Assets/Data/Items/",
        "type": "ScriptableObject folder",
        "description": "Item definitions"
      }
    ],
    "prefabs": [
      {
        "path": "Assets/Prefabs/UI/InventoryPanel.prefab",
        "components": ["InventoryUI", "GridLayoutGroup"],
        "description": "Inventory UI panel"
      }
    ]
  },
  "documentation": {
    "usage": "Add InventoryManager to scene, configure slots...",
    "configuration": "Set grid size in inspector...",
    "dependencies": ["TextMeshPro", "Input System"]
  }
}
```

## Unity Version Support

| Version | Support Level | Notes |
|---------|---------------|-------|
| 2021.3 LTS | Full | Stable, wide package support |
| 2022.3 LTS | Full | Recommended for new projects |
| 2023.x | Full | Tech stream features |
| Unity 6+ | Experimental | Latest features |

## Pipeline Support

| Pipeline | Use Case |
|----------|----------|
| Built-in | Legacy projects, simple graphics |
| URP | Mobile, cross-platform, good performance |
| HDRP | High-end PC/Console, visual fidelity |

## Common Implementation Patterns

### Player Controller
```csharp
[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 5f;
    // Implementation...
}
```

### ScriptableObject Data
```csharp
[CreateAssetMenu(fileName = "New Item", menuName = "Game/Item Data")]
public class ItemData : ScriptableObject
{
    public string itemName;
    public Sprite icon;
    // Data fields...
}
```

### Event System
```csharp
public class GameEvents : MonoBehaviour
{
    public static event Action<int> OnScoreChanged;
    public static void ScoreChanged(int score) => OnScoreChanged?.Invoke(score);
}
```

## Integration

### With Other Agents

```
game-architect-agent ──> unity-developer ──> tech-artist-agent
         │                      │                    │
         └── architecture       │                    └── visual integration
                                │
                                └── implementation
```

### MCP Integration

The agent can leverage Unity MCP servers for direct editor control:

```json
{
  "mcpServers": {
    "unity": {
      "command": "npx",
      "args": ["-y", "unity-mcp"]
    }
  }
}
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| NullReferenceException | Missing reference | Add null check, use [SerializeField] |
| Missing assembly | Package not installed | Add via Package Manager |
| Serialization error | Invalid type | Use [System.Serializable] |
| Build error | Platform incompatibility | Check #if directives |

## Best Practices

1. **Private + SerializeField** - Expose via attribute, not public
2. **GetComponent Caching** - Cache in Awake, not Update
3. **Object Pooling** - Pool frequently spawned objects
4. **Assembly Definitions** - Organize for compilation speed
5. **Null Safety** - Check references, especially on scene load
6. **Events Over Update** - React to changes, don't poll

## Performance Guidelines

| Area | Recommendation |
|------|----------------|
| Update | Minimize work, use events |
| Physics | Use layers, optimize colliders |
| Memory | Pool objects, avoid allocations |
| Draw calls | Batch materials, use atlases |
| Loading | Use Addressables, async loading |

## Related Resources

- Skills: `unity-development/SKILL.md`, `behavior-trees/SKILL.md`
- Processes: `gameplay-systems.js`, `core-mechanics-prototyping.js`
- MCP: [unity-mcp](https://github.com/CoplayDev/unity-mcp)
- External: [Unity Documentation](https://docs.unity3d.com/)
- External: [Unity Learn](https://learn.unity.com/)
