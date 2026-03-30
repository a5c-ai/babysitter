---
name: unreal-blueprint
description: Unreal Engine Blueprint visual scripting skill for macros, functions, event graphs, and rapid prototyping.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unreal Blueprint Skill

Blueprint visual scripting for Unreal Engine development.

## Overview

This skill provides capabilities for implementing gameplay logic using Unreal Engine's Blueprint visual scripting system.

## Capabilities

### Event Graphs
- Create gameplay events
- Handle input events
- Implement tick logic
- Manage event dispatchers

### Functions and Macros
- Create reusable functions
- Implement blueprint macros
- Handle local variables
- Manage pure functions

### Variables and Data
- Create exposed variables
- Implement struct handling
- Manage data tables
- Handle enumerations

### Blueprint Communication
- Implement interfaces
- Use event dispatchers
- Handle casting
- Manage component references

## Prerequisites

- Unreal Engine 5.0+
- Blueprint editor knowledge

## Usage Patterns

### Event Dispatcher Pattern

```
1. Create Custom Event Dispatcher in source Blueprint
2. Bind to dispatcher in receiving Blueprint
3. Call dispatcher on events
4. Handle in bound functions
```

### Blueprint Interface

```
1. Create Blueprint Interface asset
2. Add function signatures
3. Implement interface in Blueprints
4. Call interface functions on actors
```

### Component-Based Design

```
1. Create Actor Component Blueprint
2. Implement reusable logic
3. Add component to actors
4. Access via Get Component
```

## Best Practices

1. Use functions for reusable logic
2. Keep event graphs organized
3. Comment complex sections
4. Use interfaces over casting
5. Profile with Blueprint Profiler

## References

- [Blueprint Documentation](https://docs.unrealengine.com/5.0/en-US/blueprints-visual-scripting-in-unreal-engine/)
