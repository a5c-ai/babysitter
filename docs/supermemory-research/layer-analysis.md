# Supermemory Layer Analysis

Deep analysis of Supermemory through the agentic layer lens, mapping its capabilities
to our L1-L14 atlas layer model and comparing with existing genty memory infrastructure.

## 1. SMFS Mapping to L4-L5 Layers

### L4 -- Agent Core

SMFS does not operate at L4 (agent core loop). It is not an agent runtime or
orchestration engine. However, it fundamentally shapes what tools an L4 agent has
available. When SMFS is mounted, the agent's tool surface changes:

- `grep` becomes semantic search (no flags = semantic, flags = exact-match)
- `cat profile.md` returns a live-synthesized user digest (not a stored file)
- Standard `ls`, `cat`, `echo >` work against the knowledge graph as if it were a filesystem

This is a *tool-shaping* integration at L4: the agent uses the same tool calls
(Bash/Read/Write) but the backing implementation routes through Supermemory's
semantic index transparently.

### L5 -- Agent Runtime

SMFS maps most naturally to L5 (Agent Runtime), specifically the session persistence
and memory extraction subsystem:

| L5 Concern              | Our Implementation                           | SMFS Equivalent                              |
|--------------------------|----------------------------------------------|----------------------------------------------|
| Session persistence      | `crossRunState.ts` (JSON key-value store)    | Container as mounted directory               |
| Memory extraction        | `memoryExtraction.ts` (LLM-extracted facts)  | Automatic memory from written files           |
| Memory consolidation     | `memoryConsolidation.ts` (Jaccard dedup)     | Knowledge graph with Update/Extend/Derive     |
| Memory retrieval         | `queryMemories()` (category/tag filter)      | `grep` (semantic) + `cat profile.md` (digest) |
| Cross-session state      | `shared-state.json` file                     | Persistent container with bidirectional sync   |

**Key difference**: Our L5 memory is *pull-based* -- we explicitly call
`extractMemoriesFromSession()` and `persistMemories()` at session boundaries.
SMFS is *ambient* -- writes to the mounted directory are automatically indexed
and become searchable. The agent does not need to know it is using a memory system.

### L5 Runtime Integration Points

SMFS's virtual Bash tool (`@supermemory/bash`) is directly pluggable into our
runtime as an additional tool provider. The `createBash()` factory returns a tool
that can be injected alongside our existing tool surface.

```typescript
// Hypothetical genty integration
const { bash } = await createBash({
  apiKey: process.env.SUPERMEMORY_API_KEY,
  containerTag: `run-${runId}-user-${userId}`,
});
// bash.exec() becomes available as a tool alongside our existing tools
```

## 2. Memory API Comparison

### Our Memory Pipeline

```
Session Messages -> extractMemoriesFromSession() -> MemoryEntry[]
                                                          |
                                                    persistMemories()
                                                          |
                                                  long-term-memory.json
                                                          |
                                                  queryMemories() (filter by category/tags)
                                                          |
                                                  consolidateMemories() (Jaccard dedup, prune)
```

**Characteristics:**
- Extraction: LLM-assisted, produces `MemoryEntry` objects with category/confidence/tags
- Storage: Local JSON file (`long-term-memory.json`)
- Retrieval: Filter-based (category, tags, limit) -- no semantic search
- Deduplication: Jaccard word-set similarity (threshold 0.4)
- Limits: 500 entries max (extraction), 200 after consolidation
- No knowledge graph, no relationship tracking between memories

### Supermemory Memory Pipeline

```
Content (text/files/URLs) -> POST /v3/documents
                                    |
                          Queued -> Extracting -> Chunking -> Embedding -> Indexing -> Done
                                    |
                          Knowledge Graph (Update / Extend / Derive relationships)
                                    |
                          Three retrieval paths:
                            1. Memory API (evolved user facts)
                            2. User Profiles (static + dynamic digest)
                            3. RAG Search (semantic + metadata filtering)
```

**Characteristics:**
- Extraction: Automatic from any content type (text, PDF, images, video)
- Storage: Cloud knowledge graph with vector embeddings
- Retrieval: Semantic search, hybrid search, profile synthesis
- Deduplication: Knowledge graph relationships (Update supersedes, Extend enriches, Derive infers)
- Limits: Scales to billions of data points
- Active contradiction resolution and temporal decay

### Gap Analysis

