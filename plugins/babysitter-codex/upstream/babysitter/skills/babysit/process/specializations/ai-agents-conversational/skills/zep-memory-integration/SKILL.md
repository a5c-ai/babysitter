---
name: zep-memory-integration
description: Zep memory server integration for long-term conversation memory and user profiling
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Zep Memory Integration Skill

## Capabilities

- Set up Zep memory server connection
- Configure session and user management
- Implement long-term memory retrieval
- Set up automatic summarization
- Configure entity extraction
- Implement memory search and filtering

## Target Processes

- conversational-memory-system
- long-term-memory-management

## Implementation Details

### Core Features

1. **Session Management**: Create and manage conversation sessions
2. **Message Storage**: Store and retrieve conversation history
3. **Summarization**: Automatic conversation summarization
4. **Entity Extraction**: Extract and track entities
5. **Search**: Semantic memory search

### Configuration Options

- Zep server URL and API key
- Session configuration
- Summary settings
- Entity extraction rules
- Memory retrieval limits

### Integration Patterns

- LangChain ZepMemory integration
- Direct Zep client usage
- Custom memory wrapper

### Best Practices

- Proper session lifecycle management
- Configure appropriate summarization
- Use memory search for relevance
- Monitor memory usage

### Dependencies

- zep-python
- langchain-community (ZepMemory)
