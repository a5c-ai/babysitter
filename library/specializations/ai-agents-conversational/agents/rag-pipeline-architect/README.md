# RAG Pipeline Architect Agent

## Overview

The RAG Pipeline Architect is a specialized agent that designs end-to-end Retrieval-Augmented Generation systems. It provides expert guidance on all aspects of RAG architecture, from document ingestion to answer generation, optimizing for accuracy, relevance, and performance.

## Key Capabilities

- **Architecture Design**: Complete RAG pipeline planning
- **Component Selection**: Choose optimal tools for each stage
- **Optimization Strategy**: Balance quality, speed, and cost
- **Quality Framework**: Metrics and evaluation approaches
- **Implementation Planning**: Phased rollout guidance

## When to Use This Agent

Use the RAG Pipeline Architect when:
- Building a new RAG-based application
- Improving an existing RAG system's performance
- Selecting vector databases and embedding models
- Designing chunking and retrieval strategies
- Troubleshooting RAG quality issues
- Scaling RAG infrastructure

## Agent Profile

| Attribute | Value |
|-----------|-------|
| **Role** | RAG Systems Architect |
| **Primary Focus** | End-to-end pipeline design |
| **Output Format** | Structured architecture document (JSON) |
| **Optimization Goals** | Accuracy, Relevance, Latency, Cost |

## Pipeline Components

### 1. Document Processing

The architect designs ingestion pipelines handling:
- PDF, HTML, Markdown, Word documents
- Structured data (JSON, CSV, XML)
- Code files and technical documentation
- Tables, images, and multimedia
- Real-time and batch processing

### 2. Chunking Strategy

Recommendations cover:
- Semantic chunking for natural boundaries
- Recursive splitting for structured content
- Fixed-size with smart overlap
- Parent-child document hierarchies
- Metadata preservation strategies

### 3. Embedding Selection

Guidance includes:
- General vs domain-specific models
- Open source vs commercial options
- Dimensionality tradeoffs
- Multilingual considerations
- Update and migration strategies

### 4. Vector Store Architecture

Design covers:
- Provider selection (Pinecone, Weaviate, Qdrant, etc.)
- Index configuration and sharding
- Metadata schema design
- Filtering and faceting
- Backup and disaster recovery

### 5. Retrieval Pipeline

Optimization includes:
- Hybrid search configuration
- Top-k and threshold tuning
- Reranking with cross-encoders
- Query transformation (HyDE, multi-query)
- Contextual compression

### 6. Generation Component

Design encompasses:
- LLM selection and configuration
- Prompt engineering for RAG
- Context window optimization
- Citation and attribution
- Streaming and caching

## Usage Example

### Invoking the Agent

```javascript
// In a babysitter process
const pipelineDesign = await ctx.task(ragPipelineDesignTask, {
  useCase: "Customer support knowledge base",
  documentTypes: ["pdf", "html", "markdown"],
  expectedVolume: {
    documents: 10000,
    queriesPerDay: 5000
  },
  qualityRequirements: {
    retrievalRecall: 0.9,
    answerAccuracy: 0.95
  },
  latencyRequirements: {
    p95Ms: 2000
  },
  budgetConstraints: {
    monthlyBudget: 1000,
    preferOpenSource: false
  },
  existingInfrastructure: ["aws", "postgresql"]
});
```

### Sample Output

