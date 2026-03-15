# Mem0 Integration Skill

## Overview

The `mem0-integration` skill provides a comprehensive memory layer for AI agents using Mem0 (formerly MemGPT). It enables persistent, semantic memory storage that helps agents maintain context across conversations and personalize interactions based on user history.

## Key Features

- **Persistent Memory**: Store and retrieve memories across sessions
- **Semantic Search**: Find relevant memories using natural language queries
- **User Isolation**: Separate memory spaces for different users
- **Automatic Extraction**: Extract facts and preferences from conversations
- **Multi-Backend Support**: Local storage, PostgreSQL, Qdrant, or cloud

## Why Mem0?

| Feature | Benefit |
|---------|---------|
| Y Combinator backed | Active development and support |
| MCP compatibility | Easy integration with Claude |
| Multiple backends | Flexibility for different deployments |
| Automatic extraction | No manual memory management needed |
| Semantic search | Find memories by meaning, not keywords |

## Prerequisites

1. **Python 3.8+**: Required runtime
2. **LLM API Key**: OpenAI, Anthropic, or compatible provider
3. **Optional**: Vector database for production (Qdrant recommended)

## Installation

```bash
# Core package
pip install mem0ai

# For production with Qdrant
pip install mem0ai qdrant-client

# For MCP server
npm install -g @mem0/mcp-server
```

## Quick Start

### 1. Initialize Memory

```python
from mem0 import Memory

# Simple local setup
memory = Memory()

# Production setup with Qdrant
config = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "collection_name": "agent_memories",
            "host": "localhost",
            "port": 6333
        }
    },
    "llm": {
        "provider": "openai",
        "config": {
            "model": "gpt-4o-mini"
        }
    },
    "embedder": {
        "provider": "openai",
        "config": {
            "model": "text-embedding-3-small"
        }
    }
}
memory = Memory.from_config(config)
```

### 2. Store Memories

```python
# From conversation messages
messages = [
    {"role": "user", "content": "I'm allergic to peanuts"},
    {"role": "assistant", "content": "I'll remember your peanut allergy."}
]
memory.add(messages, user_id="alice")

# From plain text
memory.add(
    "Prefers email communication over phone calls",
    user_id="alice"
)

# With metadata for categorization
memory.add(
    "Works remotely on Tuesdays and Thursdays",
    user_id="alice",
    metadata={
        "category": "work_schedule",
        "source": "user_stated"
    }
)
```

### 3. Retrieve Memories

```python
# Search by relevance
relevant = memory.search(
    query="What should I know about Alice's health?",
    user_id="alice",
    limit=5
)

for mem in relevant:
    print(f"Memory: {mem['memory']}")
    print(f"Score: {mem['score']:.2f}")
    print("---")

# Get all memories
all_memories = memory.get_all(user_id="alice")
print(f"Total memories: {len(all_memories)}")
```

### 4. Use in Conversations

```python
from langchain_openai import ChatOpenAI

def create_memory_context(user_id: str, query: str) -> str:
    """Build context from relevant memories."""
    memories = memory.search(query, user_id=user_id, limit=5)
    if not memories:
        return "No relevant memories found."

    context_parts = []
    for mem in memories:
        context_parts.append(f"- {mem['memory']}")

    return "\n".join(context_parts)

def chat(user_message: str, user_id: str) -> str:
    """Chat with memory-augmented context."""
    llm = ChatOpenAI(model="gpt-4")

    # Get relevant memories
    memory_context = create_memory_context(user_id, user_message)

    # Build prompt
    messages = [
        {
            "role": "system",
            "content": f"""You are a helpful assistant with memory.

What you remember about this user:
{memory_context}

Use this information to personalize your response."""
        },
        {"role": "user", "content": user_message}
    ]

    response = llm.invoke(messages)

    # Store the conversation as new memory
    memory.add([
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": response.content}
    ], user_id=user_id)

    return response.content
```

## Memory Management

### Update Memories

```python
# Update specific memory
memory.update(
    memory_id="mem_abc123",
    data="Updated preference: dark mode everywhere"
)
```

### Delete Memories

```python
# Delete specific memory
memory.delete(memory_id="mem_abc123")

# Delete all memories for a user
memory.delete_all(user_id="alice")
```

