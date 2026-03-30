# Memory Architect Agent

## Overview

The Memory Architect is a specialized agent that designs comprehensive memory systems for AI applications. It creates memory hierarchies, consolidation strategies, and retrieval mechanisms that enable AI agents to maintain context across sessions and deliver personalized experiences.

## Key Capabilities

- **Memory Hierarchy Design**: Multi-tier memory systems (working, short, mid, long-term)
- **Storage Selection**: Choose optimal backends for each memory type
- **Retrieval Optimization**: Design efficient memory access patterns
- **Personalization Strategy**: User profile and preference modeling
- **Privacy Architecture**: Data retention and access controls

## When to Use This Agent

Use the Memory Architect when:
- Building a conversational AI that needs session persistence
- Implementing user personalization features
- Designing long-running agent systems
- Creating knowledge management for AI assistants
- Optimizing context window usage
- Planning memory infrastructure at scale

## Agent Profile

| Attribute | Value |
|-----------|-------|
| **Role** | Memory Systems Architect |
| **Primary Focus** | Memory hierarchy and retrieval design |
| **Output Format** | Structured architecture document (JSON) |
| **Design Goals** | Relevance, Performance, Privacy |

## Memory Tier Framework

### Tier 1: Working Memory

**Purpose**: Immediate context for current interaction

| Aspect | Description |
|--------|-------------|
| Scope | Current turn, active task |
| Storage | In-memory |
| Lifetime | Single interaction |
| Capacity | Current context window |
| Access | Direct, synchronous |

### Tier 2: Short-Term Memory

**Purpose**: Session continuity

| Aspect | Description |
|--------|-------------|
| Scope | Current conversation session |
| Storage | Cache (Redis), in-memory DB |
| Lifetime | Session duration (minutes to hours) |
| Capacity | Recent N messages or tokens |
| Access | Fast lookup, conversation buffer |

### Tier 3: Mid-Term Memory

**Purpose**: Recent interaction history

| Aspect | Description |
|--------|-------------|
| Scope | Recent sessions, learned context |
| Storage | PostgreSQL, document DB |
| Lifetime | Days to weeks |
| Capacity | Summarized conversations |
| Access | Queryable by recency, topic |

### Tier 4: Long-Term Memory

**Purpose**: Persistent knowledge and preferences

| Aspect | Description |
|--------|-------------|
| Scope | User profile, facts, preferences |
| Storage | Vector DB, knowledge graph |
| Lifetime | Indefinite with pruning |
| Capacity | All retained knowledge |
| Access | Semantic search, entity lookup |

## Usage Example

### Invoking the Agent

```javascript
// In a babysitter process
const memoryDesign = await ctx.task(memoryArchitectureTask, {
  applicationName: "Personal AI Assistant",
  useCase: "Daily productivity assistant with long-term memory",
  personalizationGoals: [
    "Remember user preferences",
    "Track ongoing projects",
    "Learn communication style",
    "Maintain relationship context"
  ],
  expectedUserVolume: 10000,
  sessionDuration: "30min",
  privacyRequirements: "GDPR compliant",
  existingInfrastructure: ["aws", "postgresql", "redis"]
});
```

### Sample Output

```json
{
  "architectureOverview": {
    "name": "Personal Assistant Memory System",
    "description": "Multi-tier memory for personalized productivity assistant",
    "useCase": "Daily productivity with persistent learning",
    "personalizationGoals": [
      "Preference tracking",
      "Project continuity",
      "Style adaptation",
      "Relationship awareness"
    ],
    "privacyRequirements": "GDPR compliant with user data controls"
  },
  "memoryTiers": {
    "working": {
      "purpose": "Current interaction context",
      "storage": "in-memory",
      "capacity": "Current conversation turn + tool outputs",
      "ttl": "End of LLM call",
      "operations": ["read", "write"]
    },
    "shortTerm": {
      "purpose": "Session conversation history",
      "storage": "redis",
      "capacity": "Last 20 messages or 4000 tokens",
      "ttl": "2 hours after last activity",
      "operations": ["read", "write", "summarize"],
      "config": {
        "keyPattern": "session:{user_id}:{session_id}",
        "serialization": "json"
      }
    },
    "midTerm": {
      "purpose": "Recent session summaries and active projects",
      "storage": "postgresql",
      "capacity": "Last 30 days of summaries",
      "ttl": "30 days, then archive",
      "operations": ["read", "write", "update", "consolidate"],
      "schema": {
        "table": "conversation_summaries",
        "columns": ["user_id", "session_id", "summary", "key_entities", "created_at"]
      }
    },
    "longTerm": {
      "purpose": "User profile and semantic knowledge",
      "storage": "qdrant",
      "capacity": "Unlimited with importance-based pruning",
      "ttl": "Indefinite",
      "operations": ["read", "write", "update", "delete", "search"],
      "config": {
        "collection": "user_memories",
        "vectorSize": 1536,
        "distanceMetric": "cosine"
      }
    }
  },
  "memorySchema": {
    "userProfile": {
      "fields": {
        "name": "string",
        "preferences": "object",
        "communication_style": "string",
        "timezone": "string",
        "active_projects": "array"
      },
      "storage": "postgresql",
      "updateFrequency": "On relevant interactions"
    },
    "conversationMemory": {
      "fields": {
        "summary": "string",
        "key_points": "array",
        "entities_mentioned": "array",
        "user_sentiment": "string",
        "session_date": "timestamp"
      },
      "storage": "postgresql + qdrant embedding",
      "retention": "30 days full, then summarized to long-term"
    },
    "factualMemory": {
      "fields": {
        "fact": "string",
        "category": "string",
        "source_session": "string",
        "confidence": "float",
        "user_confirmed": "boolean",
        "embedding": "vector"
      },
      "storage": "qdrant",
      "validation": "Explicit confirmation or 3+ mentions"
    }
  },
  "consolidationStrategy": {
    "sessionEnd": {
      "trigger": "Session inactive for 30 minutes",
      "actions": [
        "Summarize conversation using LLM",
        "Extract mentioned entities and facts",
        "Update user profile if new preferences detected",
        "Store summary in mid-term storage",
        "Embed key content for long-term retrieval"
      ]
    },
    "dailyConsolidation": {
      "trigger": "Daily at 2 AM UTC",
      "actions": [
        "Consolidate day's sessions into daily summary",
        "Promote frequently referenced facts to long-term",
        "Prune low-importance mid-term memories",
        "Update user profile aggregates"
      ]
    },
    "memoryPromotion": {
      "criteria": "Accessed 3+ times OR explicitly marked important",
      "action": "Copy to long-term with high importance score"
    }
  },
  "retrievalStrategy": {
    "default": {
      "method": "hybrid",
      "weights": {
        "recency": 0.3,
        "relevance": 0.5,
        "importance": 0.2
      },
      "topK": 5
    },
    "contextAssembly": [
      "1. Load user profile from long-term",
      "2. Retrieve last 5 relevant memories by query",
      "3. Include current session history from short-term",
      "4. Fetch any referenced entities"
    ],
    "fallback": "If no relevant memories, use user profile only"
  },
  "recommendations": {
    "implementation": [
      "Start with Redis for short-term, add vector DB for long-term",
      "Implement consolidation as background job",
      "Create memory management UI for user control",
      "Set up monitoring for memory retrieval quality"
    ],
    "optimization": [
      "Cache frequently accessed user profiles",
      "Use async embedding generation",
      "Implement memory pre-warming at session start"
    ],
    "monitoring": [
      "Track memory hit rate (% of queries with relevant memories)",
      "Monitor consolidation latency and success rate",
      "Alert on storage growth rate anomalies"
    ]
  }
}
```

