# Supermemory GitHub Repository

Source: https://github.com/supermemoryai/supermemory

## Overview

Supermemory is a "memory engine and app that is extremely fast, scalable" -- "the Memory API for the AI era." Ranks #1 across three major benchmarks: LongMemEval, LoCoMo, and ConvoMem.

## Core Features

### Memory System

Automatically extracts facts from conversations, handles temporal changes and contradictions, implements automatic forgetting of expired information.

### User Profiles

Dual-layer context: stable facts + recent activity. Retrievable in ~50ms per query.

### Hybrid Search

Combines RAG (document retrieval) with personalized memory in single queries.

### Connectors

Integrates with Google Drive, Gmail, Notion, OneDrive, GitHub, and web crawlers with real-time webhook synchronization.

### Multi-modal Processing

PDFs, images (OCR), videos (transcription), code (AST-aware parsing).

## Architecture

Four layers:
1. Memory Engine (fact extraction and contradiction resolution)
2. User Profiles (static + dynamic context)
3. Hybrid Search (combined RAG and memory)
4. Connectors and File Processing

## Installation

```bash
npm install supermemory  # JavaScript/Node.js
pip install supermemory  # Python
```

## Integration Frameworks

Vercel AI SDK, LangChain, LangGraph, OpenAI Agents SDK, Mastra, Agno, Claude Memory Tool, n8n.

## Client Plugins

- Claude Supermemory Plugin: https://github.com/supermemoryai/claude-supermemory
- OpenClaw Plugin: https://github.com/supermemoryai/openclaw-supermemory
- OpenCode Plugin: https://github.com/supermemoryai/opencode-supermemory
- Hermes Agent: https://github.com/NousResearch/hermes-agent

## MemoryBench

Open-source benchmarking framework supporting Supermemory, Mem0, and Zep providers. Includes MemScore metric for comparing quality, latency, and token efficiency.

## Tech Stack

TypeScript (64%), MDX (28.9%), Python (6.2%). Built with Postgres, Remix, TailwindCSS, Vite, Cloudflare Workers/KV/Pages, Drizzle ORM.

## License

MIT
