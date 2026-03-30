---
name: chroma-integration
description: Chroma local vector database setup and operations for development and production
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Chroma Integration Skill

## Capabilities

- Set up Chroma (ephemeral, persistent, client-server)
- Create and manage collections
- Implement document ingestion with embeddings
- Configure metadata filtering
- Set up multi-tenant collections
- Implement where and where_document filters

## Target Processes

- vector-database-setup
- rag-pipeline-implementation

## Implementation Details

### Deployment Modes

1. **Ephemeral**: In-memory for testing
2. **Persistent**: Local file-based storage
3. **Client-Server**: Chroma server deployment

### Core Operations

- Collection creation with embedding functions
- Add/update/delete documents
- Query with filters
- Metadata management

### Configuration Options

- Embedding function selection
- Persistence directory
- Distance metric (l2, ip, cosine)
- Collection metadata
- Server configuration

### Best Practices

- Use persistent mode for development
- Deploy server mode for production
- Design metadata schema upfront
- Implement proper ID strategies

### Dependencies

- chromadb
- langchain-chroma
