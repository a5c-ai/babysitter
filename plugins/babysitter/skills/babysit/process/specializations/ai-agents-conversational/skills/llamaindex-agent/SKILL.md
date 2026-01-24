---
name: llamaindex-agent
description: LlamaIndex agent and query engine setup for RAG-powered agents
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# LlamaIndex Agent Skill

## Capabilities

- Set up LlamaIndex query engines
- Configure ReAct agents with tools
- Implement OpenAI function calling agents
- Design sub-question query engines
- Set up multi-document agents
- Implement chat engines with memory

## Target Processes

- rag-pipeline-implementation
- knowledge-base-qa

## Implementation Details

### Agent Types

1. **ReActAgent**: Reasoning and acting agent
2. **OpenAIAgent**: Function calling agent
3. **StructuredPlannerAgent**: Plan-and-execute style
4. **SubQuestionQueryEngine**: Complex query decomposition

### Query Engine Types

- VectorStoreIndex query engine
- Summary index query engine
- Knowledge graph query engine
- SQL query engine

### Configuration Options

- LLM selection
- Tool definitions
- Memory configuration
- Verbose/debug settings
- Query transform modules

### Best Practices

- Appropriate index selection
- Clear tool descriptions
- Memory for multi-turn
- Monitor query performance

### Dependencies

- llama-index
- llama-index-agent-openai