| Capability                       | Genty (Current)          | Supermemory              | Gap                                          |
|----------------------------------|--------------------------|--------------------------|----------------------------------------------|
| Semantic search                  | None                     | Core feature             | Critical gap -- our retrieval is filter-only  |
| Contradiction resolution         | None                     | Automatic via Updates    | Significant gap                              |
| Temporal decay / forgetting      | Manual prune by count    | Brain-inspired decay     | Moderate gap                                 |
| Knowledge graph relationships    | None                     | Update/Extend/Derive    | Significant gap                              |
| Multi-modal extraction           | None                     | PDF, image, video, code  | Large gap                                    |
| Retrieval latency                | ~instant (local JSON)    | ~50ms (cloud API)        | Our advantage for simple cases               |
| Offline operation                | Full (local files)       | Requires network         | Our advantage                                |
| User profiles                    | None                     | Static + dynamic         | Moderate gap                                 |
| Cross-run state                  | Key-value store          | Container persistence    | Parity (different models)                    |

## 3. MCP Integration Comparison

### Our MCP Client

Our stack uses MCP for tool and resource integration from external servers. The MCP
client in the genty platform connects to MCP servers configured in `.mcp.json` or
equivalent, providing tools to the agent runtime.

### Supermemory MCP Server

Supermemory exposes itself as an MCP server with four tools:
- `addMemory` -- save information
- `search` -- retrieve memories and profiles
- `getProjects` -- list projects
- `whoAmI` -- user identity

**Integration model**: Supermemory's MCP server is a *provider*, our MCP client is
a *consumer*. The integration is straightforward -- add Supermemory's MCP endpoint
to our MCP client configuration.

**However**, the SMFS approach may be superior for our use case. Instead of adding
MCP tools that the agent must learn to call, SMFS makes memory transparent through
the filesystem. The agent writes files and searches with grep -- operations it
already knows how to do. This avoids adding cognitive load to the agent prompt.

### Recommendation

For genty integration, prefer SMFS (filesystem mount or virtual bash tool) over
the raw MCP server. The MCP server is better suited for interactive IDE clients
(Cursor, VS Code) where memory persistence across human chat sessions is the goal.
For orchestrated agent runs, SMFS provides the same memory without requiring the
agent to learn new tools.

## 4. Unique Capabilities

### Semantic Memory File System (SMFS)

The most distinctive feature. No other memory provider collapses four components
(vector DB, memory service, profile store, SDK) into a single filesystem mount.
This is architecturally novel and maps perfectly to agents that already interact
with filesystems.

**Benchmark results** (xAFS evaluation):
- 81% accuracy at 10,000 files vs 69% for baseline
- 55% cheaper ($946 vs $2,103)
- 53.8% fewer tokens
- For Claude: -66% tokens, -60% tool calls

### Knowledge Graph Relationships

Three relationship types (Update, Extend, Derive) provide automatic knowledge
evolution that no other memory system offers at this level:
- **Update**: New info contradicts old -- system tracks which is current
- **Extend**: New info enriches without replacing
- **Derive**: System infers connections not explicitly stated

### Brain-Inspired Decay

Memory importance decays over time unless reinforced by access, mimicking
biological forgetting curves. This prevents memory bloat without manual pruning.

### User Profile Synthesis

`cat profile.md` returns a regenerated-on-read digest of all memories for a
container. This is not stored -- it is synthesized each time, ensuring it always
reflects the latest state. No equivalent exists in our stack.

## 5. Integration Opportunities

### Tier 1: Drop-In SMFS Mount for Babysitter Runs

Mount a Supermemory container per user/project at run start. Agent writes to
memory paths during the run; memories persist across runs automatically.

```bash
smfs mount "babysitter-${userId}-${projectId}" \
  --memory-paths "/decisions/,/findings/,/patterns/"
```

This replaces `memoryExtraction.ts` + `memoryConsolidation.ts` for cross-run
knowledge persistence while adding semantic search, contradiction resolution,
and knowledge graph relationships for free.

### Tier 2: Virtual Bash Tool for Serverless Runs

For cloud-hosted babysitter runs (Kradle), use `@supermemory/bash` as a virtual
filesystem tool. Same semantics as mount but works in Lambda/Workers/containers.

### Tier 3: Profile-Driven Context Injection

Use `client.profile()` at run start to inject relevant cross-run context into
the system prompt. Replaces manual `queryMemories()` calls with a single API
call that returns a curated, synthesized user profile.

### Tier 4: Hybrid -- SMFS for Agent, API for Orchestrator

The orchestrator (genty-platform) uses the REST API for structured memory
operations (add with metadata, search with filters). The agent (within the run)
uses SMFS for transparent file-based memory. Both write to the same container
via shared `containerTag`.

### Non-Opportunity: Replacing crossRunState.ts

`crossRunState.ts` is a simple key-value store for structured orchestration
state (last checkpoint, current phase, etc.). This is not a memory problem --
it is a state problem. Supermemory is not the right tool for this.
