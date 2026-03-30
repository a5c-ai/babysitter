---
name: milvus-integration
description: Milvus distributed vector database configuration for large-scale RAG applications
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Milvus Integration Skill

## Capabilities

- Set up Milvus (Lite, Standalone, Cluster)
- Design collection schemas with dynamic fields
- Configure index types (IVF, HNSW, etc.)
- Implement partition strategies
- Set up GPU acceleration
- Handle large-scale data operations

## Target Processes

- vector-database-setup
- rag-pipeline-implementation

## Implementation Details

### Deployment Modes

1. **Milvus Lite**: Embedded for development
2. **Standalone**: Single-node deployment
3. **Cluster**: Distributed deployment with K8s

### Core Operations

- Collection and schema management
- Index creation and configuration
- Insert/delete/query operations
- Partition management
- Bulk import

### Configuration Options

- Index type selection (IVF_FLAT, IVF_SQ8, HNSW)
- Metric type (L2, IP, COSINE)
- Index parameters (nlist, nprobe, M, efConstruction)
- Partition key configuration
- Resource group assignment

### Best Practices

- Choose index type based on scale
- Use partitions for data isolation
- Configure proper nprobe for recall
- Monitor query latency and throughput

### Dependencies

- pymilvus
- langchain-milvus
