---
name: rag-reranking
description: Cross-encoder reranking and MMR diversity filtering for improved retrieval quality
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# RAG Reranking Skill

## Capabilities

- Implement cross-encoder reranking models
- Configure Maximal Marginal Relevance (MMR) filtering
- Set up Cohere Rerank integration
- Design multi-stage retrieval pipelines
- Implement diversity-aware reranking
- Configure score normalization and thresholds

## Target Processes

- advanced-rag-patterns
- rag-pipeline-implementation

## Implementation Details

### Reranking Methods

1. **Cross-Encoder Reranking**: Sentence-transformer cross-encoders
2. **Cohere Rerank**: Cohere rerank-v3 API
3. **MMR Reranking**: Diversity-aware result filtering
4. **LLM Reranking**: Using LLM for relevance scoring
5. **Reciprocal Rank Fusion**: Combining multiple retrievers

### Configuration Options

- Reranking model selection
- Top-k after reranking
- MMR lambda (relevance vs diversity)
- Score threshold filtering
- Batch size for reranking

### Best Practices

- Use cross-encoders for quality
- Balance relevance and diversity
- Set appropriate thresholds
- Monitor reranking latency

### Dependencies

- sentence-transformers
- cohere (optional)
