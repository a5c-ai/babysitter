# RAG Hybrid Search Skill

## Overview

The `rag-hybrid-search` skill implements advanced retrieval strategies that combine semantic (dense vector) search with keyword (sparse/BM25) search. This hybrid approach significantly improves retrieval quality for RAG applications by leveraging the complementary strengths of both methods.

## Why Hybrid Search?

| Search Type | Strengths | Weaknesses |
|-------------|-----------|------------|
| Semantic (Dense) | Conceptual similarity, synonyms, paraphrases | May miss exact keyword matches |
| Keyword (Sparse) | Exact term matching, acronyms, specific names | No semantic understanding |
| Hybrid | Best of both worlds | Requires tuning, more complex |

## Key Features

- **Multi-Strategy Retrieval**: Combine dense and sparse vectors
- **Configurable Fusion**: Weighted or RRF-based result combination
- **Cross-Platform Support**: Works with major vector databases
- **Reranking Integration**: Optional cross-encoder reranking
- **Metadata Filtering**: Filter results by document attributes

## Prerequisites

1. **Vector Database**: Pinecone, Weaviate, Chroma, Milvus, or Qdrant
2. **Embedding Model**: Access to embedding API (OpenAI, Cohere, etc.)
3. **Python Environment**: Python 3.8+ with required packages

## Installation

```bash
# Core dependencies
pip install langchain langchain-community rank-bm25

# Vector store specific
pip install chromadb  # For Chroma
pip install pinecone-client pinecone-text  # For Pinecone
pip install weaviate-client  # For Weaviate
```

## Quick Start

### 1. Prepare Documents

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load your documents
docs = load_documents("./data")

# Split into chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
chunks = splitter.split_documents(docs)
```

### 2. Create Hybrid Retriever

```python
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import Chroma
from langchain.retrievers import EnsembleRetriever
from langchain_openai import OpenAIEmbeddings

# Initialize embeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Create vector store
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name="my_collection"
)

# Create retrievers
dense_retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 10}
)

bm25_retriever = BM25Retriever.from_documents(chunks, k=10)

# Combine into hybrid retriever
hybrid_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, dense_retriever],
    weights=[0.4, 0.6]  # 40% BM25, 60% semantic
)
```

### 3. Query and Retrieve

```python
# Simple query
query = "How do I configure authentication?"
results = hybrid_retriever.invoke(query)

# With metadata filtering (if supported)
results = hybrid_retriever.invoke(
    query,
    filter={"category": "authentication"}
)

for doc in results:
    print(f"Score: {doc.metadata.get('score', 'N/A')}")
    print(f"Content: {doc.page_content[:200]}...")
    print("---")
```

## Fusion Strategies

### Weighted Combination

```python
def weighted_fusion(
    semantic_results: list,
    keyword_results: list,
    semantic_weight: float = 0.6
) -> list:
    """Simple weighted score combination."""
    combined = {}

    # Process semantic results
    for i, doc in enumerate(semantic_results):
        doc_id = get_doc_id(doc)
        score = (len(semantic_results) - i) / len(semantic_results)
        combined[doc_id] = {
            "doc": doc,
            "score": score * semantic_weight
        }

    # Add keyword results
    keyword_weight = 1 - semantic_weight
    for i, doc in enumerate(keyword_results):
        doc_id = get_doc_id(doc)
        score = (len(keyword_results) - i) / len(keyword_results)
        if doc_id in combined:
            combined[doc_id]["score"] += score * keyword_weight
        else:
            combined[doc_id] = {
                "doc": doc,
                "score": score * keyword_weight
            }

    # Sort by combined score
    sorted_results = sorted(
        combined.values(),
        key=lambda x: x["score"],
        reverse=True
    )

    return [item["doc"] for item in sorted_results]
```

### Reciprocal Rank Fusion (RRF)

```python
def rrf_fusion(
    result_lists: list[list],
    k: int = 60
) -> list:
    """
    RRF is often more robust than weighted combination.
    Standard k value is 60.
    """
    fused_scores = {}

    for results in result_lists:
        for rank, doc in enumerate(results):
            doc_id = get_doc_id(doc)
            if doc_id not in fused_scores:
                fused_scores[doc_id] = {
                    "doc": doc,
                    "score": 0
                }
            # RRF formula: 1 / (k + rank)
            fused_scores[doc_id]["score"] += 1.0 / (k + rank + 1)

    sorted_results = sorted(
        fused_scores.values(),
        key=lambda x: x["score"],
        reverse=True
    )

    return [item["doc"] for item in sorted_results]
