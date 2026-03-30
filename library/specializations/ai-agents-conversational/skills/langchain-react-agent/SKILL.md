---
name: langchain-react-agent
description: LangChain ReAct agent implementation with tool binding for reasoning and action loops
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# LangChain ReAct Agent Skill

## Capabilities

- Implement ReAct (Reasoning + Acting) agent patterns using LangChain
- Configure tool binding and function calling for agents
- Design thought-action-observation loops
- Integrate with various LLM providers (OpenAI, Anthropic, etc.)
- Handle agent memory and state persistence
- Implement error handling and retry logic for agent actions

## Target Processes

- react-agent-implementation
- function-calling-agent

## Implementation Details

### Core Components

1. **Agent Executor Setup**: Configure LangChain AgentExecutor with appropriate settings
2. **Tool Integration**: Bind tools with proper schemas and descriptions
3. **Prompt Engineering**: Design system prompts for ReAct reasoning patterns
4. **Output Parsing**: Parse agent outputs and handle structured responses

### Configuration Options

- LLM model selection and parameters
- Tool definitions and schemas
- Memory type (buffer, summary, vector)
- Max iterations and timeout settings
- Verbose/debug mode configuration

### Dependencies

- langchain
- langchain-openai / langchain-anthropic
- Python 3.9+
