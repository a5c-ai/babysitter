# Behavior Trees Skill

## Overview

The Behavior Trees skill provides comprehensive support for designing and implementing behavior trees for game AI. It covers tree structure design, custom node creation, blackboard management, and integration with major game engines including Unity, Unreal Engine, and Godot.

## Purpose

Behavior trees are the industry standard for game AI, used in thousands of games from indie to AAA. This skill bridges LLM capabilities with behavior tree design, enabling:

- **Tree Structure Design**: Create well-organized AI behaviors from natural language descriptions
- **Custom Node Development**: Generate task, service, and decorator nodes
- **Blackboard Integration**: Design and implement AI state management
- **Engine Integration**: Support for Unity, Unreal, and Godot implementations

## Use Cases

### 1. Enemy AI Design
Create complex enemy behaviors with patrol, chase, attack, and flee states.

### 2. NPC Behavior
Design companion, shopkeeper, or quest-giver AI with appropriate reactions.

### 3. Boss Encounters
Build multi-phase boss AI with state transitions and attack patterns.

### 4. Stealth AI
Implement guard AI with detection, investigation, and alert states.

## Processes That Use This Skill

- **AI Behavior Implementation** (`ai-behavior-implementation.js`)
- **Gameplay Systems** (`gameplay-systems.js`)
- **Core Mechanics Prototyping** (`core-mechanics-prototyping.js`)
- **Vertical Slice Development** (`vertical-slice-development.js`)

## Node Types

### Composite Nodes
| Node | Behavior |
|------|----------|
| Selector | Try children until one succeeds (OR) |
| Sequence | Run children until one fails (AND) |
| Parallel | Run all children simultaneously |
| Random Selector | Try random child |
| Random Sequence | Run children in random order |

### Decorator Nodes
| Node | Behavior |
|------|----------|
| Inverter | Flip success/failure |
| Repeater | Run child N times |
| Retry | Retry on failure |
| Cooldown | Add delay between executions |
| Conditional | Guard with condition |
| Force Success/Failure | Override result |

### Leaf Nodes
| Node | Behavior |
|------|----------|
| Action | Execute game logic |
| Condition | Check game state |
| Service | Background task (Unreal) |
| Wait | Pause execution |

## Engine-Specific Implementation

### Unity

**Recommended Libraries:**
- NodeCanvas (Asset Store)
- Behavior Designer (Asset Store)
- Custom implementation

**Setup:**
```csharp
// Add to AI controller
BehaviorTree tree = GetComponent<BehaviorTree>();
tree.SetBlackboard(blackboard);
tree.StartBehavior();
```

### Unreal Engine

**Built-in Support:**
- Behavior Tree Editor
- Blackboard assets
- EQS integration

**Setup:**
```cpp
// In AI Controller
AAIController::OnPossess(APawn* InPawn)
{
    Super::OnPossess(InPawn);

    if (BehaviorTreeAsset)
    {
        RunBehaviorTree(BehaviorTreeAsset);
    }
}
```

### Godot

**Recommended Libraries:**
- Beehave (GDScript)
- LimboAI (C++)
- Custom implementation

**Setup:**
```gdscript
# Add BeehaveTree node to scene
# Configure tree in editor or code
@onready var tree: BeehaveTree = $BeehaveTree
```

## Example Workflows

### Creating Enemy AI

```
Input: "Create a melee enemy that patrols, chases player when spotted, and attacks when in range"

Steps:
1. Design tree structure with patrol, chase, attack branches
2. Generate condition nodes (HasTarget, InRange, etc.)
3. Generate action nodes (Patrol, MoveToTarget, Attack)
4. Create blackboard schema
5. Implement perception system integration
```

### Creating Boss AI

```
Input: "Create a boss with 3 phases that change based on health"

Steps:
1. Design phase selector based on health thresholds
2. Create phase-specific attack patterns
3. Implement phase transition behaviors
4. Add special ability cooldowns
5. Create adds/minion spawning behaviors
```

## Integration with Other Skills

- **navmesh-skill**: Pathfinding for movement actions
- **utility-ai-skill**: Decision scoring
- **perception-system-skill**: Target detection
- **fsm-skill**: Hybrid FSM/BT approaches

## Debugging

### Visualization
Most engines provide tree visualization during play:
- Unity: Use debugger window in NodeCanvas/Behavior Designer
- Unreal: Use Behavior Tree Debugger (F5 with AI selected)
- Godot: Beehave provides debug overlay

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Stuck in Running | Action never completes | Add timeout or completion check |
| Rapid switching | Conditions flapping | Add hysteresis or cooldowns |
| Not finding target | Blackboard not updated | Check service intervals |
| Performance | Too many nodes | Optimize tree structure |

## Best Practices

1. **Design Top-Down** - Start with high-level behaviors, then detail
2. **Single Responsibility** - Each node does one thing
3. **Fail Fast** - Put cheap checks before expensive ones
4. **Use Decorators** - Avoid duplicating logic in nodes
5. **Blackboard Discipline** - Define clear key ownership
6. **Test Isolated** - Test subtrees independently

## Performance Tips

1. **Conditional Aborts** - Interrupt lower-priority behaviors
2. **Service Intervals** - Don't update every frame
3. **Parallel Limits** - Control simultaneous executions
4. **Event-Driven** - Use blackboard observers
5. **LOD for AI** - Simplify distant AI trees

## References

- [Behavior Trees in Game AI](https://www.gamedeveloper.com/programming/behavior-trees-for-ai-how-they-work)
- [Unreal Engine Behavior Trees](https://docs.unrealengine.com/5.0/en-US/behavior-trees-in-unreal-engine/)
- [Beehave for Godot](https://github.com/bitbrain/beehave)
- [ClaudeAI Plugin for UE5](https://claudeaiplugin.com/)
- [Understanding Behavior Trees](https://www.behaviortree.dev/)
- [AI and Games - Behavior Trees](https://www.youtube.com/watch?v=uq8hnnkAxsw)
