---
name: behavior-trees
description: Behavior tree design and implementation skill for game AI. Enables creation of behavior tree structures, custom nodes, decorators, composites, and integration with game engines for NPC and enemy AI systems.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Behavior Trees Skill

Comprehensive behavior tree design and implementation for game AI systems, supporting multiple engines and frameworks.

## Overview

This skill provides capabilities for designing and implementing behavior trees for game AI. It covers the creation of tree structures, custom nodes, blackboard systems, and integration with Unity, Unreal Engine, and Godot behavior tree implementations.

## Capabilities

### Tree Design
- Design behavior tree structures from specifications
- Create hierarchical AI behaviors
- Balance between reactive and goal-oriented behaviors
- Optimize tree execution for performance

### Node Types
- **Composite Nodes**: Sequence, Selector, Parallel, Random
- **Decorator Nodes**: Inverter, Repeater, Cooldown, Conditional
- **Leaf Nodes**: Actions, Conditions, Services

### Blackboard System
- Design blackboard schemas
- Implement blackboard observers
- Manage shared AI state
- Handle blackboard key types

### Engine Integration
- Unity: NodeCanvas, Behavior Designer, custom implementations
- Unreal: Behavior Tree Editor, custom tasks and services
- Godot: Beehave, LimboAI, custom implementations

### Debugging
- Tree visualization
- Node state tracking
- Execution logging
- Performance profiling

## Prerequisites

### Unity (Node Canvas)
```bash
# Install via Package Manager or Asset Store
# Node Canvas, Behavior Designer, or similar
```

### Unreal Engine (Built-in)
```cpp
// Enable AI Module in Build.cs
PublicDependencyModuleNames.AddRange(new string[] {
    "AIModule",
    "GameplayTasks"
});
```

### Godot (Beehave)
```
# Install via Asset Library
Beehave or LimboAI
```

## Usage Patterns

### Basic Behavior Tree Structure

```
Root
└── Selector (Try behaviors until one succeeds)
    ├── Sequence (Attack if possible)
    │   ├── Condition: HasTarget
    │   ├── Condition: InAttackRange
    │   └── Action: Attack
    ├── Sequence (Chase target)
    │   ├── Condition: HasTarget
    │   ├── Decorator: Cooldown(0.5s)
    │   │   └── Action: MoveToTarget
    │   └── Service: UpdateTargetLocation
    └── Sequence (Patrol)
        ├── Action: MoveToPatrolPoint
        └── Action: Wait(2s)
```

### Unity Implementation (Custom)

```csharp
// BehaviorTree.cs
public class BehaviorTree : MonoBehaviour
{
    private BTNode _root;
    private Blackboard _blackboard;

    private void Start()
    {
        _blackboard = new Blackboard();
        _root = BuildTree();
    }

    private void Update()
    {
        _root?.Execute(_blackboard);
    }

    private BTNode BuildTree()
    {
        return new Selector(
            new Sequence(
                new HasTargetCondition(),
                new InRangeCondition(attackRange: 2f),
                new AttackAction()
            ),
            new Sequence(
                new HasTargetCondition(),
                new Cooldown(0.5f,
                    new MoveToTargetAction()
                )
            ),
            new Sequence(
                new PatrolAction(),
                new WaitAction(2f)
            )
        );
    }
}

// BTNode.cs
public abstract class BTNode
{
    public enum NodeState { Running, Success, Failure }
    public NodeState State { get; protected set; }
    public abstract NodeState Execute(Blackboard blackboard);
}

// Selector.cs
public class Selector : BTNode
{
    private readonly BTNode[] _children;

    public Selector(params BTNode[] children)
    {
        _children = children;
    }

    public override NodeState Execute(Blackboard blackboard)
    {
        foreach (var child in _children)
        {
            var state = child.Execute(blackboard);
            if (state != NodeState.Failure)
            {
                State = state;
                return State;
            }
        }
        State = NodeState.Failure;
        return State;
    }
}

// Sequence.cs
public class Sequence : BTNode
{
    private readonly BTNode[] _children;
    private int _currentIndex;

    public Sequence(params BTNode[] children)
    {
        _children = children;
    }

    public override NodeState Execute(Blackboard blackboard)
    {
        while (_currentIndex < _children.Length)
        {
            var state = _children[_currentIndex].Execute(blackboard);
            if (state == NodeState.Failure)
            {
                _currentIndex = 0;
                State = NodeState.Failure;
                return State;
            }
            if (state == NodeState.Running)
            {
                State = NodeState.Running;
                return State;
            }
            _currentIndex++;
        }
        _currentIndex = 0;
        State = NodeState.Success;
        return State;
    }
}

// Blackboard.cs
public class Blackboard
{
    private readonly Dictionary<string, object> _data = new();

    public void Set<T>(string key, T value) => _data[key] = value;
    public T Get<T>(string key) => _data.TryGetValue(key, out var value) ? (T)value : default;
    public bool Has(string key) => _data.ContainsKey(key);
    public void Remove(string key) => _data.Remove(key);
}
```

