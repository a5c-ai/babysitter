# SMFS: Making Agentic Retrieval 55% Cheaper and More Accurate

Source: https://blog.supermemory.ai/smfs-making-agentic-retrieval-55-cheaper-and-more-accurate/

## Overview

SMFS.ai (Supermemory Filesystem) is a purpose-built filesystem designed for AI agents. Combines agentic search with semantic retrieval to optimize cost and accuracy.

## Core Features

- FUSE-powered filesystem with instant loading
- Auto-generated profiles (`/profile.md`) that update dynamically
- Multi-modal support via OCR (images to searchable text)
- Enhanced grep: semantic search alongside traditional string matching

## The Problem

**Agentic search** provides control and structure but struggles at scale -- agents must manually traverse directories and maintain context across operations.

**Semantic RAG retrieval** efficiently finds content but strips context -- returns isolated chunks without surrounding information or file relationships.

Developers were forced to choose between control (agentic) or reach (semantic).

## The Solution: xAFS Benchmark

Created a realistic evaluation framework featuring:
- Mixed conversational and document data
- Scalable file counts up to 10,000
- Multi-hop and temporal reasoning queries
- Files exceeding 10,000 tokens each

## Performance Results

- **Accuracy**: At 10,000 files, SMFS maintained 81% accuracy vs 69% for baseline filesystems
- **Cost reduction**: 55% cheaper overall ($946 vs $2,103 across evaluations)
- **Token efficiency**: 53.8% fewer tokens used; 53.1% fewer per correct answer
- **Per-query savings**: One corpus showed $4.71 cost vs $20.95 for baseline
- **Claude specifically**: -66% tokens, -60% tool calls with improved accuracy

## Technical Approach

Hybrid methodology:
1. Semantic search lands on specific file paths
2. Agent-controlled navigation through surrounding context
3. Targeted grep operations within identified subtrees

Agents trust their starting points while maintaining control over exploration.
