---
name: navmesh
description: Navigation mesh generation and pathfinding skill for game AI. Enables creation and configuration of navigation meshes, pathfinding queries, dynamic obstacles, and navigation agent setup across Unity, Unreal, and Godot engines.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Navigation Mesh Skill

Comprehensive navigation mesh generation and pathfinding implementation for game AI systems across multiple engines.

## Overview

This skill provides capabilities for creating, configuring, and utilizing navigation meshes for AI pathfinding. It covers navmesh generation, agent configuration, dynamic obstacles, off-mesh links, and runtime navigation queries.

## Capabilities

### NavMesh Generation
- Configure navmesh build settings
- Define walkable areas and surfaces
- Set up area types with costs
- Generate runtime navmeshes

### Agent Configuration
- Configure agent radius and height
- Set movement parameters
- Define avoidance priorities
- Configure step height and slopes

### Pathfinding
- Query paths between points
- Handle partial paths
- Implement path smoothing
- Support hierarchical pathfinding

### Dynamic Navigation
- Handle dynamic obstacles
- Implement navmesh carving
- Update navmesh at runtime
- Handle moving platforms

### Off-Mesh Links
- Create jump links
- Configure drop connections
- Handle ladders and teleports
- Set up one-way paths

## Prerequisites

### Unity
```csharp
// Built-in: Package Manager > AI Navigation
// Install: com.unity.ai.navigation
```

### Unreal Engine
```cpp
// Enable NavigationSystem module in Build.cs
PublicDependencyModuleNames.AddRange(new string[] {
    "NavigationSystem",
    "AIModule"
});
```

### Godot
```
# Enable NavigationServer2D/3D in project settings
# Use NavigationRegion2D/3D and NavigationAgent2D/3D nodes
```

## Usage Patterns

### Unity Navigation Setup

```csharp
// NavMeshAgent configuration
using UnityEngine;
using UnityEngine.AI;

public class AINavigation : MonoBehaviour
{
    [Header("Navigation Settings")]
    [SerializeField] private float moveSpeed = 3.5f;
    [SerializeField] private float angularSpeed = 120f;
    [SerializeField] private float stoppingDistance = 0.5f;

    private NavMeshAgent _agent;
    private Transform _target;

    private void Awake()
    {
        _agent = GetComponent<NavMeshAgent>();
        ConfigureAgent();
    }

    private void ConfigureAgent()
    {
        _agent.speed = moveSpeed;
        _agent.angularSpeed = angularSpeed;
        _agent.stoppingDistance = stoppingDistance;
        _agent.autoBraking = true;
    }

    public void SetDestination(Vector3 destination)
    {
        if (NavMesh.SamplePosition(destination, out NavMeshHit hit, 2f, NavMesh.AllAreas))
        {
            _agent.SetDestination(hit.position);
        }
    }

    public void SetTarget(Transform target)
    {
        _target = target;
    }

    private void Update()
    {
        if (_target != null)
        {
            SetDestination(_target.position);
        }
    }

    public bool HasReachedDestination()
    {
        if (!_agent.pathPending)
        {
            if (_agent.remainingDistance <= _agent.stoppingDistance)
            {
                if (!_agent.hasPath || _agent.velocity.sqrMagnitude == 0f)
                {
                    return true;
                }
            }
        }
        return false;
    }

    public bool IsPathValid()
    {
        return _agent.hasPath && _agent.pathStatus == NavMeshPathStatus.PathComplete;
    }
}

// Dynamic NavMesh Obstacle
using UnityEngine;
using UnityEngine.AI;

public class DynamicObstacle : MonoBehaviour
{
    private NavMeshObstacle _obstacle;

    private void Awake()
    {
        _obstacle = GetComponent<NavMeshObstacle>();
        _obstacle.carving = true;
        _obstacle.carvingMoveThreshold = 0.1f;
        _obstacle.carvingTimeToStationary = 0.5f;
    }

    public void EnableCarving(bool enable)
    {
        _obstacle.carving = enable;
    }
}

// Off-Mesh Link Setup
using UnityEngine;
using UnityEngine.AI;

public class JumpLink : MonoBehaviour
{
    [SerializeField] private Transform startPoint;
    [SerializeField] private Transform endPoint;
    [SerializeField] private bool bidirectional = false;

    private OffMeshLink _link;

    private void Awake()
    {
        _link = gameObject.AddComponent<OffMeshLink>();
        _link.startTransform = startPoint;
        _link.endTransform = endPoint;
        _link.biDirectional = bidirectional;
        _link.autoUpdatePositions = true;
    }
}

// NavMesh Surface Runtime Baking
using UnityEngine;
using Unity.AI.Navigation;

public class RuntimeNavMesh : MonoBehaviour
{
    private NavMeshSurface _surface;

    private void Awake()
    {
        _surface = GetComponent<NavMeshSurface>();
    }

    public void RebuildNavMesh()
    {
        _surface.BuildNavMesh();
    }

    public void UpdateNavMesh()
    {
        _surface.UpdateNavMesh(_surface.navMeshData);
    }
}
```

