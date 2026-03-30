---
name: rag-chunking-strategy
description: Document chunking with multiple strategies including semantic, recursive, and fixed-size chunking
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# RAG Chunking Strategy Skill

## Capabilities

- Implement multiple document chunking strategies
- Configure semantic chunking based on content boundaries
- Set up recursive character text splitting
- Design fixed-size chunking with overlap
- Implement document-aware chunking (markdown, code, etc.)
- Optimize chunk sizes for retrieval quality

## Target Processes

- rag-pipeline-implementation
- chunking-strategy-design

## Implementation Details

### Chunking Strategies

1. **RecursiveCharacterTextSplitter**: Hierarchical splitting with separators
2. **SemanticChunker**: Embedding-based semantic boundaries
3. **TokenTextSplitter**: Token-aware splitting
4. **MarkdownHeaderTextSplitter**: Structure-aware markdown splitting
5. **CodeSplitter**: Language-aware code chunking

### Configuration Options

- Chunk size (characters or tokens)
- Chunk overlap percentage
- Separator hierarchy
- Embedding model for semantic chunking
- Document type detection

### Best Practices

- Match chunk size to embedding model limits
- Use appropriate overlap for context preservation
- Test retrieval quality with different strategies
- Consider document structure in strategy selection

### Dependencies

- langchain-text-splitters
- sentence-transformers (for semantic chunking)
