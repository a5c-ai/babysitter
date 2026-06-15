# Supermemory Deep Research

## Executive Summary

Supermemory is a cloud memory engine and context layer for AI agents, ranking #1
on all three major AI memory benchmarks (LongMemEval, LoCoMo, ConvoMem). It
provides automatic memory extraction, a knowledge graph with relationship tracking,
user profile synthesis, hybrid search (RAG + semantic memory), and multi-modal
content processing. Its most distinctive feature is SMFS (Semantic Memory File
System), which exposes memory containers as mountable directories where `grep`
becomes semantic search and `cat profile.md` returns a live-synthesized digest.

Supermemory addresses critical gaps in our current genty memory stack: we have
no semantic search, no contradiction resolution, no knowledge graph relationships,
no multi-modal extraction, and no user profile synthesis. Our memory pipeline
(`memoryExtraction.ts` + `memoryConsolidation.ts`) uses Jaccard word-set
similarity for deduplication and filter-based retrieval -- effective for small
memory stores but fundamentally limited compared to Supermemory's approach.

**Recommendation**: Integrate Supermemory as the memory backend for genty agent
runs via SMFS (filesystem mount for local, virtual bash tool for serverless).
This provides semantic memory transparently without requiring agents to learn
new tools.

## Architecture Comparison

### Our Memory Stack

```
                    genty memory architecture
                    -------------------------

  Session Messages
        |
        v
  extractMemoriesFromSession()     -- LLM extracts MemoryEntry objects
        |                             (category, confidence, tags)
        v
  persistMemories()                -- Append to long-term-memory.json
        |                             (max 500 entries, dedup by ID)
        v
  consolidateMemories()            -- Jaccard similarity dedup (0.4 threshold)
        |                             Rank by confidence + recency
        v                             Prune to 200 entries
  queryMemories()                  -- Filter by category / tags / limit
        |
        v
  crossRunState.ts                 -- Key-value JSON store for orchestration state
```

**Strengths**: Fully local, instant latency, offline-capable, simple model.

**Weaknesses**: No semantic search, no contradiction handling, no relationship
tracking, no multi-modal support, filter-only retrieval, manual extraction,
static deduplication heuristic.

### Supermemory Architecture

```
                    supermemory architecture
                    -----------------------

  Content (text/files/URLs/images/video)
        |
        v
  POST /v3/documents               -- Ingest with containerTag + metadata
        |
        v
  Processing Pipeline              -- Queued -> Extracting -> Chunking
        |                             -> Embedding -> Indexing -> Done
        v
  Knowledge Graph                  -- Update (supersedes)
        |                             Extend (enriches)
        |                             Derive (infers)
        v
  Three Retrieval Paths:
    1. Memory API                  -- Evolved user facts, temporal awareness
    2. User Profiles               -- Static + dynamic digest (~50ms)
    3. RAG Search                  -- Semantic + metadata filtering
        |
        v
  SMFS Interface                   -- Mount as directory
        |                             grep = semantic search
        |                             cat profile.md = live digest
        v
  MCP Server                      -- addMemory, search, getProjects, whoAmI
```

**Strengths**: Semantic search, knowledge graph, contradiction resolution,
temporal decay, multi-modal, user profiles, benchmark-proven accuracy.

**Weaknesses**: Requires network, cloud dependency, latency overhead (~50ms
minimum), cost per query.

## Feature Parity Matrix

| Feature                          | Genty (Current)               | Supermemory                    | Status        |
|----------------------------------|-------------------------------|--------------------------------|---------------|
| Memory extraction                | LLM-extracted MemoryEntry     | Automatic from any content     | Partial       |
| Memory storage                   | Local JSON file               | Cloud knowledge graph          | Different     |
| Semantic search                  | None                          | Core feature                   | Gap           |
| Keyword/filter retrieval         | Category + tags               | Metadata filtering             | Parity        |
| Contradiction resolution         | None                          | Automatic via Update relations | Gap           |
| Temporal decay                   | Manual prune by count         | Brain-inspired decay curves    | Gap           |
| Knowledge relationships          | None                          | Update / Extend / Derive       | Gap           |
| Multi-modal extraction           | None                          | PDF, image (OCR), video, code  | Gap           |
| User profile synthesis           | None                          | Static + dynamic digest        | Gap           |
| Cross-run state                  | Key-value JSON store          | Container persistence          | Parity        |
| Deduplication                    | Jaccard similarity (0.4)      | Knowledge graph dedup          | Partial       |
| Offline operation                | Full                          | None (cloud-only)              | Our advantage |
| Retrieval latency                | ~0ms (local JSON)             | ~50ms (cloud API)              | Our advantage |
| Max memory entries               | 200-500                       | Billions                       | Gap           |
| MCP integration                  | Client (consumer)             | Server (provider)              | Complementary |
| Filesystem interface             | None                          | SMFS (NFS/FUSE mount)          | Gap           |
| Connectors                       | None                          | 7 (GitHub, Gmail, Drive, etc.) | Gap           |
| Framework integrations           | Internal only                 | 15+ (LangChain, CrewAI, etc.) | Gap           |
| Benchmarking                     | None                          | MemoryBench framework          | Gap           |
| Cost                             | Free (local compute)          | API pricing                    | Our advantage |

## Integration Strategy

### Preferred: SMFS as Transparent Memory Backend

The recommended integration path is SMFS, which provides semantic memory
through standard filesystem operations. This requires no changes to agent
prompts or tool definitions -- agents already know how to `ls`, `cat`, `grep`,
and `echo >`.

**For local runs** (development, CI): Mount SMFS at run start.
```bash
smfs mount "babysitter-${userId}-${projectId}" \
  --memory-paths "/decisions/,/findings/,/patterns/,/architecture/"
```

**For serverless runs** (Kradle, Lambda): Use the virtual bash tool.
```typescript
import { createBash } from "@supermemory/bash";
const { bash } = await createBash({
  apiKey: process.env.SUPERMEMORY_API_KEY,
  containerTag: `run-${userId}-${projectId}`,
});
```

### Complementary: REST API for Orchestrator

The orchestrator (genty-platform) uses the REST API for structured operations:
- **Run start**: `client.profile()` to inject cross-run context into system prompt
- **Run end**: `client.add()` to persist run outcomes as memories
- **Search**: `client.search.memories()` for targeted retrieval with metadata filters

### Not Replaced: crossRunState.ts

The cross-run state store handles structured orchestration state (checkpoints,
phases, counters). This is a state machine concern, not a memory concern.
Supermemory does not replace it.

### Not Replaced: Local-Only Mode

For air-gapped or offline deployments, the existing `memoryExtraction.ts` +
`memoryConsolidation.ts` pipeline remains available as the local-only memory
backend. The integration should be additive, not a replacement.

## Related Files

- Raw documentation: `docs/supermemory-research/raw/`
- Layer analysis: `docs/supermemory-research/layer-analysis.md`
- Integration plan: `docs/supermemory-research/integration-plan.md`
- Atlas graph nodes: `packages/atlas/graph/agent-stack/supermemory/`
