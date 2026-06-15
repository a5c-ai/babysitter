# Supermemory Documentation Index

Source: https://supermemory.ai/docs/

## Core Concept

Supermemory functions as infrastructure for AI agent memory, enabling "perfect recall about users" to create more intelligent and personalized systems. The platform achieves state-of-the-art performance on benchmarks including LongMemEval and LoCoMo.

## Key Components

- Agent memory systems
- Content extraction capabilities
- Connectors and data syncing
- Managed RAG platform

## How It Operates

The system accepts diverse input formats -- text, files (PDF, images, documents), conversations, and video content. Supermemory then "intelligently indexes them and builds a semantic understanding graph" around entities like users or projects, retrieving contextually relevant information during queries.

## Three Context Addition Methods

1. **Memory API** -- Extracts and evolves user facts in real-time, handling knowledge updates and temporal shifts to generate user profiles

2. **User Profiles** -- Combines static information (always-known facts) with dynamic, episodic details from recent conversations

3. **RAG Search** -- Advanced semantic retrieval featuring metadata filtering and contextual chunking

All three approaches utilize the same context pool when sharing a user ID, allowing flexible implementation strategies.

## Documentation Sections

- Getting Started / Quickstart
- Authentication (API keys, scoped keys, connector branding)
- Introduction
- Content Management (documents, memories, search)
- Graph Memory (automatic memory evolution, knowledge updates, intelligent forgetting)
- User Profiles
- Connectors (GitHub, Gmail, Google Drive, Notion, OneDrive, S3, Web Crawler, Granola)
- Framework Integrations (LangChain, CrewAI, OpenAI SDK, Vercel AI SDK, LangGraph, 15+ more)
- SuperRAG (managed retrieval-augmented generation)
- SMFS (Semantic Memory File System)
- MCP (Model Context Protocol integration)
- MemoryBench (open-source benchmarking framework)
- Migration Guides (from Mem0 and Zep)
- API Reference (connections, container tags, content, documents, ingestion, profiles, search, settings)
