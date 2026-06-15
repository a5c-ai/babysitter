# Supermemory Introduction

Source: https://supermemory.ai/docs/introduction, https://supermemory.ai/docs/intro

## Core Definition

Supermemory is "the Memory API for the AI era" -- infrastructure for AI agent memory and context management. Achieves state-of-the-art performance on LongMemEval and LoCoMo benchmarks.

## Key Characteristics

- **Scalability** -- handles growing data volumes
- **Performance** -- "hyper fast" operations
- **Affordability** -- cost-effective pricing
- **Production-Ready** -- suitable for real-world deployment

## Main Components

- **Memory APIs**: Composable APIs for memory operations and RAG
- **User Profiles**: Contextual intelligence for LLMs combining static and dynamic facts
- **SDK Integration**: Multiple SDKs for Python and TypeScript
- **Connectors**: Real-time sync with Google Drive, Gmail, Notion, OneDrive, GitHub, web crawlers

## Operational Flow

1. **Input**: Users submit text, files, and chat conversations
2. **Processing**: Supermemory indexes them and builds a semantic understanding graph tied to entities (users, documents, projects, organizations)
3. **Retrieval**: At query time, the most contextually relevant information reaches the language model

## Context Delivery Methods

- **Memory API** extracts and maintains evolving user facts in real-time
- **User Profiles** combine static baseline with dynamic episodic details
- **RAG Integration** provides semantic search with metadata filtering and contextual chunking

All three share the same context pool when using identical user identifiers.
