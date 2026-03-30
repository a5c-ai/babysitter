# LangGraph StateGraph Skill

## Overview

The `langgraph-state-graph` skill enables the design and implementation of stateful agent workflows using LangGraph's StateGraph pattern. This is the foundational building block for creating sophisticated AI agents that can maintain state, handle cycles, and support human-in-the-loop interactions.

## Key Features

- **Stateful Workflows**: Maintain and transform state across execution steps
- **Cyclical Graphs**: Support iterative agent loops unlike traditional DAGs
- **Conditional Routing**: Dynamic edge selection based on state conditions
- **Persistence**: Checkpoint and resume workflows across sessions
- **Human-in-the-Loop**: Interrupt workflows for human input or approval

## Prerequisites

1. **Python 3.9+**: LangGraph requires modern Python
2. **LangGraph Package**: `pip install langgraph`
3. **LangChain Core**: `pip install langchain-core`

## Installation

```bash
pip install langgraph langchain-core langchain-openai
# Optional: For persistence
pip install langgraph-checkpoint-sqlite
```

## Quick Start

### 1. Define State Schema

```python
from typing import TypedDict, Annotated, List
from langgraph.graph.message import add_messages

class ConversationState(TypedDict):
    # Messages with automatic appending
    messages: Annotated[List, add_messages]
    # Custom state fields
    user_intent: str
    confidence: float
    requires_clarification: bool
```

### 2. Create Node Functions

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

def classify_intent(state: ConversationState) -> ConversationState:
    """Classify user intent from messages."""
    messages = state["messages"]
    # Classification logic
    return {
        "user_intent": "booking",
        "confidence": 0.85
    }

def generate_response(state: ConversationState) -> ConversationState:
    """Generate response based on intent."""
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def request_clarification(state: ConversationState) -> ConversationState:
    """Ask for clarification when confidence is low."""
    return {
        "messages": [{"role": "assistant", "content": "Could you please clarify..."}],
        "requires_clarification": True
    }
```

### 3. Build the Graph

```python
from langgraph.graph import StateGraph, END

# Initialize graph with state type
graph = StateGraph(ConversationState)

# Add nodes
graph.add_node("classify", classify_intent)
graph.add_node("respond", generate_response)
graph.add_node("clarify", request_clarification)

# Set entry point
graph.set_entry_point("classify")

# Add conditional edges
def route_by_confidence(state: ConversationState) -> str:
    if state["confidence"] < 0.7:
        return "clarify"
    return "respond"

graph.add_conditional_edges(
    "classify",
    route_by_confidence,
    {"clarify": "clarify", "respond": "respond"}
)

# Both paths end the graph
graph.add_edge("respond", END)
graph.add_edge("clarify", END)

# Compile
app = graph.compile()
```

### 4. Execute the Workflow

```python
# Initial state
initial_state = {
    "messages": [{"role": "user", "content": "I want to book a flight"}],
    "user_intent": "",
    "confidence": 0.0,
    "requires_clarification": False
}

# Run the graph
result = app.invoke(initial_state)
print(result["messages"][-1])
```

## Advanced Patterns

### ReAct Agent Loop

```python
from langgraph.prebuilt import create_react_agent

# Simple ReAct agent
agent = create_react_agent(llm, tools=[search_tool, calculator_tool])
result = agent.invoke({"messages": [("user", "What is 25 * 4?")]})
```

### Multi-Agent Coordination

```python
# Define specialist agents as subgraphs
researcher_graph = create_researcher_graph()
writer_graph = create_writer_graph()
reviewer_graph = create_reviewer_graph()

# Coordinator graph
coordinator = StateGraph(CoordinatorState)
coordinator.add_node("researcher", researcher_graph)
coordinator.add_node("writer", writer_graph)
coordinator.add_node("reviewer", reviewer_graph)

# Sequential flow with feedback loop
coordinator.add_edge("researcher", "writer")
coordinator.add_edge("writer", "reviewer")
coordinator.add_conditional_edges(
    "reviewer",
    lambda s: "done" if s["approved"] else "revise",
    {"done": END, "revise": "writer"}
)
```

### Streaming Execution

```python
# Stream state updates
for chunk in app.stream(initial_state):
    for node_name, node_output in chunk.items():
        print(f"{node_name}: {node_output}")
```

## Integration with Babysitter Processes

| Process | Use Case |
|---------|----------|
| langgraph-workflow-design | Primary graph design workflow |
| multi-agent-system | Coordinate multiple specialist agents |
| plan-and-execute-agent | Hierarchical task planning |
| conversational-memory-system | Stateful conversation management |

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| workflowName | string | required | Identifier for the workflow |
| stateSchema | object | required | State type definition |
| nodes | array | required | Node function specifications |
| edges | array | required | Edge definitions with routing |
| enablePersistence | boolean | true | Enable checkpointing |
| interruptPoints | array | [] | Nodes to pause before |
| checkpointerType | string | "memory" | sqlite, postgres, or memory |

## State Schema Best Practices

### Use Annotated Types for Special Behaviors

```python
from typing import Annotated
from langgraph.graph.message import add_messages

class State(TypedDict):
    # Messages accumulate automatically
    messages: Annotated[list, add_messages]

    # Regular fields are replaced
    current_step: str

    # Use reducers for custom accumulation
    scores: Annotated[list, lambda a, b: a + b]
```

### Separate Mutable and Immutable State

```python
class WorkflowState(TypedDict):
    # Immutable inputs
    task_id: str
    user_id: str

    # Mutable working state
    messages: Annotated[list, add_messages]
    artifacts: list
    status: str
```

## Troubleshooting

### Graph Not Compiling

1. Verify all nodes are connected to the graph
2. Check that entry point is set
3. Ensure all conditional edge targets exist
4. Validate state schema matches node return types

### State Not Persisting

1. Confirm checkpointer is configured
2. Verify thread_id is passed in config
3. Check database connection for external checkpointers

### Cycles Not Working

1. Ensure conditional edges return correct target names
2. Verify loop termination conditions
3. Check for state updates that enable cycle exit

## Security Considerations

- Validate all user inputs before processing
- Implement rate limiting on LLM calls
- Use tool permissions and guardrails
- Audit state changes for sensitive data

## References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangGraph Tutorials](https://langchain-ai.github.io/langgraph/tutorials/)
- [Awesome LangGraph](https://github.com/von-development/awesome-LangGraph)
- [LangGraph Conceptual Guide](https://langchain-ai.github.io/langgraph/concepts/)

## Related Resources

- [LangChain Expression Language](https://python.langchain.com/docs/expression_language/)
- [CrewAI](https://github.com/crewAIInc/crewAI) - Alternative multi-agent framework
- [AutoGen](https://github.com/microsoft/autogen) - Microsoft's agent framework
