---
name: unity-development
description: Unity Engine integration skill for project setup, C# scripting, scene management, prefab creation, and editor automation. Enables LLMs to interact with Unity Editor through MCP servers for asset manipulation, script generation, and automated workflows.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity Development Skill

Comprehensive Unity Engine development integration for AI-assisted game creation, editor automation, and project management.

## Overview

This skill provides capabilities for interacting with Unity projects, including C# scripting, scene manipulation, prefab management, and build automation. It leverages the Unity MCP ecosystem for direct editor integration when available.

## Capabilities

### Project Management
- Create and configure Unity projects
- Manage project settings (Player Settings, Quality Settings, etc.)
- Configure package dependencies via Package Manager
- Set up Assembly Definitions for code organization

### C# Scripting
- Generate MonoBehaviour scripts with proper lifecycle methods
- Create ScriptableObjects for data-driven design
- Implement interfaces (ISerializationCallbackReceiver, etc.)
- Write custom Editor scripts and PropertyDrawers
- Generate unit tests using Unity Test Framework

### Scene Management
- Create and modify scenes programmatically
- Instantiate and configure GameObjects
- Set up scene hierarchies and parent/child relationships
- Configure lighting, cameras, and post-processing

### Prefab System
- Create and modify prefab assets
- Handle prefab variants and overrides
- Generate prefab instances with modifications
- Manage nested prefabs

### Asset Pipeline
- Import and configure assets (textures, models, audio)
- Set up asset bundles and addressables
- Configure import settings for optimization
- Generate placeholder assets

### Build System
- Configure build settings for multiple platforms
- Create build scripts for automation
- Set up CI/CD build pipelines
- Manage platform-specific configurations

## Prerequisites

### Unity Installation
- Unity 2021.3 LTS or higher recommended
- Unity Editor installed with required modules

### MCP Server (Recommended)
For direct Unity Editor integration:

```json
{
  "mcpServers": {
    "unity": {
      "command": "npx",
      "args": ["-y", "unity-mcp"],
      "env": {
        "UNITY_PROJECT_PATH": "/path/to/unity/project"
      }
    }
  }
}
```

Alternative MCP servers:
- `unity-mcp` (CoplayDev) - Official Unity MCP bridge
- `Unity-MCP` (IvanMurzak) - Editor & Runtime support
- `mcp-unity` (CoderGamester) - Cursor/Claude Code integration

## Usage Patterns

### Creating a MonoBehaviour Script

```csharp
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [Header("Movement Settings")]
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float jumpForce = 10f;

    [Header("Ground Check")]
    [SerializeField] private Transform groundCheck;
    [SerializeField] private float groundRadius = 0.2f;
    [SerializeField] private LayerMask groundLayer;

    private Rigidbody2D rb;
    private bool isGrounded;

    private void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    private void Update()
    {
        isGrounded = Physics2D.OverlapCircle(groundCheck.position, groundRadius, groundLayer);
        HandleInput();
    }

    private void FixedUpdate()
    {
        HandleMovement();
    }

    private void HandleInput()
    {
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);
        }
    }

    private void HandleMovement()
    {
        float horizontal = Input.GetAxisRaw("Horizontal");
        rb.velocity = new Vector2(horizontal * moveSpeed, rb.velocity.y);
    }
}
```

### Creating a ScriptableObject

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewEnemyData", menuName = "Game/Enemy Data")]
public class EnemyData : ScriptableObject
{
    [Header("Basic Info")]
    public string enemyName;
    public Sprite icon;

    [Header("Stats")]
    public int maxHealth = 100;
    public float moveSpeed = 3f;
    public int damage = 10;

    [Header("Combat")]
    public float attackRange = 2f;
    public float attackCooldown = 1.5f;

    [Header("Rewards")]
    public int experienceReward = 50;
    public GameObject[] lootDrops;
}
```

### Editor Script Example

```csharp
using UnityEngine;
using UnityEditor;

[CustomEditor(typeof(EnemyData))]
public class EnemyDataEditor : Editor
{
    public override void OnInspectorGUI()
    {
        EnemyData enemyData = (EnemyData)target;

        EditorGUILayout.BeginHorizontal();
        if (enemyData.icon != null)
        {
            GUILayout.Box(enemyData.icon.texture, GUILayout.Width(64), GUILayout.Height(64));
        }
        EditorGUILayout.BeginVertical();
        EditorGUILayout.LabelField(enemyData.enemyName, EditorStyles.boldLabel);
        EditorGUILayout.LabelField($"HP: {enemyData.maxHealth} | DMG: {enemyData.damage}");
        EditorGUILayout.EndVertical();
        EditorGUILayout.EndHorizontal();

        EditorGUILayout.Space();
        DrawDefaultInspector();
    }
}
```

## Integration with Babysitter SDK

### Task Definition Example

```javascript
const unityScriptTask = defineTask({
  name: 'unity-script-generation',
  description: 'Generate Unity C# script',

  inputs: {
    scriptType: { type: 'string', required: true }, // MonoBehaviour, ScriptableObject, Editor
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
      title: `Generate Unity script: ${inputs.className}`,
      skill: {
        name: 'unity-development',
        context: {
          operation: 'generate_script',
          scriptType: inputs.scriptType,
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

### Available MCP Tools (via unity-mcp)

| Tool | Description |
|------|-------------|
| `unity_create_gameobject` | Create new GameObject in scene |
| `unity_modify_component` | Add/modify component on GameObject |
| `unity_create_script` | Generate and attach C# script |
| `unity_build` | Trigger Unity build |
| `unity_run_tests` | Execute Unity Test Framework tests |
| `unity_import_asset` | Import and configure assets |
| `unity_scene_hierarchy` | Query scene structure |
| `unity_project_settings` | Read/modify project settings |

### Configuration

```json
{
  "mcpServers": {
    "unity": {
      "command": "uvx",
      "args": ["unity-mcp"],
      "env": {
        "UNITY_PROJECT_PATH": "C:/Projects/MyGame",
        "UNITY_VERSION": "2022.3.20f1"
      }
    }
  }
}
```

## Best Practices

1. **Assembly Definitions**: Organize code with .asmdef files for faster compilation
2. **Serialization**: Use [SerializeField] for inspector exposure while keeping fields private
3. **Null Checks**: Always validate component references in Awake/Start
4. **Object Pooling**: Avoid runtime instantiation for frequently spawned objects
5. **Coroutines**: Use for time-based operations, avoid heavy logic
6. **Events**: Use UnityEvent or C# events for decoupled communication

## Platform Considerations

| Platform | Key Considerations |
|----------|-------------------|
| PC/Mac | Memory less constrained, full shader support |
| Mobile | Texture compression, draw call batching, thermal limits |
| Console | Certification requirements, memory budgets, TCR compliance |
| WebGL | No threading, limited memory, shader restrictions |

## References

- [Unity Documentation](https://docs.unity3d.com/)
- [Unity MCP (CoplayDev)](https://github.com/CoplayDev/unity-mcp)
- [Unity-MCP (IvanMurzak)](https://github.com/IvanMurzak/Unity-MCP)
- [mcp-unity (CoderGamester)](https://github.com/CoderGamester/mcp-unity)
- [Unity Learn](https://learn.unity.com/)
- [Unity Best Practices](https://unity.com/how-to)
