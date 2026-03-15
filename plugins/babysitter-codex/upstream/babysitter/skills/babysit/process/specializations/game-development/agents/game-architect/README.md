# Game Architect Agent

## Overview

The Game Architect agent is an autonomous agent specialized in designing game systems architecture. It handles technical design decisions, produces architecture documentation, and provides guidance on implementing scalable, maintainable game systems across Unity, Unreal Engine, and Godot.

## Purpose

Game architecture requires balancing performance, maintainability, and extensibility while working within engine constraints. This agent automates architectural design tasks:

- **System Design**: Create comprehensive system architectures
- **Pattern Selection**: Choose appropriate design patterns for game problems
- **Documentation**: Produce technical design documents and ADRs
- **Review**: Evaluate existing architectures and suggest improvements

## Capabilities

| Capability | Description |
|------------|-------------|
| System Architecture | Design component hierarchies and data flow |
| Pattern Selection | Choose patterns suited to game problems |
| Technical Documentation | Create TDDs, ADRs, and diagrams |
| Code Review | Evaluate architectural decisions |
| Integration Planning | Design system interfaces |
| Performance Planning | Define budgets and optimization strategies |

## Required Skills

This agent requires the following skills:

1. **unity-development**: Unity architecture patterns and best practices
2. **unreal-development**: Unreal architecture patterns and modules
3. **godot-development**: Godot node patterns and composition
4. **behavior-trees**: AI system architecture

## Processes That Use This Agent

- **Vertical Slice Development** (`vertical-slice-development.js`)
- **Gameplay Systems** (`gameplay-systems.js`)
- **Game Engine Setup** (`game-engine-setup.js`)
- **Performance Optimization** (`performance-optimization.js`)
- **Technical Development** processes

## Workflow

### Phase 1: Requirements Analysis

```
Input: System requirements and constraints
Output: Analyzed requirements with priorities

Steps:
1. Parse functional requirements
2. Identify non-functional requirements
3. Map platform constraints
4. Define success criteria
```

### Phase 2: Architecture Design

```
Input: Analyzed requirements
Output: System architecture

Steps:
1. Select design patterns
2. Define component structure
3. Design interfaces
4. Plan data flow
5. Address cross-cutting concerns
```

### Phase 3: Documentation

```
Input: Architecture design
Output: Technical documentation

Steps:
1. Create architecture overview
2. Write detailed specifications
3. Generate diagrams
4. Document decisions (ADRs)
```

### Phase 4: Implementation Guidance

```
Input: Completed architecture
Output: Implementation plan

Steps:
1. Define priority order
2. Identify risk areas
3. Create testing strategy
4. Provide code examples
```

## Input Specification

```json
{
  "task": "design_system",
  "engine": "unity",
  "systemType": "inventory",
  "requirements": {
    "functional": [
      "Store items with stacking",
      "Support equipment slots",
      "Enable item crafting",
      "Persist across sessions"
    ],
    "nonFunctional": [
      "Handle 1000+ unique items",
      "Support multiplayer sync",
      "Load in under 100ms"
    ],
    "constraints": [
      "Mobile memory budget",
      "Offline support required"
    ]
  },
  "outputFormat": "tdd"
}
```

## Output Specification

```json
{
  "success": true,
  "architecture": {
    "overview": "Event-driven inventory system using ScriptableObjects for item definitions and component-based containers",
    "patterns": [
      "Observer (inventory events)",
      "Flyweight (item definitions)",
      "Strategy (container behaviors)"
    ],
    "components": [
      {
        "name": "InventoryManager",
        "responsibility": "Central coordination of all inventory operations",
        "dependencies": ["EventBus"],
        "interfaces": ["IInventoryProvider"]
      },
      {
        "name": "ItemContainer",
        "responsibility": "Store and manage items in slots",
        "dependencies": ["InventoryManager"],
        "interfaces": ["IItemContainer"]
      },
      {
        "name": "ItemDefinition",
        "responsibility": "Immutable item template data",
        "dependencies": [],
        "interfaces": []
      }
    ],
    "dataFlow": {
      "description": "Items flow from world -> container -> equipment",
      "diagram": "mermaid flowchart..."
    }
  },
  "decisions": [
    {
      "decision": "Use ScriptableObjects for item definitions",
      "rationale": "Memory efficient, designer friendly, easy serialization",
      "alternatives": ["JSON files", "Database"],
      "consequences": ["Unity-specific", "Version control friendly"]
    }
  ],
  "implementationGuidelines": {
    "priorityOrder": [
      "1. ItemDefinition ScriptableObjects",
      "2. Basic ItemContainer",
      "3. InventoryManager",
      "4. Equipment system",
      "5. Crafting system"
    ],
    "riskAreas": [
      "Multiplayer synchronization",
      "Save/load complexity"
    ],
    "testingStrategy": "Unit tests for container logic, integration tests for persistence"
  }
}
```