### Unreal Engine Navigation Setup

```cpp
// AINavigationComponent.h
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "NavigationSystem.h"
#include "AINavigationComponent.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class MYGAME_API UAINavigationComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UAINavigationComponent();

    UFUNCTION(BlueprintCallable, Category = "Navigation")
    bool MoveToLocation(FVector Destination);

    UFUNCTION(BlueprintCallable, Category = "Navigation")
    bool MoveToActor(AActor* TargetActor);

    UFUNCTION(BlueprintCallable, Category = "Navigation")
    void StopMovement();

    UFUNCTION(BlueprintCallable, Category = "Navigation")
    bool HasReachedDestination() const;

    UFUNCTION(BlueprintCallable, Category = "Navigation")
    FVector GetRandomReachablePoint(float Radius) const;

protected:
    virtual void BeginPlay() override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Navigation")
    float AcceptanceRadius = 50.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Navigation")
    bool bStopOnOverlap = true;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Navigation")
    bool bUsePathfinding = true;

private:
    class AAIController* AIController;
    class UNavigationSystemV1* NavSystem;
};

// AINavigationComponent.cpp
#include "AINavigationComponent.h"
#include "AIController.h"
#include "NavigationSystem.h"
#include "NavFilters/NavigationQueryFilter.h"

UAINavigationComponent::UAINavigationComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UAINavigationComponent::BeginPlay()
{
    Super::BeginPlay();

    APawn* Pawn = Cast<APawn>(GetOwner());
    if (Pawn)
    {
        AIController = Cast<AAIController>(Pawn->GetController());
    }

    NavSystem = FNavigationSystem::GetCurrent<UNavigationSystemV1>(GetWorld());
}

bool UAINavigationComponent::MoveToLocation(FVector Destination)
{
    if (!AIController) return false;

    FAIMoveRequest MoveRequest;
    MoveRequest.SetGoalLocation(Destination);
    MoveRequest.SetAcceptanceRadius(AcceptanceRadius);
    MoveRequest.SetStopOnOverlap(bStopOnOverlap);
    MoveRequest.SetUsePathfinding(bUsePathfinding);

    FNavPathSharedPtr Path;
    AIController->MoveTo(MoveRequest, &Path);

    return Path.IsValid();
}

bool UAINavigationComponent::MoveToActor(AActor* TargetActor)
{
    if (!AIController || !TargetActor) return false;

    FAIMoveRequest MoveRequest;
    MoveRequest.SetGoalActor(TargetActor);
    MoveRequest.SetAcceptanceRadius(AcceptanceRadius);
    MoveRequest.SetStopOnOverlap(bStopOnOverlap);
    MoveRequest.SetUsePathfinding(bUsePathfinding);

    FNavPathSharedPtr Path;
    AIController->MoveTo(MoveRequest, &Path);

    return Path.IsValid();
}

void UAINavigationComponent::StopMovement()
{
    if (AIController)
    {
        AIController->StopMovement();
    }
}

bool UAINavigationComponent::HasReachedDestination() const
{
    if (!AIController) return false;

    return AIController->GetMoveStatus() == EPathFollowingStatus::Idle;
}

FVector UAINavigationComponent::GetRandomReachablePoint(float Radius) const
{
    FNavLocation RandomPoint;
    if (NavSystem && NavSystem->GetRandomReachablePointInRadius(GetOwner()->GetActorLocation(), Radius, RandomPoint))
    {
        return RandomPoint.Location;
    }
    return GetOwner()->GetActorLocation();
}

// NavMesh Modifier Volume (Blueprint-friendly)
// BTTask_MoveToLocation.h
#pragma once

#include "CoreMinimal.h"
#include "BehaviorTree/BTTaskNode.h"
#include "BTTask_MoveToLocation.generated.h"

UCLASS()
class MYGAME_API UBTTask_MoveToLocation : public UBTTaskNode
{
    GENERATED_BODY()

public:
    UBTTask_MoveToLocation();

    virtual EBTNodeResult::Type ExecuteTask(UBehaviorTreeComponent& OwnerComp, uint8* NodeMemory) override;
    virtual void TickTask(UBehaviorTreeComponent& OwnerComp, uint8* NodeMemory, float DeltaSeconds) override;

protected:
    UPROPERTY(EditAnywhere, Category = "Blackboard")
    FBlackboardKeySelector TargetLocationKey;

    UPROPERTY(EditAnywhere, Category = "Movement")
    float AcceptableRadius = 50.0f;
};
```

