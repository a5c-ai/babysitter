# Navigation Mesh Skill

## Overview

The Navigation Mesh skill provides comprehensive support for creating and utilizing navigation meshes for game AI pathfinding. It covers navmesh generation, agent configuration, dynamic obstacles, off-mesh links, and runtime navigation across Unity, Unreal Engine, and Godot.

## Purpose

Navigation meshes are fundamental to game AI, enabling characters to move intelligently through complex environments. This skill bridges LLM capabilities with navigation system design, enabling:

- **NavMesh Configuration**: Set up optimal navigation mesh settings
- **Agent Design**: Configure AI agent movement parameters
- **Pathfinding Integration**: Implement path queries and following
- **Dynamic Navigation**: Handle runtime obstacles and updates

## Use Cases

### 1. Basic AI Movement
Set up navigation for NPCs and enemies to move around levels.

### 2. Stealth Game AI
Configure guard patrol routes with area costs for cover zones.

### 3. RTS Unit Navigation
Set up navigation for different unit types with varying sizes.

### 4. Open World Navigation
Configure large-scale navigation with streaming and LOD.

## Processes That Use This Skill

- **AI Behavior Implementation** (`ai-behavior-implementation.js`)
- **Gameplay Systems** (`gameplay-systems.js`)
- **Level Design Process** (`level-design-process.js`)
- **Vertical Slice Development** (`vertical-slice-development.js`)

## Engine Support

### Unity
- **Package**: `com.unity.ai.navigation`
- **Components**: NavMeshSurface, NavMeshAgent, NavMeshObstacle, OffMeshLink
- **Features**: Runtime baking, area types, agent types, modifiers

### Unreal Engine
- **Module**: NavigationSystem
- **Components**: NavMesh Bounds Volume, Nav Modifier, Nav Link Proxy
- **Features**: Dynamic runtime, EQS integration, custom filters

### Godot
- **Nodes**: NavigationRegion2D/3D, NavigationAgent2D/3D, NavigationObstacle2D/3D
- **Features**: NavigationServer API, avoidance, links

## Configuration

### Agent Types

| Agent Type | Radius | Height | Use Case |
|------------|--------|--------|----------|
| Humanoid | 0.4m | 2.0m | Players, humans |
| Small | 0.2m | 0.5m | Pets, robots |
| Large | 0.8m | 3.0m | Vehicles, giants |
| Flying | 0.3m | 0.5m | Drones (3D only) |

### Area Types

| Area | Cost | Description |
|------|------|-------------|
| Default | 1.0 | Standard walkable surface |
| Road | 0.5 | Faster travel, preferred |
| Grass | 1.5 | Slower, avoid if possible |
| Mud | 2.5 | Very slow terrain |
| Danger | 5.0 | Hazardous, strong avoidance |
| Jump | 2.0 | Off-mesh link cost |

## Example Workflows

### Setting Up Basic Navigation

```
Input: "Set up navigation for a humanoid AI in a building"

Steps:
1. Configure NavMesh bake settings for indoor scale
2. Create walkable area markup for floors
3. Add NavMesh obstacles for furniture
4. Configure agent parameters (radius, height, speed)
5. Implement basic movement script
```

### Dynamic Obstacle System

```
Input: "Create a door that blocks AI navigation when closed"

Steps:
1. Create door with NavMesh obstacle component
2. Configure carving settings
3. Implement open/close state handling
4. Update navmesh on state change
5. Test pathfinding around closed door
```

### Multi-Agent Setup

```
Input: "Configure navigation for infantry and vehicle units"

Steps:
1. Create infantry agent type (small radius)
2. Create vehicle agent type (large radius)
3. Configure area costs for roads vs terrain
4. Set up appropriate obstacles for each type
5. Test pathfinding for both agent types
```

## Integration with Other Skills

- **behavior-trees-skill**: AI decision making
- **astar-skill**: Custom pathfinding algorithms
- **steering-behaviors-skill**: Local avoidance
- **unity-development-skill**: Unity integration
- **unreal-development-skill**: Unreal integration

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No path found | NavMesh not generated | Rebake navmesh |
| Agent stuck | Radius too large | Reduce agent radius |
| Floating agents | Wrong height | Adjust agent height |
| Performance spikes | Too many queries | Implement path caching |
| Agents overlap | No avoidance | Enable avoidance |

### Debug Visualization

**Unity:**
```csharp
// Show navmesh in editor
NavMesh.GetAllAreas();
// Enable gizmos for NavMeshAgent
```

**Unreal:**
```
// Console command
show Navigation
```

**Godot:**
```gdscript
# Enable in Project Settings > Debug > Navigation
```

## Best Practices

1. **Match Agent to Character** - Agent radius should match collision
2. **Use Area Costs** - Guide AI naturally through level design
3. **Batch Updates** - Don't update navmesh every frame
4. **Test Edge Cases** - Verify paths near obstacles and corners
5. **Profile Performance** - Monitor pathfinding query costs
6. **Consider Scale** - Large worlds need hierarchical pathfinding

## Performance Guidelines

| Scenario | Recommendation |
|----------|----------------|
| < 50 agents | Standard pathfinding |
| 50-200 agents | Path caching, async queries |
| 200+ agents | Hierarchical, flow fields |
| Large world | Streaming navmesh, LOD |
| Frequent updates | NavMesh tiles, local updates |

## Advanced Topics

### Hierarchical Pathfinding
Pre-compute region connectivity for faster long-distance queries.

### Flow Fields
Alternative to individual pathfinding for large groups.

### NavMesh Streaming
Load/unload navigation data with level streaming.

### Custom Query Filters
Create gameplay-specific path preferences.

## References

- [Unity AI Navigation](https://docs.unity3d.com/Packages/com.unity.ai.navigation@1.1/manual/index.html)
- [Unreal Navigation System](https://docs.unrealengine.com/5.0/en-US/navigation-system-in-unreal-engine/)
- [Godot NavigationServer](https://docs.godotengine.org/en/stable/tutorials/navigation/navigation_introduction_2d.html)
- [Recast Navigation Library](https://github.com/recastnavigation/recastnavigation)
- [A* Pathfinding Project](https://arongranberg.com/astar/)
- [Navigation Mesh Generation](https://www.gamedeveloper.com/programming/navigation-mesh-generation)