## Integration with Processes

| Process | Integration Point |
|---------|------------------|
| conversational-memory-system | Primary architecture input |
| long-term-memory-management | Long-term tier design |
| chatbot-design-implementation | Memory integration patterns |
| conversational-persona-design | Profile-based personalization |
| langgraph-workflow-design | State persistence patterns |

## Memory Implementation Patterns

### LangChain Integration

```python
from langchain.memory import CombinedMemory
from langchain.memory import ConversationBufferWindowMemory
from langchain.memory import VectorStoreRetrieverMemory

# Short-term: recent messages
buffer_memory = ConversationBufferWindowMemory(
    k=10,
    memory_key="recent_history"
)

# Long-term: semantic retrieval
vector_memory = VectorStoreRetrieverMemory(
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    memory_key="relevant_history"
)

# Combined memory
memory = CombinedMemory(memories=[buffer_memory, vector_memory])
```

### Mem0 Integration

```python
from mem0 import Memory

# Initialize with multi-tier config
config = {
    "vector_store": {
        "provider": "qdrant",
        "config": {"host": "localhost", "port": 6333}
    },
    "llm": {
        "provider": "openai",
        "config": {"model": "gpt-4o-mini"}
    }
}

memory = Memory.from_config(config)

# Add memories with metadata
memory.add(
    "User prefers dark mode",
    user_id="user123",
    metadata={"category": "preferences", "importance": "high"}
)

# Retrieve relevant memories
memories = memory.search(
    "What are the user's UI preferences?",
    user_id="user123"
)
```

## Best Practices

### Memory Lifecycle

1. **Capture**: Store interactions as they happen
2. **Consolidate**: Summarize at session end
3. **Promote**: Move important items to long-term
4. **Prune**: Remove outdated or low-value memories
5. **Archive**: Keep historical data for compliance

### Privacy Considerations

- Implement user memory viewing/deletion
- Set appropriate retention limits
- Encrypt sensitive memories
- Separate PII from general knowledge
- Log memory access for audit

### Performance Optimization

- Cache hot memory paths
- Use async consolidation
- Pre-warm user context at session start
- Batch embedding operations
- Index by user_id for fast retrieval

## Storage Selection Guide

| Memory Type | Recommended Storage | Rationale |
|-------------|-------------------|-----------|
| Working | In-memory | Speed, ephemeral |
| Session | Redis | Fast, TTL support |
| Structured | PostgreSQL | Queryable, transactions |
| Semantic | Qdrant/Pinecone | Similarity search |
| Relationships | Neo4j | Graph traversal |

## References

- [Mem0 Documentation](https://docs.mem0.ai)
- [MemoryOS Research](https://github.com/BAI-LAB/MemoryOS)
- [LangChain Memory](https://python.langchain.com/docs/modules/memory/)
- [Memory Systems Skill](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering/tree/main/skills/memory-systems)
- [Zep Memory Server](https://www.getzep.com/)

## Related Resources

- [OpenMemory](https://github.com/CaviraOSS/OpenMemory)
- [Neo4j MCP](https://github.com/neo4j-contrib/mcp-neo4j)
- [Context Compression](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering/tree/main/skills/context-compression)