### Unreal Engine Implementation (C++)

```cpp
// BTTask_AttackTarget.h
#pragma once

#include "CoreMinimal.h"
#include "BehaviorTree/BTTaskNode.h"
#include "BTTask_AttackTarget.generated.h"

UCLASS()
class MYGAME_API UBTTask_AttackTarget : public UBTTaskNode
{
    GENERATED_BODY()

public:
    UBTTask_AttackTarget();

    virtual EBTNodeResult::Type ExecuteTask(UBehaviorTreeComponent& OwnerComp, uint8* NodeMemory) override;

protected:
    UPROPERTY(EditAnywhere, Category = "Attack")
    float AttackDamage = 10.0f;

    UPROPERTY(EditAnywhere, Category = "Attack")
    float AttackDuration = 1.0f;

    UPROPERTY(EditAnywhere, Category = "Blackboard")
    FBlackboardKeySelector TargetKey;
};

// BTTask_AttackTarget.cpp
#include "BTTask_AttackTarget.h"
#include "AIController.h"
#include "BehaviorTree/BlackboardComponent.h"

UBTTask_AttackTarget::UBTTask_AttackTarget()
{
    NodeName = "Attack Target";
    bNotifyTick = true;
}

EBTNodeResult::Type UBTTask_AttackTarget::ExecuteTask(UBehaviorTreeComponent& OwnerComp, uint8* NodeMemory)
{
    AAIController* AIController = OwnerComp.GetAIOwner();
    if (!AIController)
    {
        return EBTNodeResult::Failed;
    }

    UBlackboardComponent* BlackboardComp = OwnerComp.GetBlackboardComponent();
    AActor* TargetActor = Cast<AActor>(BlackboardComp->GetValueAsObject(TargetKey.SelectedKeyName));

    if (!TargetActor)
    {
        return EBTNodeResult::Failed;
    }

    // Perform attack logic
    // ...

    return EBTNodeResult::Succeeded;
}

// BTService_UpdateTargetLocation.h
#pragma once

#include "CoreMinimal.h"
#include "BehaviorTree/BTService.h"
#include "BTService_UpdateTargetLocation.generated.h"

UCLASS()
class MYGAME_API UBTService_UpdateTargetLocation : public UBTService
{
    GENERATED_BODY()

public:
    UBTService_UpdateTargetLocation();

protected:
    virtual void TickNode(UBehaviorTreeComponent& OwnerComp, uint8* NodeMemory, float DeltaSeconds) override;

    UPROPERTY(EditAnywhere, Category = "Blackboard")
    FBlackboardKeySelector TargetKey;

    UPROPERTY(EditAnywhere, Category = "Blackboard")
    FBlackboardKeySelector TargetLocationKey;
};

// BTDecorator_InRange.h
#pragma once

#include "CoreMinimal.h"
#include "BehaviorTree/BTDecorator.h"
#include "BTDecorator_InRange.generated.h"

UCLASS()
class MYGAME_API UBTDecorator_InRange : public UBTDecorator
{
    GENERATED_BODY()

public:
    UBTDecorator_InRange();

protected:
    virtual bool CalculateRawConditionValue(UBehaviorTreeComponent& OwnerComp, uint8* NodeMemory) const override;

    UPROPERTY(EditAnywhere, Category = "Range")
    float AcceptableRadius = 200.0f;

    UPROPERTY(EditAnywhere, Category = "Blackboard")
    FBlackboardKeySelector TargetKey;
};
```

### Godot Implementation (GDScript with Beehave)

