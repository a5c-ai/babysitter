---
name: langchain-memory
description: LangChain memory integration including ConversationBufferMemory, ConversationSummaryMemory, and vector-based memory
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# LangChain Memory Skill

## Capabilities

- Implement various LangChain memory types
- Configure ConversationBufferMemory for short-term recall
- Set up ConversationSummaryMemory for long conversations
- Integrate vector-based memory for semantic search
- Design memory retrieval strategies
- Handle memory persistence and serialization

## Target Processes

- conversational-memory-system
- chatbot-design-implementation

## Implementation Details

### Memory Types

1. **ConversationBufferMemory**: Stores full conversation history
2. **ConversationBufferWindowMemory**: Rolling window of recent messages
3. **ConversationSummaryMemory**: Summarizes older messages
4. **ConversationSummaryBufferMemory**: Hybrid approach
5. **VectorStoreRetrieverMemory**: Semantic similarity-based retrieval

### Configuration Options

- Memory key naming conventions
- Return message format (string vs messages)
- Summary LLM selection
- Vector store backend selection
- Token limits and window sizes

### Dependencies

- langchain
- langchain-community
- Vector store client (optional)
