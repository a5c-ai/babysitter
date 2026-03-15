---
name: semantic-kernel-setup
description: Microsoft Semantic Kernel planner and plugin setup for orchestrated AI
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Semantic Kernel Setup Skill

## Capabilities

- Configure Semantic Kernel with AI services
- Create semantic and native functions (plugins)
- Set up planners (Handlebars, Stepwise)
- Implement memory connectors
- Design kernel function chains
- Configure automatic function calling

## Target Processes

- function-calling-agent
- plan-and-execute-agent

## Implementation Details

### Core Components

1. **Kernel**: Central orchestrator
2. **Plugins**: Collections of functions
3. **Planners**: Goal to action decomposition
4. **Memory**: Context and semantic storage

### Planner Types

- Handlebars Planner
- Stepwise Planner
- Function Calling Stepwise

### Configuration Options

- AI service connectors (OpenAI, Azure)
- Plugin registration
- Planner selection
- Memory backend
- Logging and telemetry

### Best Practices

- Clear function descriptions
- Appropriate planner selection
- Plugin organization
- Error handling patterns

### Dependencies

- semantic-kernel
