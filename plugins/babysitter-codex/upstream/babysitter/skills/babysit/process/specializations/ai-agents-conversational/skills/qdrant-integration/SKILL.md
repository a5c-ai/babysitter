---
name: qdrant-integration
description: Qdrant vector database with filtering, payloads, and quantization support
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Qdrant Integration Skill

## Capabilities

- Set up Qdrant (local, cloud, self-hosted)
- Create collections with configuration
- Implement advanced filtering with payloads
- Configure quantization for efficiency
- Set up sparse vectors for hybrid search
- Implement batch operations and optimization

## Target Processes

- vector-database-setup
- rag-pipeline-implementation

## Implementation Details

### Deployment Modes

1. **Local Memory**: For testing
2. **Local Disk**: Persistent local storage
3. **Qdrant Cloud**: Managed service
4. **Self-Hosted**: Docker/Kubernetes deployment

### Core Operations

- Collection management with parameters
- Point upsert with vectors and payloads
- Search with filters (must, should, must_not)
- Scroll for pagination
- Batch operations

### Configuration Options

- Vector parameters (size, distance)
- Quantization (scalar, product)
- Sparse vector configuration
- Payload indexes
- Replication and sharding

### Best Practices

- Use quantization for large collections
- Design payload indexes for filters
- Implement proper batch sizes
- Configure appropriate distance metrics

### Dependencies

- qdrant-client
- langchain-qdrant
