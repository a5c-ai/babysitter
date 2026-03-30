---
name: langgraph-state-graph
description: LangGraph StateGraph builder with state schema design. Create stateful agent workflows with cycles, conditionals, and persistence.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob, WebFetch
---

# langgraph-state-graph

Build stateful agent workflows using LangGraph's StateGraph pattern. Design state schemas, create nodes, define edges with conditional routing, and enable persistence.

## Overview

LangGraph is a library for building stateful, multi-actor applications with LLMs. The StateGraph is the core abstraction that enables:
- Cyclical computation graphs (unlike DAGs)
- State persistence and checkpointing
- Human-in-the-loop interaction patterns
- Conditional branching and routing
- Multi-agent coordination

## Capabilities

### State Schema Design
- Define typed state schemas with TypedDict or Pydantic
- Configure state channels for message passing
- Set up reducer functions for state updates
- Design accumulator patterns for conversation history

### Graph Construction
- Create nodes as functions or runnables
- Define edges (normal, conditional, entry points)
- Configure start and end nodes
- Implement routing logic for conditional edges

### Persistence & Checkpointing
- Configure checkpoint backends (SQLite, PostgreSQL, Redis)
- Enable state snapshots at each step
- Support for resuming interrupted workflows
- Thread-based conversation persistence

### Human-in-the-Loop
- Insert interrupt points in workflows
- Collect human feedback before continuing
- Support approval gates and input collection
- Resume from interrupt with updated state

## Usage

### Basic StateGraph Pattern

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

# Define state schema
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    current_step: str
    iteration: int

# Create nodes
def agent_node(state: AgentState) -> AgentState:
    # Process state and return updates
    return {"current_step": "processed", "iteration": state["iteration"] + 1}

def tool_node(state: AgentState) -> AgentState:
    # Execute tools based on agent decisions
    return {"current_step": "tools_executed"}

# Build graph
graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)

# Define edges
graph.set_entry_point("agent")
graph.add_edge("agent", "tools")
graph.add_conditional_edges(
    "tools",
    lambda state: "end" if state["iteration"] >= 3 else "continue",
    {"end": END, "continue": "agent"}
)

# Compile
app = graph.compile()
```

### Conditional Routing

```python
def router(state: AgentState) -> str:
    """Route based on state conditions."""
    last_message = state["messages"][-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    elif state["iteration"] >= state.get("max_iterations", 10):
        return "end"
    else:
        return "agent"

graph.add_conditional_edges(
    "agent",
    router,
    {
        "tools": "tool_executor",
        "agent": "agent",
        "end": END
    }
)
```

### Persistence with Checkpointing

```python
from langgraph.checkpoint.sqlite import SqliteSaver

# Configure checkpointer
memory = SqliteSaver.from_conn_string(":memory:")

# Compile with persistence
app = graph.compile(checkpointer=memory)

# Run with thread_id for persistence
config = {"configurable": {"thread_id": "conversation-1"}}
result = app.invoke(initial_state, config=config)

# Resume from checkpoint
result = app.invoke(None, config=config)  # Continues from last state
```

### Human-in-the-Loop

```python
from langgraph.graph import StateGraph

graph = StateGraph(AgentState)
# ... add nodes ...

# Compile with interrupt points
app = graph.compile(
    checkpointer=memory,
    interrupt_before=["tool_executor"]  # Pause before tool execution
)

# First invocation - pauses at interrupt
result = app.invoke(initial_state, config)

# After human approval, resume
result = app.invoke(None, config)  # Continues past interrupt
```

## Task Definition

```javascript
const langgraphStateGraphTask = defineTask({
  name: 'langgraph-state-graph-design',
  description: 'Design and implement a LangGraph StateGraph workflow',

  inputs: {
    workflowName: { type: 'string', required: true },
    stateSchema: { type: 'object', required: true },
    nodes: { type: 'array', required: true },
    edges: { type: 'array', required: true },
    enablePersistence: { type: 'boolean', default: true },
    interruptPoints: { type: 'array', default: [] }
  },

  outputs: {
    graphCode: { type: 'string' },
    stateSchemaCode: { type: 'string' },
    compiledGraph: { type: 'boolean' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Design StateGraph: ${inputs.workflowName}`,
      skill: {
        name: 'langgraph-state-graph',
        context: {
          workflowName: inputs.workflowName,
          stateSchema: inputs.stateSchema,
          nodes: inputs.nodes,
          edges: inputs.edges,
          enablePersistence: inputs.enablePersistence,
          interruptPoints: inputs.interruptPoints,
          instructions: [
            'Analyze workflow requirements and state needs',
            'Design state schema with proper typing',
            'Create node functions with state transformations',
            'Define edges and conditional routing logic',
            'Configure persistence if enabled',
            'Add interrupt points for human-in-the-loop',
            'Compile and validate the graph'
          ]
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

## Applicable Processes

- langgraph-workflow-design
- multi-agent-system
- plan-and-execute-agent
- conversational-memory-system

## External Dependencies

- langgraph Python package
- langchain-core
- Optional: langgraph-checkpoint-sqlite, langgraph-checkpoint-postgres

## References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Awesome LangGraph](https://github.com/von-development/awesome-LangGraph)
- [LangGraph RAG MCP](https://github.com/pedarias/langgraph-rag-mcp)
- [LangGraph MCP Agents](https://github.com/teddynote-lab/langgraph-mcp-agents)

## Related Skills

- SK-LG-002 langgraph-checkpoint
- SK-LG-003 langgraph-hitl
- SK-LG-004 langgraph-routing
- SK-LG-005 langgraph-subgraph

## Related Agents

- AG-AA-004 langgraph-workflow-designer
- AG-MEM-004 state-machine-designer