### Godot Navigation Setup (GDScript)

```gdscript
# navigation_controller.gd
extends CharacterBody2D
class_name NavigationController

## Movement speed in pixels per second
@export var move_speed: float = 200.0
## Arrival distance threshold
@export var arrival_distance: float = 10.0

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D

var _is_navigating: bool = false

signal destination_reached
signal path_changed

func _ready() -> void:
    nav_agent.velocity_computed.connect(_on_velocity_computed)
    nav_agent.path_changed.connect(_on_path_changed)
    nav_agent.target_reached.connect(_on_target_reached)

    # Configure agent
    nav_agent.path_desired_distance = arrival_distance
    nav_agent.target_desired_distance = arrival_distance

func _physics_process(delta: float) -> void:
    if not _is_navigating:
        return

    if nav_agent.is_navigation_finished():
        _is_navigating = false
        destination_reached.emit()
        return

    var next_path_position := nav_agent.get_next_path_position()
    var direction := global_position.direction_to(next_path_position)
    var velocity := direction * move_speed

    if nav_agent.avoidance_enabled:
        nav_agent.velocity = velocity
    else:
        _move(velocity)

func set_target_position(target: Vector2) -> void:
    nav_agent.target_position = target
    _is_navigating = true

func set_target_node(target: Node2D) -> void:
    set_target_position(target.global_position)

func stop_navigation() -> void:
    _is_navigating = false
    velocity = Vector2.ZERO

func is_navigating() -> bool:
    return _is_navigating

func get_remaining_distance() -> float:
    return nav_agent.distance_to_target()

func _move(vel: Vector2) -> void:
    velocity = vel
    move_and_slide()

func _on_velocity_computed(safe_velocity: Vector2) -> void:
    _move(safe_velocity)

func _on_path_changed() -> void:
    path_changed.emit()

func _on_target_reached() -> void:
    _is_navigating = false
    destination_reached.emit()


# navigation_region_setup.gd
@tool
extends NavigationRegion2D

@export var bake_on_ready: bool = true
@export var auto_rebake_interval: float = 0.0

var _rebake_timer: float = 0.0

func _ready() -> void:
    if not Engine.is_editor_hint() and bake_on_ready:
        call_deferred("bake_navigation_polygon")

func _process(delta: float) -> void:
    if Engine.is_editor_hint():
        return

    if auto_rebake_interval > 0:
        _rebake_timer += delta
        if _rebake_timer >= auto_rebake_interval:
            _rebake_timer = 0.0
            bake_navigation_polygon()

func rebake() -> void:
    bake_navigation_polygon()


# dynamic_obstacle.gd
extends Node2D
class_name DynamicNavObstacle

@export var obstacle_vertices: PackedVector2Array
@export var affect_navigation: bool = true

@onready var nav_obstacle: NavigationObstacle2D = $NavigationObstacle2D

func _ready() -> void:
    if obstacle_vertices.size() > 0:
        nav_obstacle.vertices = obstacle_vertices
    nav_obstacle.avoidance_enabled = affect_navigation

func set_vertices(vertices: PackedVector2Array) -> void:
    nav_obstacle.vertices = vertices

func enable_avoidance(enabled: bool) -> void:
    nav_obstacle.avoidance_enabled = enabled


# navigation_link.gd
extends NavigationLink2D

@export var link_cost: float = 1.0
@export_enum("Bidirectional", "Start to End", "End to Start") var direction: int = 0

func _ready() -> void:
    travel_cost = link_cost
    bidirectional = (direction == 0)

    if direction == 2:
        # Swap start and end for "End to Start"
        var temp := start_position
        start_position = end_position
        end_position = temp
        bidirectional = false
```

