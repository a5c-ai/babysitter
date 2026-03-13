---
name: rag-hybrid-search
description: Hybrid search combining semantic and keyword retrieval for RAG pipelines. Implement BM25 + dense vector search with fusion strategies.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob, WebFetch
---

# rag-hybrid-search

Implement hybrid search combining semantic vector retrieval with keyword-based BM25 search for improved RAG pipeline accuracy and recall.

## Overview

Hybrid search addresses the limitations of pure semantic or pure keyword search:
- Semantic search excels at conceptual similarity but may miss exact matches
- Keyword search finds exact terms but lacks semantic understanding
- Hybrid combines both for superior retrieval performance

## Capabilities

### Search Strategies
- Dense vector semantic search (embeddings)
- Sparse vector keyword search (BM25, TF-IDF)
- Hybrid fusion with configurable weighting
- Reciprocal Rank Fusion (RRF) combination

### Retrieval Configuration
- Configure embedding models for dense search
- Tune BM25 parameters (k1, b values)
- Set retrieval limits and thresholds
- Apply metadata filtering

### Ranking & Reranking
- Score normalization across search types
- Weighted score fusion
- Cross-encoder reranking
- MMR (Maximum Marginal Relevance) diversity

### Index Management
- Create and update hybrid indexes
- Batch indexing with progress tracking
- Index optimization and maintenance
- Multi-index federation

## Usage

### Basic Hybrid Search with LangChain

```python
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import Chroma
from langchain.retrievers import EnsembleRetriever
from langchain_openai import OpenAIEmbeddings

# Create documents
docs = [...]  # Your document chunks

# Dense retriever (semantic)
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(docs, embeddings)
dense_retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# Sparse retriever (BM25)
bm25_retriever = BM25Retriever.from_documents(docs)
bm25_retriever.k = 5

# Hybrid ensemble
hybrid_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, dense_retriever],
    weights=[0.4, 0.6]  # Adjust based on use case
)

# Query
results = hybrid_retriever.invoke("How do I configure the system?")
```

### Reciprocal Rank Fusion

```python
def reciprocal_rank_fusion(results_lists: list, k: int = 60) -> list:
    """
    Combine multiple ranked lists using RRF.
    k is a constant (typically 60) for smoothing.
    """
    fused_scores = {}

    for results in results_lists:
        for rank, doc in enumerate(results):
            doc_id = doc.metadata.get("id", str(doc.page_content[:50]))
            if doc_id not in fused_scores:
                fused_scores[doc_id] = {"doc": doc, "score": 0}
            fused_scores[doc_id]["score"] += 1 / (k + rank + 1)

    # Sort by fused score
    sorted_docs = sorted(
        fused_scores.values(),
        key=lambda x: x["score"],
        reverse=True
    )

    return [item["doc"] for item in sorted_docs]

# Use with multiple retrievers
semantic_results = dense_retriever.invoke(query)
keyword_results = bm25_retriever.invoke(query)
hybrid_results = reciprocal_rank_fusion([semantic_results, keyword_results])
```

### Pinecone Hybrid Search

```python
from pinecone import Pinecone
from pinecone_text.sparse import BM25Encoder

# Initialize Pinecone
pc = Pinecone(api_key="your-api-key")
index = pc.Index("hybrid-index")

# Prepare sparse encoder
bm25 = BM25Encoder()
bm25.fit(corpus)  # Fit on your document corpus

def hybrid_query(query: str, alpha: float = 0.5, top_k: int = 10):
    """
    Query with hybrid search.
    alpha: weight for dense vectors (1-alpha for sparse)
    """
    # Get dense embedding
    dense_embedding = embeddings.embed_query(query)

    # Get sparse embedding
    sparse_embedding = bm25.encode_queries([query])[0]

    # Hybrid query
    results = index.query(
        vector=dense_embedding,
        sparse_vector=sparse_embedding,
        top_k=top_k,
        include_metadata=True
    )

    return results
```

### Weaviate Hybrid Search

```python
import weaviate

client = weaviate.Client("http://localhost:8080")

def weaviate_hybrid_search(query: str, alpha: float = 0.5, limit: int = 10):
    """
    Weaviate native hybrid search.
    alpha: 0 = pure BM25, 1 = pure vector
    """
    result = (
        client.query
        .get("Document", ["content", "title", "metadata"])
        .with_hybrid(
            query=query,
            alpha=alpha,
            properties=["content", "title"]
        )
        .with_limit(limit)
        .do()
    )

    return result["data"]["Get"]["Document"]
```

## Task Definition

```javascript
const ragHybridSearchTask = defineTask({
  name: 'rag-hybrid-search-setup',
  description: 'Configure hybrid search for RAG pipeline',

  inputs: {
    vectorStore: { type: 'string', required: true },  // 'pinecone', 'weaviate', 'chroma', etc.
    embeddingModel: { type: 'string', default: 'text-embedding-3-small' },
    bm25Params: { type: 'object', default: { k1: 1.5, b: 0.75 } },
    fusionStrategy: { type: 'string', default: 'rrf' },  // 'rrf', 'weighted', 'custom'
    denseWeight: { type: 'number', default: 0.6 },
    topK: { type: 'number', default: 10 }
  },

  outputs: {
    retrieverConfigured: { type: 'boolean' },
    indexStats: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Configure hybrid search with ${inputs.vectorStore}`,
      skill: {
        name: 'rag-hybrid-search',
        context: {
          vectorStore: inputs.vectorStore,
          embeddingModel: inputs.embeddingModel,
          bm25Params: inputs.bm25Params,
          fusionStrategy: inputs.fusionStrategy,
          denseWeight: inputs.denseWeight,
          topK: inputs.topK,
          instructions: [
            'Validate vector store connection and configuration',
            'Set up dense embedding pipeline',
            'Configure BM25/sparse encoding',
            'Implement fusion strategy',
            'Test retrieval quality with sample queries',
            'Document configuration and tuning parameters'
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

- rag-pipeline-implementation
- advanced-rag-patterns
- knowledge-base-qa
- vector-database-setup

## External Dependencies

- Vector database (Pinecone, Weaviate, Chroma, Milvus, Qdrant)
- Embedding provider (OpenAI, Cohere, Hugging Face)
- BM25 encoder (rank_bm25, pinecone-text)

## References

- [Claude Context (Zilliz)](https://github.com/zilliztech/claude-context) - Hybrid search MCP
- [MCP Local RAG](https://github.com/shinpr/mcp-local-rag) - Local-first RAG with hybrid search
- [LangChain Anthropic MCP Server](https://glama.ai/mcp/servers/@spencer-life/langchain-anthropic-mcp-server)
- [Pinecone Hybrid Search](https://docs.pinecone.io/docs/hybrid-search)
- [Weaviate Hybrid Search](https://weaviate.io/developers/weaviate/search/hybrid)

## Related Skills

- SK-RAG-001 rag-chunking-strategy
- SK-RAG-004 rag-reranking
- SK-RAG-005 rag-query-transformation
- SK-VDB-001 through SK-VDB-005 (vector database integrations)

## Related Agents

- AG-RAG-001 rag-pipeline-architect
- AG-RAG-003 vector-db-specialist
- AG-RAG-004 retrieval-optimizer