## Design Patterns

The agent recommends patterns based on problem type:

### Creational Patterns
| Pattern | Use Case |
|---------|----------|
| Factory | Object spawning with variations |
| Object Pool | Frequently created/destroyed objects |
| Singleton | Global managers (use sparingly) |
| Prototype | Clone-based instantiation |

### Structural Patterns
| Pattern | Use Case |
|---------|----------|
| Component | Entity composition |
| Decorator | Dynamic capability addition |
| Facade | Simplify complex subsystems |
| Flyweight | Shared immutable data |

### Behavioral Patterns
| Pattern | Use Case |
|---------|----------|
| Command | Input handling, undo/redo |
| Observer | Event systems |
| State | Character states, game states |
| Strategy | Interchangeable algorithms |

## Engine-Specific Guidance

### Unity
- Use ScriptableObjects for data assets
- Prefer composition with MonoBehaviours
- Use UnityEvents for designer-hookable events
- Consider Assembly Definitions for large projects

### Unreal Engine
- Leverage GameplayAbilitySystem for abilities
- Use DataAssets for configuration
- Follow Unreal's subsystem patterns
- Use Blueprints for designer iteration

### Godot
- Compose with nodes, not inheritance
- Use signals for loose coupling
- Leverage Resources for data
- Keep autoloads minimal

## Integration

### With Other Agents

```
technical-director-agent ──> game-architect ──> gameplay-programmer-agent
         │                                               │
         └── high-level requirements                     └── detailed implementation
```

### With Skills

```
game-architect
    ├── unity-development (Unity patterns)
    ├── unreal-development (Unreal patterns)
    ├── godot-development (Godot patterns)
    └── behavior-trees (AI architecture)
```

## Usage Example

### In Babysitter Process

```javascript
// vertical-slice-development.js

const architectureResult = await ctx.task(architectureTask, {
  engine: 'unity',
  systemType: 'combat',
  requirements: {
    functional: [
      'Melee and ranged attacks',
      'Combo system',
      'Damage types and resistances'
    ],
    nonFunctional: [
      '60 FPS on target hardware',
      'Extensible for new weapons'
    ]
  }
});

// Use architecture in subsequent tasks
if (architectureResult.success) {
  ctx.log('info', 'Architecture designed');
  // Proceed with implementation
}
```

## Best Practices

1. **Start Simple** - Begin with minimal viable architecture
2. **Document Why** - Record rationale, not just what
3. **Consider Change** - Design for likely extension points
4. **Follow Conventions** - Use engine idioms and patterns
5. **Plan Testing** - Design for testability
6. **Budget Performance** - Define limits early

## Common Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| God Object | Too many responsibilities | Split into focused components |
| Spaghetti | Unclear dependencies | Use interfaces, events |
| Over-Engineering | Unnecessary complexity | YAGNI - start simple |
| Premature Optimization | Wasted effort | Profile first, optimize second |

## Related Resources

- Skills: `unity-development/SKILL.md`, `unreal-development/SKILL.md`
- Processes: `gameplay-systems.js`, `vertical-slice-development.js`
- External: [Game Programming Patterns](https://gameprogrammingpatterns.com/)
- External: [Game Architecture Best Practices](https://www.gamedev.net/tutorials/programming/)
