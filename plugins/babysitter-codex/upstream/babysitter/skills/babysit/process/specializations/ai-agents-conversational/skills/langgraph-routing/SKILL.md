---
name: langgraph-routing
description: Conditional edge routing and state-based transitions for LangGraph workflows
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# LangGraph Routing Skill

## Capabilities

- Design conditional edge routing in LangGraph
- Implement state-based transition logic
- Create dynamic routing functions
- Handle multi-path workflow branches
- Implement router nodes for complex decisions
- Design fallback and error routing paths

## Target Processes

- langgraph-workflow-design
- plan-and-execute-agent

## Implementation Details

### Routing Patterns

1. **Conditional Edges**: add_conditional_edges with routing functions
2. **Router Nodes**: Dedicated nodes for routing decisions
3. **State-Based Routing**: Routing based on state values
4. **LLM-Based Routing**: Using LLM to determine next node

### Configuration Options

- Routing function definitions
- Path mapping configurations
- Default/fallback routes
- Cycle detection settings
- Max iteration limits

### Best Practices

- Clear routing logic documentation
- Handle all possible states
- Implement fallback paths
- Avoid infinite cycles
- Use descriptive edge names

### Dependencies

- langgraph
