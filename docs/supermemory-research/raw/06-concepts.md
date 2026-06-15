# Supermemory Concepts

Source: https://supermemory.ai/docs/concepts

## Core Architecture

### Knowledge Graph vs. Traditional Storage

Supermemory replaces conventional file-folder systems with "a living knowledge graph" that creates rich relationships between stored information. Rather than static documents, the system generates "semantic chunks with meaning" that are "embedded for similarity search" and dynamically interconnected.

## Key Terminology

### Documents

Raw input materials users provide (PDFs, web pages, text, images, videos). These serve as source content.

### Memories

Processed outputs created by Supermemory -- intelligent knowledge units extracted from documents that capture understanding and context rather than raw data.

## Memory Relationships (Three Types)

1. **Updates**: Occur when new information contradicts existing knowledge, with the system tracking which version is current via an `isLatest` field

2. **Extends**: Created when new information enriches without replacing existing knowledge; both memories remain valid and searchable

3. **Derives**: The system infers new connections from patterns across the knowledge base, generating insights not explicitly stated

## Processing Pipeline

Documents progress through six stages:

1. Queued
2. Extracting
3. Chunking
4. Embedding
5. Indexing
6. Done

Processing time scales with content complexity; larger documents require 1-2 minutes, while hour-long videos may need 5-10 minutes.

## Mental Model

Supermemory emphasizes "semantic understanding" over keyword matching, enabling information to "evolve and connect" rather than remaining "frozen" like traditional systems.
