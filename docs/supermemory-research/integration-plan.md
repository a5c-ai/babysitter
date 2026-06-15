# Supermemory Integration Plan

Concrete next steps for integrating Supermemory as a memory backend for the
babysitter/genty agentic stack.

## Phase 0: Prerequisites

### 0.1 Obtain API Access

- Sign up at https://console.supermemory.ai
- Create API key (prefixed `sm_`)
- Store in 1Password and configure as `SUPERMEMORY_API_KEY` env var

### 0.2 Install SMFS Binary

```bash
curl -fsSL https://smfs.ai/install | bash
smfs login  # one-time credential storage
```

### 0.3 Add SDK Dependencies

```bash
# In packages/genty/platform
npm install supermemory

# For serverless runtime (if needed)
npm install @supermemory/bash
```

## Phase 1: SMFS Mount Adapter (L5 Runtime Integration)

### Goal

Create a memory adapter that mounts a Supermemory container at run start and
unmounts at run end, giving agents transparent semantic memory via filesystem.

### 1.1 Create Mount Adapter

File: `packages/genty/platform/src/session/supermemoryMount.ts`

```typescript
interface SupermemoryMountConfig {
  apiKey: string;
  containerTag: string;
  memoryPaths: string[];  // e.g., ["/decisions/", "/findings/", "/patterns/"]
  syncInterval?: number;  // seconds, default 30
}

interface SupermemoryMount {
  mountPath: string;
  unmount(): Promise<void>;
}

export async function mountSupermemory(config: SupermemoryMountConfig): Promise<SupermemoryMount>;
export async function unmountSupermemory(mount: SupermemoryMount): Promise<void>;
```

Implementation spawns `smfs mount` as a child process with the configured
container tag and memory paths. Returns the mount path for use as the agent's
working directory or a symlinked subdirectory.

### 1.2 Create Virtual Bash Adapter

File: `packages/genty/platform/src/session/supermemoryBash.ts`

For serverless environments where SMFS mount is unavailable. Wraps
`@supermemory/bash` as a tool provider in the genty runtime.

```typescript
import { createBash } from "@supermemory/bash";

export async function createSupermemoryBashTool(config: {
  apiKey: string;
  containerTag: string;
}): Promise<AgentTool>;
```

### 1.3 Wire into Session Lifecycle

Modify the session lifecycle in genty-platform to:
1. Check for `SUPERMEMORY_API_KEY` env var
2. If present, mount SMFS container at session start
3. Configure memory paths based on process definition
4. Unmount and drain writes at session end

## Phase 2: Profile-Driven Context Injection

### Goal

Use Supermemory's profile API to inject cross-run context into the agent's
system prompt at run start.

### 2.1 Create Profile Fetcher

File: `packages/genty/platform/src/session/supermemoryProfile.ts`

```typescript
import { Supermemory } from "supermemory";

export async function fetchSupermemoryProfile(config: {
  apiKey: string;
  containerTag: string;
  query: string;
}): Promise<{ staticProfile: string; dynamicProfile: string; memories: string[] }>;
```

### 2.2 Inject into System Prompt

At run start, if Supermemory is configured:
1. Call `client.profile()` with the run's user/project scope
2. Append the static profile and relevant memories to the system prompt
3. This gives the agent immediate context about the user/project

### 2.3 Persist Run Outcomes

At run end:
1. Extract key decisions, findings, and outcomes from the run journal
2. Call `client.add()` for each significant item with metadata:
   - `containerTag`: user/project scope
   - `metadata.runId`: current run ID
   - `metadata.processId`: process definition ID
   - `metadata.outcome`: success/failure/partial

## Phase 3: Knowledge Fabric Atlas Node

### Goal

Register Supermemory as a knowledge fabric implementation in the atlas graph
and configure it as the default memory provider for supported deployments.

### 3.1 Atlas Graph (Done)

Three YAML nodes created in `packages/atlas/graph/agent-stack/supermemory/`:
- `supermemory-overview.yaml` -- product-level overview
- `supermemory-smfs.yaml` -- SMFS filesystem interface
- `supermemory-api.yaml` -- REST API and MCP server

### 3.2 Update Memory Service Fabrics

Add Supermemory entry to `packages/atlas/graph/agent-stack/knowledge-fabric-impls/memory-service-fabrics.yaml`
alongside existing Mem0 and Zep entries.

## Phase 4: MemoryBench Evaluation

### Goal

Run MemoryBench to quantitatively compare our current memory pipeline against
Supermemory.

### 4.1 Install MemoryBench

```bash
git clone https://github.com/supermemoryai/supermemory
cd supermemory/apps/memorybench
bun install
```

### 4.2 Create Custom Evaluation

Write a MemoryBench evaluation that tests:
- Cross-run memory recall (does the agent remember decisions from 5 runs ago?)
- Contradiction resolution (does the agent use the latest information?)
- User preference retrieval (does the agent respect known preferences?)
- Temporal reasoning (does the agent understand time-ordered events?)

### 4.3 Run Comparison

Compare three configurations:
1. Current genty memory (memoryExtraction + consolidation)
2. Supermemory via REST API
3. Supermemory via SMFS

Measure: accuracy, latency, token usage, cost per query.

## Phase 5: Production Rollout

### 5.1 Configuration

Add to process definition schema:
```yaml
memory:
  provider: supermemory | local | none
  containerTag: "${userId}-${projectId}"
  memoryPaths:
    - /decisions/
    - /findings/
    - /patterns/
  profileQuery: "relevant context for ${processDescription}"
```

### 5.2 Graceful Degradation

If `SUPERMEMORY_API_KEY` is not set or Supermemory is unreachable:
- Log a warning
- Continue with local memory pipeline (memoryExtraction + consolidation)
- Do NOT add a silent fallback -- surface the configuration issue clearly

### 5.3 Kradle Integration

For Kradle-hosted runs:
- Pass `SUPERMEMORY_API_KEY` as a secret
- Use `@supermemory/bash` virtual tool (no FUSE in containers without SYS_ADMIN)
- Or configure Docker with `--device /dev/fuse --cap-add SYS_ADMIN` for SMFS mount

## Timeline Estimate

| Phase | Scope                            | Effort    |
|-------|----------------------------------|-----------|
| 0     | Prerequisites                    | 1 hour    |
| 1     | SMFS mount + virtual bash adapter| 2-3 days  |
| 2     | Profile injection + persistence  | 1-2 days  |
| 3     | Atlas graph nodes                | Done      |
| 4     | MemoryBench evaluation           | 2-3 days  |
| 5     | Production rollout               | 3-5 days  |

Total: ~2-3 weeks for full integration.

## Open Questions

1. **Pricing model**: What is Supermemory's cost per query at our expected volume?
   Need to evaluate before committing to production use.

2. **Data residency**: Where does Supermemory store data? Relevant for enterprise
   customers with data sovereignty requirements.

3. **Self-hosting**: Can we run Supermemory's memory engine locally? The repo is
   MIT-licensed, but the cloud infrastructure (Cloudflare Workers, KV, etc.)
   may not be self-hostable.

4. **Container isolation**: How are containers isolated between users? Need to
   verify that one user's memories cannot leak to another.

5. **Rate limits**: What are the API rate limits? Babysitter runs can generate
   many memory operations in rapid succession.
