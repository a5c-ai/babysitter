---
name: mem0-integration
description: Mem0 memory layer integration for AI agents. Implement persistent, semantic memory for long-term context retention and personalization.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob, WebFetch
---

# mem0-integration

Integrate Mem0 (formerly MemGPT) as a universal memory layer for AI agents. Enable persistent memory storage, semantic search across memories, and personalized context retrieval.

## Overview

Mem0 provides intelligent memory management for AI applications:
- Persistent storage of conversation history and facts
- Semantic search across stored memories
- User-specific memory isolation
- Automatic memory extraction from conversations
- Support for local and cloud deployments

## Capabilities

### Memory Operations
- Add memories from text or conversations
- Search memories semantically
- Retrieve relevant context by user/agent
- Update and delete memories
- Get memory history with timestamps

### Memory Types
- Conversation memories (dialogue history)
- Fact memories (extracted information)
- Preference memories (user preferences)
- Entity memories (people, places, things)

### Storage Backends
- Local SQLite/JSON storage
- PostgreSQL for production
- Qdrant vector database integration
- Cloud-hosted Mem0 platform

### Integration Patterns
- LangChain memory integration
- Direct API usage
- MCP server connectivity
- CrewAI and AutoGen compatibility

## Usage

### Basic Setup

```python
from mem0 import Memory

# Initialize with default local storage
m = Memory()

# Or with custom configuration
config = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "host": "localhost",
            "port": 6333,
        }
    },
    "llm": {
        "provider": "openai",
        "config": {
            "model": "gpt-4o-mini",
            "temperature": 0.1,
        }
    }
}
m = Memory.from_config(config)
```

### Adding Memories

```python
# Add memory from conversation
messages = [
    {"role": "user", "content": "I prefer dark mode for all my applications"},
    {"role": "assistant", "content": "I'll remember that you prefer dark mode."}
]
m.add(messages, user_id="user123")

# Add memory from plain text
m.add("User works at Acme Corp as a software engineer", user_id="user123")

# Add with metadata
m.add(
    "Prefers Python over JavaScript",
    user_id="user123",
    metadata={"category": "preferences", "confidence": 0.9}
)
```

### Searching Memories

```python
# Search for relevant memories
results = m.search(
    query="What are the user's preferences?",
    user_id="user123",
    limit=5
)

for memory in results:
    print(f"Memory: {memory['memory']}")
    print(f"Relevance: {memory['score']}")
    print(f"Created: {memory['created_at']}")
```

### Getting All Memories

```python
# Get all memories for a user
all_memories = m.get_all(user_id="user123")

# Filter by metadata
filtered = m.get_all(
    user_id="user123",
    metadata={"category": "preferences"}
)
```

### Memory History

```python
# Get memory changes over time
history = m.history(memory_id="mem_abc123")

for entry in history:
    print(f"Version: {entry['version']}")
    print(f"Content: {entry['memory']}")
    print(f"Updated: {entry['updated_at']}")
```

### LangChain Integration

```python
from langchain_openai import ChatOpenAI
from mem0 import MemoryClient

# Initialize Mem0 client
mem0_client = MemoryClient(api_key="your-api-key")

# Create LLM with memory-enhanced context
llm = ChatOpenAI(model="gpt-4")

def chat_with_memory(user_message: str, user_id: str) -> str:
    # Retrieve relevant memories
    memories = mem0_client.search(user_message, user_id=user_id, limit=5)
    memory_context = "\n".join([m["memory"] for m in memories])

    # Build prompt with memory context
    system_prompt = f"""You are a helpful assistant.

Here is what you remember about this user:
{memory_context}

Use this context to personalize your response."""

    # Generate response
    response = llm.invoke([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ])

    # Store new memory from conversation
    mem0_client.add(
        [
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": response.content}
        ],
        user_id=user_id
    )

    return response.content
```

### MCP Server Usage

```python
# Using Mem0 MCP server with Claude
# Configure in claude_desktop_config.json:
{
    "mcpServers": {
        "mem0": {
            "command": "npx",
            "args": ["-y", "@mem0/mcp-server"]
        }
    }
}
```

## Task Definition

```javascript
const mem0IntegrationTask = defineTask({
  name: 'mem0-integration-setup',
  description: 'Configure Mem0 memory layer for AI agent',

  inputs: {
    storageBackend: { type: 'string', default: 'local' },  // 'local', 'qdrant', 'postgres', 'cloud'
    vectorDimension: { type: 'number', default: 1536 },
    embeddingModel: { type: 'string', default: 'text-embedding-3-small' },
    memoryCategories: { type: 'array', default: ['facts', 'preferences', 'conversations'] },
    userIsolation: { type: 'boolean', default: true }
  },

  outputs: {
    configured: { type: 'boolean' },
    memoryStats: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Configure Mem0 with ${inputs.storageBackend} backend`,
      skill: {
        name: 'mem0-integration',
        context: {
          storageBackend: inputs.storageBackend,
          vectorDimension: inputs.vectorDimension,
          embeddingModel: inputs.embeddingModel,
          memoryCategories: inputs.memoryCategories,
          userIsolation: inputs.userIsolation,
          instructions: [
            'Validate storage backend availability',
            'Configure embedding model and vector dimensions',
            'Set up memory categories and metadata schemas',
            'Implement user isolation if enabled',
            'Create memory add/search/retrieve functions',
            'Test memory operations with sample data',
            'Document integration patterns for the application'
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

- conversational-memory-system
- long-term-memory-management
- chatbot-design-implementation
- conversational-persona-design

## External Dependencies

- mem0ai Python package
- Vector database (optional: Qdrant, Pinecone)
- LLM provider (OpenAI, Anthropic, etc.)
- Mem0 Platform API key (for cloud)

## References

- [Mem0 GitHub Repository](https://github.com/mem0ai/mem0)
- [Official Mem0 MCP](https://github.com/mem0ai/mem0-mcp)
- [coleam00/mcp-mem0](https://github.com/coleam00/mcp-mem0)
- [pinkpixel-dev/mem0-mcp](https://github.com/pinkpixel-dev/mem0-mcp)
- [Mem0 Documentation](https://docs.mem0.ai)

## Related Skills

- SK-MEM-001 zep-memory-integration
- SK-MEM-003 redis-memory-backend
- SK-MEM-004 memory-summarization
- SK-MEM-005 entity-memory-extraction

## Related Agents

- AG-MEM-001 memory-architect
- AG-MEM-002 user-profile-builder
- AG-MEM-003 semantic-memory-curator
