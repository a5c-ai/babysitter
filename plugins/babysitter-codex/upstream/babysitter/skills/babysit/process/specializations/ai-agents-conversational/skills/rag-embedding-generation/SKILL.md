---
name: rag-embedding-generation
description: Batch embedding generation with caching, rate limiting, and multiple provider support
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# RAG Embedding Generation Skill

## Capabilities

- Generate embeddings with multiple providers
- Implement batch processing for large datasets
- Configure caching for embedding reuse
- Handle rate limiting and retries
- Support various embedding models
- Implement embedding quality validation

## Target Processes

- rag-pipeline-implementation
- vector-database-setup

## Implementation Details

### Embedding Providers

1. **OpenAI Embeddings**: text-embedding-ada-002, text-embedding-3-*
2. **HuggingFace**: sentence-transformers models
3. **Cohere**: embed-v3 models
4. **Voyage AI**: voyage-2 models
5. **Local Models**: GGUF/ONNX embedding models

### Configuration Options

- Model selection and parameters
- Batch size optimization
- Cache backend configuration
- Rate limit settings
- Retry policies
- Dimensionality settings

### Best Practices

- Use appropriate model for domain
- Implement caching for cost reduction
- Monitor embedding quality
- Handle API errors gracefully

### Dependencies

- langchain-openai / langchain-huggingface
- numpy
- Caching backend (Redis, SQLite)
