---
name: langgraph-subgraph
description: Subgraph composition and modular workflow design for LangGraph
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# LangGraph Subgraph Skill

## Capabilities

- Design modular subgraph components
- Compose subgraphs into parent workflows
- Handle state mapping between graphs
- Implement subgraph reusability patterns
- Design subgraph interfaces and contracts
- Handle subgraph error isolation

## Target Processes

- multi-agent-system
- langgraph-workflow-design

## Implementation Details

### Subgraph Patterns

1. **Compiled Subgraphs**: Pre-compiled reusable components
2. **State Mapping**: Input/output state transformation
3. **Nested Subgraphs**: Multi-level graph composition
4. **Parallel Subgraphs**: Concurrent subgraph execution

### Configuration Options

- State schema alignment
- Input/output key mapping
- Error propagation settings
- Subgraph checkpoint inheritance
- Timeout configurations

### Best Practices

- Clear subgraph interfaces
- Minimal state coupling
- Proper error boundaries
- Reusable component design
- Documentation for subgraph contracts

### Dependencies

- langgraph