### Memory History

```python
# Track how a memory evolved
history = memory.history(memory_id="mem_abc123")

for version in history:
    print(f"Version {version['version']}: {version['memory']}")
    print(f"Updated: {version['updated_at']}")
```

## Integration Patterns

### With LangChain Agents

```python
from langchain.agents import AgentExecutor
from langchain.tools import Tool

def search_memory_tool(query: str) -> str:
    """Tool for agents to search their memory."""
    results = memory.search(query, user_id=current_user_id)
    return "\n".join([r["memory"] for r in results])

memory_tool = Tool(
    name="search_memory",
    func=search_memory_tool,
    description="Search your memory for relevant information about the user"
)

# Add to agent's tools
agent = AgentExecutor(tools=[memory_tool, ...], ...)
```

### With CrewAI

```python
from crewai import Agent, Task, Crew

# Memory-aware agent
researcher = Agent(
    role="Research Assistant",
    goal="Help users with research tasks",
    backstory="You have excellent memory and recall user preferences",
    tools=[memory_search_tool, memory_add_tool]
)
```

### MCP Server Integration

```json
// claude_desktop_config.json
{
    "mcpServers": {
        "mem0": {
            "command": "npx",
            "args": ["-y", "@mem0/mcp-server"],
            "env": {
                "MEM0_API_KEY": "your-api-key"
            }
        }
    }
}
```

## Storage Backend Configurations

### Local SQLite (Development)

```python
config = {
    "vector_store": {
        "provider": "chroma",
        "config": {
            "collection_name": "memories",
            "path": "./memory_db"
        }
    }
}
```

### Qdrant (Production)

```python
config = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "collection_name": "memories",
            "host": "qdrant.example.com",
            "port": 6333,
            "api_key": "your-qdrant-key"
        }
    }
}
```

### Mem0 Cloud

```python
from mem0 import MemoryClient

# Use managed cloud service
client = MemoryClient(api_key="your-mem0-api-key")
client.add("Memory text", user_id="user123")
results = client.search("query", user_id="user123")
```

## Integration with Babysitter Processes

| Process | Use Case |
|---------|----------|
| conversational-memory-system | Primary memory backend |
| long-term-memory-management | Persistent user context |
| chatbot-design-implementation | Personalized conversations |
| conversational-persona-design | User preference tracking |

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| storageBackend | string | "local" | Backend type |
| vectorDimension | number | 1536 | Embedding dimensions |
| embeddingModel | string | "text-embedding-3-small" | Model for embeddings |
| userIsolation | boolean | true | Separate user memories |
| memoryCategories | array | ["facts", "preferences"] | Memory types to track |

## Best Practices

### Memory Quality

- Be specific in memory content
- Include context and source
- Use metadata for categorization
- Regularly clean outdated memories

### Performance

- Index frequently searched fields
- Use appropriate embedding model
- Batch memory operations
- Cache search results when appropriate

### Privacy

- Implement user consent for memory storage
- Provide memory deletion capabilities
- Encrypt sensitive memories
- Audit memory access

## Troubleshooting

### Memories Not Found

1. Check user_id matches exactly
2. Verify embedding model consistency
3. Review search query phrasing
4. Check memory actually saved

### Poor Search Relevance

1. Try different query phrasings
2. Review stored memory content
3. Consider increasing search limit
4. Check embedding model suitability

### Slow Performance

1. Use vector database for production
2. Implement result caching
3. Batch write operations
4. Optimize embedding calls

## Security Considerations

- Store API keys securely in environment variables
- Implement access controls for memory operations
- Consider data residency requirements
- Plan for GDPR/privacy compliance

## References

- [Mem0 Documentation](https://docs.mem0.ai)
- [Mem0 GitHub](https://github.com/mem0ai/mem0)
- [Mem0 MCP Server](https://github.com/mem0ai/mem0-mcp)
- [MemoryOS Paper](https://github.com/BAI-LAB/MemoryOS)

## Related Resources

- [Zep Memory](https://github.com/getzep/zep) - Alternative memory system
- [MemoryOS](https://github.com/BAI-LAB/MemoryOS) - Academic memory research
- [LangChain Memory](https://python.langchain.com/docs/modules/memory/)
