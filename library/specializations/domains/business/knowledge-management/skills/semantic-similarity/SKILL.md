---
name: semantic-similarity
description: Semantic similarity computation for content relationships and intelligent discovery
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: knowledge-management
  domain: business
  category: Knowledge Organization
  skill-id: SK-020
---

# Semantic Similarity Skill

## Overview

The Semantic Similarity skill provides advanced capabilities for computing and leveraging semantic relationships between content in knowledge management systems. Using modern embedding models and vector similarity techniques, this skill enables intelligent content discovery, recommendation, and organization beyond traditional keyword matching.

## Capabilities

### Document Embedding Generation
- Generate embeddings for documents and content
- Configure embedding models (OpenAI, Cohere, open-source)
- Implement batch embedding pipelines
- Manage embedding storage and retrieval
- Optimize embedding dimensions for use case

### Sentence Transformer Models
- Configure sentence-transformers models
- Fine-tune models for domain-specific content
- Implement multi-lingual embedding models
- Design model selection strategies

### Similarity Search and Clustering
- Implement vector similarity search (cosine, dot product)
- Configure approximate nearest neighbor (ANN) algorithms
- Design content clustering pipelines
- Implement hierarchical clustering for organization

### Related Content Recommendation
- Build content recommendation systems
- Configure "More Like This" functionality
- Implement collaborative filtering with embeddings
- Design hybrid recommendation approaches

### Duplicate Detection
- Identify duplicate and near-duplicate content
- Configure similarity thresholds for detection
- Implement deduplication workflows
- Design merge and consolidation strategies

### Topic Modeling
- Implement LDA (Latent Dirichlet Allocation)
- Configure BERTopic for modern topic modeling
- Design topic hierarchies and taxonomies
- Enable dynamic topic tracking

### Semantic Search Integration
- Configure semantic search pipelines
- Implement hybrid search (keyword + semantic)
- Design query expansion using embeddings
- Enable cross-lingual semantic search

### Content Gap Analysis
- Identify missing content through similarity analysis
- Map content coverage using embeddings
- Detect underserved topics and areas
- Design content planning recommendations

### Concept Extraction
- Extract key concepts from documents
- Build concept graphs from embeddings
- Implement keyphrase extraction
- Design concept tagging pipelines

## Dependencies

- Sentence-transformers library
- OpenAI Embeddings API
- Cohere Embed API
- Pinecone vector database
- Weaviate
- Milvus
- FAISS (Facebook AI Similarity Search)
- scikit-learn for clustering

## Process Integration

This skill integrates with:

- **search-optimization.js**: Semantic search and related content features
- **knowledge-base-content.js**: Content recommendations and gap analysis
- **tacit-to-explicit-conversion.js**: Knowledge representation and concept extraction

## Usage

### Generate Document Embeddings

```yaml
task: Generate embeddings for knowledge base content
skill: semantic-similarity
parameters:
  source: knowledge-base
  model: text-embedding-3-small
  batch_size: 100
  output: vector-store
  dimensions: 1536
```

### Configure Similarity Search

```yaml
task: Set up semantic similarity search
skill: semantic-similarity
parameters:
  vector_store: pinecone
  index_name: kb-embeddings
  similarity_metric: cosine
  top_k: 10
  hybrid_search: true
  keyword_weight: 0.3
```

### Duplicate Detection

```yaml
task: Identify duplicate content
skill: semantic-similarity
parameters:
  threshold: 0.92
  scope: all-documents
  output: duplicate-report.json
  action: flag_for_review
```

### Topic Modeling

```yaml
task: Generate topic model for knowledge base
skill: semantic-similarity
parameters:
  method: bertopic
  min_topic_size: 10
  nr_topics: auto
  output: topic-model
  visualizations: true
```

## Best Practices

1. **Choose appropriate embedding models** - Match model to content type and language
2. **Normalize embeddings** - Ensure consistent similarity scores across documents
3. **Set appropriate thresholds** - Tune similarity thresholds for your use case
4. **Implement hybrid search** - Combine semantic and keyword search for best results
5. **Monitor embedding drift** - Re-embed content periodically as models improve
6. **Consider latency** - Cache frequently used embeddings for performance
7. **Plan for scale** - Use ANN indexes for large document collections
8. **Handle long documents** - Implement chunking strategies for lengthy content

## Architecture Patterns

### Basic Semantic Search Pipeline

```
Document -> Chunking -> Embedding -> Vector Store -> Query -> Results
```

### Hybrid Search Architecture

```
Query -> [Keyword Search] -> Results
      -> [Semantic Search] -> Results
      -> [Reranking] -> Final Results
```

### Recommendation Pipeline

```
User Context -> Find Similar Content -> Filter by Metadata -> Personalize -> Recommend
```

## Metrics

Key metrics for semantic similarity systems:

| Metric | Description | Target |
|--------|-------------|--------|
| Retrieval Precision | Relevant results in top-k | > 80% |
| Search Latency | Time for similarity search | < 200ms |
| Duplicate Detection F1 | Accuracy of duplicate finding | > 90% |
| Topic Coherence | Quality of topic models | > 0.5 |
| User Satisfaction | Relevance ratings | > 4.0/5.0 |

## Related Skills

- **knowledge-graph** (SK-008): Graph-based semantic relationships
- **search-engine** (SK-005): Enterprise search integration
- **content-curation** (SK-010): Quality-based content management

## Related Agents

- **kg-specialist** (AG-008): Knowledge graph and semantic expertise
- **search-expert** (AG-004): Search optimization guidance
- **knowledge-architect** (AG-001): Overall KM strategy alignment
