---
name: rag-query-transformation
description: Query expansion, HyDE, and multi-query generation for improved retrieval
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# RAG Query Transformation Skill

## Capabilities

- Implement query expansion techniques
- Configure Hypothetical Document Embeddings (HyDE)
- Set up multi-query generation
- Design query decomposition strategies
- Implement step-back prompting
- Configure query routing for specialized indices

## Target Processes

- advanced-rag-patterns
- knowledge-base-qa

## Implementation Details

### Transformation Techniques

1. **Multi-Query Generation**: Generate query variations
2. **HyDE**: Generate hypothetical answer, embed that
3. **Query Decomposition**: Break complex queries into sub-queries
4. **Step-Back Prompting**: Generate higher-level queries
5. **Query Expansion**: Add synonyms and related terms

### Configuration Options

- Number of query variations
- LLM for query generation
- Decomposition depth
- Query routing rules
- Result fusion strategy

### Best Practices

- Match technique to query complexity
- Test with representative queries
- Monitor retrieval quality changes
- Balance latency vs quality tradeoffs

### Dependencies

- langchain
- LLM provider