## Integration with Babysitter SDK

### Task Definition Example

```javascript
const navmeshSetupTask = defineTask({
  name: 'navmesh-setup',
  description: 'Configure navigation mesh for AI pathfinding',

  inputs: {
    engine: { type: 'string', required: true }, // unity, unreal, godot
    agentType: { type: 'string', required: true },
    settings: { type: 'object', required: true },
    outputPath: { type: 'string', required: true }
  },

  outputs: {
    configPath: { type: 'string' },
    componentFiles: { type: 'array' },
    success: { type: 'boolean' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Setup navmesh for ${inputs.agentType}`,
      skill: {
        name: 'navmesh',
        context: {
          operation: 'configure_navigation',
          engine: inputs.engine,
          agentType: inputs.agentType,
          settings: inputs.settings,
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

## Agent Configuration Parameters

| Parameter | Description | Typical Values |
|-----------|-------------|----------------|
| Agent Radius | Collision radius | 0.3-0.6 meters |
| Agent Height | Full agent height | 1.5-2.0 meters |
| Max Slope | Walkable slope angle | 30-45 degrees |
| Step Height | Climbable step | 0.3-0.5 meters |
| Max Speed | Movement speed | 3-10 m/s |
| Acceleration | Speed change rate | 8-20 m/s^2 |

## Area Types and Costs

| Area Type | Cost | Use Case |
|-----------|------|----------|
| Walkable | 1.0 | Default ground |
| Road | 0.5 | Preferred paths |
| Grass | 1.5 | Slower terrain |
| Water (shallow) | 2.0 | Passable but slow |
| Water (deep) | Infinity | Not passable |
| Danger | 3.0 | Avoid if possible |

## Best Practices

1. **Agent Sizing**: Match agent radius to character collision
2. **Area Costs**: Use costs to influence path preferences naturally
3. **Dynamic Updates**: Batch navmesh updates for performance
4. **Off-Mesh Links**: Use for jumps, drops, ladders appropriately
5. **Debugging**: Always enable navmesh visualization during development
6. **LOD**: Simplify navmesh for large open areas

## Performance Considerations

| Optimization | Description |
|--------------|-------------|
| Hierarchical Pathfinding | Pre-compute region graph for long paths |
| Path Caching | Reuse paths when destination unchanged |
| Async Pathfinding | Don't block main thread |
| NavMesh Tiles | Enable incremental updates |
| Query Filters | Limit search scope |

## References

- [Unity AI Navigation](https://docs.unity3d.com/Packages/com.unity.ai.navigation@1.1/manual/index.html)
- [Unreal Engine Navigation System](https://docs.unrealengine.com/5.0/en-US/navigation-system-in-unreal-engine/)
- [Godot NavigationServer](https://docs.godotengine.org/en/stable/tutorials/navigation/navigation_introduction_2d.html)
- [Recast Navigation](https://github.com/recastnavigation/recastnavigation)
- [A* Pathfinding Project (Unity)](https://arongranberg.com/astar/)