```json
{
  "pipelineOverview": {
    "name": "Customer Support RAG Pipeline",
    "description": "Production RAG system for customer support knowledge base",
    "useCase": "Answer customer questions from documentation",
    "scale": "10K documents, 5K queries/day",
    "qualityTargets": {
      "retrievalRecall": 0.9,
      "answerAccuracy": 0.95,
      "latencyP95Ms": 2000
    }
  },
  "components": {
    "documentProcessing": {
      "ingestionPipeline": "Batch processing with Unstructured.io",
      "preprocessing": [
        "Extract text from PDFs with OCR fallback",
        "Parse HTML with BeautifulSoup, preserve structure",
        "Convert Markdown to plain text with headers"
      ],
      "parsers": ["pdf", "html", "markdown"],
      "scheduling": "Nightly incremental updates"
    },
    "chunking": {
      "strategy": "recursive",
      "chunkSize": 500,
      "overlap": 50,
      "preserveStructure": true,
      "separators": ["\n\n", "\n", ". ", " "],
      "metadata": ["source", "section", "timestamp"]
    },
    "embedding": {
      "model": "text-embedding-3-small",
      "dimensions": 1536,
      "batchSize": 100,
      "rationale": "Good balance of quality and cost for support content"
    },
    "vectorStore": {
      "provider": "pinecone",
      "indexConfig": {
        "metric": "cosine",
        "pods": 1,
        "replicas": 1
      },
      "metadataSchema": {
        "source": "string",
        "section": "string",
        "timestamp": "number",
        "productArea": "string"
      }
    },
    "retrieval": {
      "searchType": "hybrid",
      "denseWeight": 0.7,
      "sparseWeight": 0.3,
      "topK": 10,
      "reranker": "cohere-rerank-v3",
      "finalK": 5,
      "filters": ["productArea"]
    },
    "generation": {
      "model": "gpt-4o",
      "promptTemplate": "Answer based on retrieved context with citations",
      "maxTokens": 500,
      "citationStyle": "inline",
      "temperature": 0.1
    }
  },
  "dataFlow": [
    "1. Document ingestion via scheduled job",
    "2. Preprocessing and text extraction",
    "3. Recursive chunking with metadata",
    "4. Batch embedding generation",
    "5. Upsert to Pinecone with metadata",
    "6. Query received from user",
    "7. Hybrid search (dense + BM25)",
    "8. Cohere reranking of top 10",
    "9. Context assembly from top 5",
    "10. GPT-4o generation with citations",
    "11. Response streaming to user"
  ],
  "recommendations": {
    "immediate": [
      "Set up Pinecone index with recommended config",
      "Implement document processing pipeline",
      "Create evaluation dataset with 100 Q&A pairs"
    ],
    "optimization": [
      "Implement query caching for common questions",
      "Add semantic caching for similar queries",
      "Fine-tune chunk size based on retrieval metrics"
    ],
    "monitoring": [
      "Track retrieval recall with labeled queries",
      "Monitor answer accuracy with user feedback",
      "Alert on latency P95 > 2500ms"
    ]
  }
}
```

## Integration with Processes

| Process | Integration Point |
|---------|------------------|
| rag-pipeline-implementation | Primary design input |
| advanced-rag-patterns | Pattern recommendations |
| vector-database-setup | Store configuration |
| chunking-strategy-design | Chunking guidance |
| knowledge-base-qa | QA system architecture |

## Design Decision Framework

### Chunking Strategy Selection

| Content Type | Recommended Strategy |
|--------------|---------------------|
| Prose/Articles | Semantic (paragraph-based) |
| Documentation | Recursive (section-aware) |
| Code | AST-based or function-level |
| Tables | Row/column preservation |
| Mixed | Hybrid with type detection |

### Embedding Model Selection

| Requirement | Recommended Model |
|-------------|------------------|
| General English | text-embedding-3-small |
| High accuracy | text-embedding-3-large |
| Multilingual | multilingual-e5-large |
| Domain-specific | Fine-tuned model |
| Low latency | sentence-transformers |

### Vector Store Selection

| Requirement | Recommended Store |
|-------------|------------------|
| Managed, scalable | Pinecone |
| GraphQL, schema | Weaviate |
| Self-hosted, fast | Qdrant |
| GPU acceleration | Milvus |
| Local development | Chroma |

### Retrieval Strategy Selection

| Use Case | Recommended Approach |
|----------|---------------------|
| General QA | Hybrid search + reranking |
| Exact matching | Higher BM25 weight |
| Conceptual | Higher dense weight |
| Multi-hop | Iterative retrieval |
| Exploratory | Agentic RAG |

## Best Practices

### Document Processing

- Preserve document structure and hierarchy
- Extract and index metadata
- Handle updates incrementally
- Maintain source attribution

### Chunking

- Test multiple strategies empirically
- Use appropriate overlap (10-20%)
- Preserve semantic coherence
- Include context in metadata

### Retrieval

- Start with hybrid search
- Always use reranking for quality
- Tune top-k based on evaluation
- Implement fallback strategies

### Generation

- Be explicit about citation requirements
- Set low temperature for factual content
- Monitor for hallucination
- Implement streaming for UX

## Evaluation Metrics

### Retrieval Metrics
- **Recall@K**: % of relevant docs in top K
- **MRR**: Mean reciprocal rank of first relevant
- **NDCG**: Normalized discounted cumulative gain

### Generation Metrics
- **Faithfulness**: Answer grounded in context
- **Relevance**: Answer addresses the question
- **Completeness**: All relevant info included
- **Fluency**: Natural language quality

## References

- [LangChain RAG](https://python.langchain.com/docs/use_cases/question_answering/)
- [LlamaIndex](https://docs.llamaindex.ai)
- [Haystack](https://haystack.deepset.ai)
- [RAG Survey Paper](https://arxiv.org/abs/2312.10997)
- [Anthropic RAG Guide](https://www.anthropic.com/research/rag-techniques)

## Related Resources

- [Pinecone Best Practices](https://docs.pinecone.io/docs/rag-best-practices)
- [Weaviate Recipes](https://weaviate.io/developers/weaviate/starter-guides)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Cohere Rerank](https://docs.cohere.com/docs/reranking)