```

## Vector Database Configurations

### Pinecone Hybrid Index

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="your-key")

# Create hybrid index
pc.create_index(
    name="hybrid-index",
    dimension=1536,
    metric="dotproduct",  # Required for hybrid
    spec=ServerlessSpec(cloud="aws", region="us-east-1")
)

# Upsert with both dense and sparse vectors
index = pc.Index("hybrid-index")
index.upsert(
    vectors=[{
        "id": "doc1",
        "values": dense_vector,
        "sparse_values": {"indices": [1, 5, 10], "values": [0.5, 0.3, 0.8]},
        "metadata": {"text": "document content"}
    }]
)
```

### Weaviate Native Hybrid

```python
import weaviate

client = weaviate.connect_to_local()

# Query with native hybrid
response = client.collections.get("Documents").query.hybrid(
    query="search query",
    alpha=0.5,  # 0=BM25, 1=vector
    limit=10,
    return_metadata=weaviate.classes.query.MetadataQuery(score=True)
)
```

### Qdrant Hybrid

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

# Query with both dense and sparse vectors
results = client.query_points(
    collection_name="hybrid_collection",
    prefetch=[
        models.Prefetch(
            query=dense_vector,
            using="dense",
            limit=20
        ),
        models.Prefetch(
            query=models.SparseVector(indices=[...], values=[...]),
            using="sparse",
            limit=20
        )
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF)
)
```

## Integration with Babysitter Processes

| Process | Integration Point |
|---------|------------------|
| rag-pipeline-implementation | Core retrieval mechanism |
| advanced-rag-patterns | Advanced retrieval strategies |
| knowledge-base-qa | Question answering retrieval |
| vector-database-setup | Index configuration |

## Tuning Guidelines

### Weight Selection

- **Exact match heavy domains** (legal, medical codes): Higher BM25 weight (0.5-0.7)
- **Conceptual queries** (research, general QA): Higher semantic weight (0.6-0.8)
- **Balanced use cases**: Start with 0.5/0.5 and tune

### Top-K Selection

- **Precision-focused**: Lower k (5-10) with higher quality threshold
- **Recall-focused**: Higher k (20-50) for comprehensive coverage
- **With reranking**: Higher k (30+) as reranker will refine

### BM25 Parameters

- **k1** (term saturation): Default 1.5, increase for longer documents
- **b** (length normalization): Default 0.75, decrease if length shouldn't matter

## Troubleshooting

### Poor Hybrid Results

1. Check individual retriever quality separately
2. Verify embeddings and BM25 are indexing same content
3. Experiment with different weight combinations
4. Consider query-dependent weighting

### BM25 Missing Matches

1. Ensure documents are tokenized consistently
2. Check for stemming/lemmatization mismatches
3. Verify special characters are handled

### Slow Performance

1. Reduce top-k for each retriever
2. Implement caching for frequent queries
3. Use approximate search for dense vectors
4. Pre-filter with metadata when possible

## Security Considerations

- Validate and sanitize all search queries
- Implement rate limiting on search endpoints
- Be cautious with metadata exposure in results
- Consider query logging for audit trails

## References

- [Pinecone Hybrid Search Guide](https://docs.pinecone.io/docs/hybrid-search)
- [Weaviate Hybrid Search](https://weaviate.io/developers/weaviate/search/hybrid)
- [RAG Fusion Paper](https://arxiv.org/abs/2402.03367)
- [Claude Context](https://github.com/zilliztech/claude-context)

## Related Resources

- [MCP Local RAG](https://github.com/shinpr/mcp-local-rag)
- [LangChain Retrievers](https://python.langchain.com/docs/modules/data_connection/retrievers/)
- [LlamaIndex Hybrid Search](https://docs.llamaindex.ai/en/stable/examples/retrievers/bm25_retriever.html)
