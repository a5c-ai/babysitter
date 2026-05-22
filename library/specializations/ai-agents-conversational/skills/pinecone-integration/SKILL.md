---
name: pinecone-integration
description: Pinecone vector database setup, configuration, and operations for RAG applications
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
graph:
  domains: [domain:software-engineering]
  specializations: [specialization:ai-agents-conversational]
  skillAreas: [skill-area:retrieval-augmented-generation, skill-area:search-indexing]
  roles: [role:ml-engineer, role:backend-engineer]
  workflows: [workflow:ml-model-lifecycle, workflow:feature-development]

---

# Pinecone Integration Skill

## Capabilities

- Set up Pinecone index and environment
- Configure index parameters and pods
- Implement upsert and query operations
- Design namespace strategies for multi-tenancy
- Configure metadata filtering
- Implement batch operations and optimization

## Target Processes

- vector-database-setup
- rag-pipeline-implementation

## Implementation Details

### Core Operations

1. **Index Management**: Create, configure, delete indices
2. **Upsert**: Single and batch vector uploads
3. **Query**: Similarity search with metadata filters
4. **Fetch/Delete**: Direct vector operations
5. **Index Stats**: Monitor index usage

### Configuration Options

- Index dimension and metric
- Pod type and replicas
- Serverless vs pod-based deployment
- Namespace configuration
- Metadata schema design

### Best Practices

- Use appropriate metric for embeddings
- Design namespaces for isolation
- Batch upserts for efficiency
- Implement proper error handling
- Monitor index performance

### Dependencies

- pinecone-client
- langchain-pinecone