```gdscript
# enemy_ai.gd
extends CharacterBody2D

@onready var behavior_tree: BeehaveTree = $BeehaveTree
@onready var blackboard: Blackboard = $Blackboard

func _ready() -> void:
    blackboard.set_value("patrol_points", $PatrolPoints.get_children())
    blackboard.set_value("current_patrol_index", 0)

# has_target_condition.gd
extends ConditionLeaf
class_name HasTargetCondition

func tick(actor: Node, blackboard: Blackboard) -> int:
    var target = blackboard.get_value("target")
    if target != null and is_instance_valid(target):
        return SUCCESS
    return FAILURE

# in_attack_range_condition.gd
extends ConditionLeaf
class_name InAttackRangeCondition

@export var attack_range: float = 50.0

func tick(actor: Node, blackboard: Blackboard) -> int:
    var target = blackboard.get_value("target")
    if target == null:
        return FAILURE

    var distance = actor.global_position.distance_to(target.global_position)
    if distance <= attack_range:
        return SUCCESS
    return FAILURE

# attack_action.gd
extends ActionLeaf
class_name AttackAction

@export var damage: int = 10
@export var attack_duration: float = 0.5

var _attack_timer: float = 0.0
var _is_attacking: bool = false

func tick(actor: Node, blackboard: Blackboard) -> int:
    if not _is_attacking:
        _start_attack(actor, blackboard)
        return RUNNING

    _attack_timer -= get_process_delta_time()
    if _attack_timer <= 0:
        _finish_attack(actor, blackboard)
        return SUCCESS

    return RUNNING

func _start_attack(actor: Node, blackboard: Blackboard) -> void:
    _is_attacking = true
    _attack_timer = attack_duration
    # Play attack animation, etc.

func _finish_attack(actor: Node, blackboard: Blackboard) -> void:
    _is_attacking = false
    var target = blackboard.get_value("target")
    if target and target.has_method("take_damage"):
        target.take_damage(damage)

# move_to_target_action.gd
extends ActionLeaf
class_name MoveToTargetAction

@export var move_speed: float = 100.0
@export var arrival_distance: float = 10.0

func tick(actor: Node, blackboard: Blackboard) -> int:
    var target = blackboard.get_value("target")
    if target == null:
        return FAILURE

    var target_pos = target.global_position
    var distance = actor.global_position.distance_to(target_pos)

    if distance <= arrival_distance:
        return SUCCESS

    var direction = (target_pos - actor.global_position).normalized()
    actor.velocity = direction * move_speed
    actor.move_and_slide()

    return RUNNING
```

## Integration with Babysitter SDK

### Task Definition Example

```javascript
const behaviorTreeTask = defineTask({
  name: 'behavior-tree-design',
  description: 'Design and implement behavior tree for AI',

  inputs: {
    engine: { type: 'string', required: true }, // unity, unreal, godot
    aiType: { type: 'string', required: true }, // enemy, npc, companion
    behaviors: { type: 'array', required: true },
    outputPath: { type: 'string', required: true }
  },

  outputs: {
    treePath: { type: 'string' },
    nodeFiles: { type: 'array' },
    success: { type: 'boolean' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Design behavior tree for ${inputs.aiType}`,
      skill: {
        name: 'behavior-trees',
        context: {
          operation: 'design_tree',
          engine: inputs.engine,
          aiType: inputs.aiType,
          behaviors: inputs.behaviors,
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

## Common Behavior Patterns

### Combat AI
```
Selector
├── Sequence [Flee if low health]
│   ├── Condition: HealthBelowThreshold(20%)
│   └── Action: FleeFromTarget
├── Sequence [Attack in range]
│   ├── Condition: HasTarget
│   ├── Condition: InAttackRange
│   └── Action: Attack
├── Sequence [Approach target]
│   ├── Condition: HasTarget
│   └── Action: MoveToTarget
└── Action: SearchForTarget
```

### Patrol AI
```
Selector
├── Sequence [Investigate disturbance]
│   ├── Condition: HeardNoise
│   ├── Action: MoveToNoiseLocation
│   └── Action: LookAround
├── Sequence [Patrol]
│   ├── Action: MoveToNextPatrolPoint
│   ├── Action: Wait(2s)
│   └── Action: AdvancePatrolIndex
└── Action: Idle
```

### Companion AI
```
Selector
├── Sequence [Help player in combat]
│   ├── Condition: PlayerInCombat
│   ├── Condition: HasTarget
│   └── Action: AttackPlayerTarget
├── Sequence [Heal player]
│   ├── Condition: PlayerHealthLow
│   ├── Condition: HasHealAbility
│   └── Action: HealPlayer
├── Sequence [Follow player]
│   ├── Condition: TooFarFromPlayer
│   └── Action: MoveToPlayer
└── Action: IdleNearPlayer
```

## Best Practices

1. **Keep Trees Shallow**: Deep trees are harder to debug and maintain
2. **Use Services**: Update blackboard values in services, not conditions
3. **Fail Fast**: Put cheap conditions before expensive ones
4. **Blackboard Keys**: Use typed keys and validate at design time
5. **Modular Nodes**: Create reusable, single-purpose nodes
6. **Debug Visualization**: Always implement tree visualization for debugging

## Performance Considerations

| Optimization | Description |
|--------------|-------------|
| Conditional Aborts | Stop lower-priority branches when conditions change |
| Service Intervals | Don't update every frame if not needed |
| Blackboard Observers | React to changes instead of polling |
| Node Pooling | Reuse node instances for dynamic trees |

## References

- [Behavior Trees in Game AI](https://www.gamedeveloper.com/programming/behavior-trees-for-ai-how-they-work)
- [Unreal Engine Behavior Trees](https://docs.unrealengine.com/5.0/en-US/behavior-trees-in-unreal-engine/)
- [Beehave (Godot)](https://github.com/bitbrain/beehave)
- [ClaudeAI Plugin for UE5](https://claudeaiplugin.com/) - Generates Behavior Trees
- [Understanding Behavior Trees](https://www.behaviortree.dev/)
