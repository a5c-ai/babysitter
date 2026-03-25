---
name: langchain-tools
description: LangChain tool creation and integration utilities for agent systems
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# LangChain Tools Skill

## Capabilities

- Create custom LangChain tools with proper schemas
- Integrate existing tools and APIs
- Design tool descriptions for optimal LLM understanding
- Implement structured tool inputs with Pydantic
- Handle tool errors and fallbacks
- Create tool chains and pipelines

## Target Processes

- custom-tool-development
- function-calling-agent

## Implementation Details

### Tool Creation Patterns

1. **@tool decorator**: Simple function-based tools
2. **StructuredTool**: Tools with complex input schemas
3. **BaseTool subclass**: Full control over tool behavior
4. **Tool from functions**: Dynamic tool creation

### Configuration Options

- Tool name and description
- Input schema (args_schema)
- Return type specification
- Error handling strategy
- Async/sync execution modes

### Best Practices

- Clear, action-oriented descriptions
- Explicit input parameter documentation
- Proper error messages for LLM understanding
- Idempotent operations where possible

### Dependencies

- langchain-core
- pydantic
