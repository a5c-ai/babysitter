# Graph Alignment Tasks — Make the Repo Match the Graph

The Atlas graph is the source of truth. This document lists every task needed to make the repo's package names, structure, and capabilities match the 9 canonical muxes, 14 stack layers, and the agent-stack node kinds defined in the graph.

## Guiding Principle

When a package name doesn't match the graph → rename the package.
When a graph concept has no package → create one or assign ownership.
When a package implements something not in the graph → update the graph or remove the code.

---

## Phase 1: Package Renames

Make npm package names and directory names match graph mux names.

### 1.1 extension-mux → extension-mux

| Aspect | Current | Target |
|--------|---------|--------|
| Graph mux | `mux:extension-mux` | — |
| npm name | `@a5c-ai/agent-mux-extensions` | `@a5c-ai/agent-mux-extensions` |
| Directory | `packages/extension-mux/` | `packages/extension-mux/` |
| Binary | (none) | (none) |

**Tasks:**
- [ ] Rename directory `packages/extension-mux/` → `packages/extension-mux/`
- [ ] Update `package.json` name to `@a5c-ai/agent-mux-extensions`
- [ ] Update all workspace references in root `package.json`
- [ ] Update all import paths across the monorepo
- [ ] Update CI workflows referencing the old name
- [ ] Publish `@a5c-ai/agent-mux-extensions` and deprecate `@a5c-ai/agent-mux-extensions` on npm
- [ ] Update graph YAML to reference new package name in SourceRef nodes

### 1.2 tasks-mux → tasks-mux

| Aspect | Current | Target |
|--------|---------|--------|
| Graph mux | `mux:tasks-mux` | — |
| npm name | `@a5c-ai/agent-mux-tasks` | `@a5c-ai/agent-mux-tasks` |
| Directory | `packages/tasks-mux/` | `packages/tasks-mux/` |
| Binary | `tasks-mux` | `tasks-mux` |

**Tasks:**
- [ ] Rename directory `packages/tasks-mux/` → `packages/tasks-mux/`
- [ ] Update `package.json` name to `@a5c-ai/agent-mux-tasks`
- [ ] Update binary name in package.json bin field
- [ ] Update all workspace references
- [ ] Update all import paths across the monorepo
- [ ] Update CI workflows
- [ ] Publish `@a5c-ai/agent-mux-tasks` and deprecate `@a5c-ai/agent-mux-tasks`
- [ ] Update graph YAML SourceRef nodes

### 1.3 agent-mux decomposition — align sub-packages to graph muxes

The graph defines 3 muxes inside what's currently the agent-mux monolith:
- `agent-launch-mux` (spawn/lifecycle)
- `agent-comm-mux` (event streaming)
- `agent-config-mux` (install/config/auth)

Currently these are split differently:
- `agent-comm-mux` = agent-comm-mux + types
- `agent-mux-cli` = agent-launch-mux + agent-config-mux + interaction
- `agent-mux-adapters` = part of agent-config-mux

**Tasks:**
- [ ] Extract `agent-launch-mux` from `agent-mux-cli/src/commands/launch.ts` into `packages/agent-mux/launch/`
  - npm: `@a5c-ai/agent-mux-launch`
  - Owns: InvocationOptions, SpawnArgs, process lifecycle, signal propagation, retry
- [ ] Extract `agent-config-mux` from `agent-mux-cli/src/commands/install*.ts` + `agent-mux-adapters/` into `packages/agent-mux/config/`
  - npm: `@a5c-ai/agent-mux-config`
  - Owns: install, uninstall, update, detect, auth verification per adapter
- [ ] Rename `agent-comm-mux` to `agent-comm-mux`
  - npm: `@a5c-ai/agent-mux-comm`
  - Owns: event streaming, client, canonical event schema
- [ ] Keep `agent-mux-cli` as the composition CLI (`amux`) that wires the 3 muxes together
- [ ] Keep `agent-mux-gateway`, `agent-mux-tui`, `agent-mux-ui`, `agent-mux-webui` as presentation packages (they consume muxes)

### 1.4 sdk → orchestration-mux (or keep as-is)

The graph layer is "Orchestration" and the concept of "session-storage-mux" lives inside the SDK.

**Decision needed:** The SDK is intentionally monolithic per v6.0. Splitting it would be a v7 concern. For v6.1, annotate the SDK with its graph layer ownership rather than renaming.

**Tasks:**
- [ ] Add `"atlas": { "layers": ["L13-orchestration"], "muxes": ["session-storage-mux"] }` to sdk `package.json`
- [ ] Extract session-storage-mux interface (not implementation) for documentation

### 1.5 agent-platform — align to graph

Graph has `AgentRuntimeImpl` and `AgentPlatformImpl`. agent-platform implements both.

**Tasks:**
- [ ] Add `"atlas": { "layers": ["L5-agent-runtime", "L6-agent-platform"], "nodeKinds": ["AgentRuntimeImpl"] }` to package.json
- [ ] Document the seam between agent-runtime (L5) and agent-platform (L6) concerns within the package

---

## Phase 2: Missing Packages

Create packages for graph muxes that have no implementation.

### 2.1 Create tool-mux package

Graph: `mux:tool-mux` — CLI→MCP gateway, tool-level hooks, tool dispatch policies.

Currently scattered across:
- `babysitter-sdk/src/mcp/` (MCP server)
- `agent-platform/` (tool dispatch)
- `agent-comm-mux/` (tool call events)

**Tasks:**
- [ ] Create `packages/tool-mux/` with npm name `@a5c-ai/agent-mux-tools`
- [ ] Define `ToolDescriptor` interface (from graph node kind)
- [ ] Implement tool schema translation: MCP ↔ OpenAI function calling ↔ Anthropic tools ↔ Google functionDeclarations
- [ ] Implement `ToolDispatchPolicy` (from graph): routing rules for which tool server handles which tool
- [ ] Move MCP serving surface from babysitter-sdk to tool-mux (or re-export)
- [ ] Wire hooks-mux PreToolUse/PostToolUse through tool-mux

### 2.2 Formalize agent-comm-mux event schema

Graph defines this as a mux but there's no formal schema.

**Tasks:**
- [ ] Define canonical event types in TypeScript: `AgentEvent`, `ToolCallEvent`, `MessageEvent`, `SessionEvent`, `ErrorEvent`
- [ ] Create JSON Schema for each event type
- [ ] Validate adapter output against schema in tests
- [ ] Publish schema as part of `@a5c-ai/agent-mux-comm` package

---

## Phase 3: Missing Functionality

Implement graph-defined capabilities that don't exist in code.

### 3.1 agent-launch-mux: 9-state invocation lifecycle

Graph defines: spawned → running → paused → interrupted → aborted | timed-out | completed | crashed | killed.

Current: spawned → running → completed | crashed.

**Tasks:**
- [ ] Define `InvocationState` enum with all 9 states
- [ ] Implement state machine with valid transitions
- [ ] Add `pause()` — send SIGSTOP or equivalent
- [ ] Add `resume()` — send SIGCONT
- [ ] Add `interrupt()` — graceful stop with timeout
- [ ] Add lifecycle hooks: `onSpawnError`, `onTimeout`, `onProcessExit`, `shouldRetry`
- [ ] Implement retry policy (exponential backoff, max retries)
- [ ] Add min-version enforcement (semver gate against AgentVersion)

### 3.2 transport-mux: complete codec architecture

Graph: "Adding a new native impl is a Catalog edit."

**Tasks:**
- [ ] Define `TransportCodec` interface: decode request, encode response, encode stream chunk
- [ ] Implement per-protocol codecs: anthropic, openai-chat, openai-responses, google, bedrock
- [ ] Tool schema translation in each codec
- [ ] Cost/usage normalization: input_tokens ↔ prompt_tokens ↔ promptTokenCount
- [ ] Make codec selection data-driven from atlas graph `TransportDescriptor` records
- [ ] Streaming codec for SSE/NDJSON translation

### 3.3 agent-config-mux: structured install results

**Tasks:**
- [ ] Return structured error from install failures (not just `installed: false`)
- [ ] Include npm stderr, exit code, and suggested fix in the result
- [ ] Add auth verification step per adapter (check API key validity)
- [ ] Add min-version check post-install

### 3.4 session-storage-mux: backend abstraction

Graph defines this as a mux (multiple backends). Current: filesystem only.

**Tasks:**
- [ ] Define `SessionStorageBackend` interface: read, write, list, delete
- [ ] Implement `FileSystemBackend` (current behavior)
- [ ] Define `CloudBackend` interface (S3/GCS/Azure Blob)
- [ ] Make backend selection configurable via environment or config

---

## Phase 4: Graph Updates

Update the atlas graph to reflect actual code structure.

### 4.1 Add agent-mux internal decomposition to graph

**Tasks:**
- [ ] Add `AgentCoreImpl` record for agent-comm-mux / agent-comm-mux
- [ ] Add `AgentRuntimeImpl` record for agent-mux-cli (as composition runtime)
- [ ] Link Presentation records to their implementing packages (agent-mux-tui, agent-mux-ui, agent-mux-webui)
- [ ] Add SourceRef nodes for each agent-mux sub-package

### 4.2 Move misplaced node kinds to correct clusters

**Tasks:**
- [ ] Move `ProviderTranslation` from extensions → compute cluster
- [ ] Move `TransportRuntime` from extensions → compute cluster
- [ ] Move `AdapterModel` from extensions → capabilities-and-models cluster
- [ ] Verify all node kinds are in their architectural layer's cluster

### 4.3 Add layer annotations to graph

**Tasks:**
- [ ] For each mux record, add `implementedBy` edge to the package SourceRef
- [ ] For each AgentProduct, add `decomposedInto` edges to its sub-packages
- [ ] Add `layer` metadata to each package SourceRef node

---

## Phase 5: Package Metadata

Low-effort tasks that improve discoverability.

**Tasks:**
- [ ] Add `"atlas"` field to every package.json: `{ "layers": [...], "muxes": [...], "nodeKinds": [...] }`
- [ ] Add graph layer reference to every package README header
- [ ] Add "Canonical mux" section to each mux package README linking to the atlas record
- [ ] Update CLAUDE.md with graph-aligned package descriptions

---

## Execution Order

```
Phase 1.1 (extension-mux rename)
Phase 1.2 (tasks-mux rename)
  ↓
Phase 2.1 (tool-mux create) — can start in parallel with renames
Phase 2.2 (event schema) — can start in parallel
  ↓
Phase 1.3 (agent-mux decomposition) — biggest refactor, do after renames settle
  ↓
Phase 3.1 (9-state lifecycle) — depends on agent-launch-mux extraction
Phase 3.2 (codec architecture) — independent
Phase 3.3 (install results) — independent
Phase 3.4 (session backend) — independent
  ↓
Phase 4 (graph updates) — do alongside each code change
Phase 5 (metadata) — do last, sweep pass
```

## Estimated Effort

| Phase | Tasks | Effort | Risk |
|-------|-------|--------|------|
| 1.1 extension-mux rename | 7 | Medium | Low (rename + deprecate) |
| 1.2 tasks-mux rename | 8 | Medium | Low |
| 1.3 agent-mux decomposition | 5 | **Large** | Medium (API surface changes) |
| 1.4 SDK annotation | 2 | Small | None |
| 1.5 agent-platform annotation | 2 | Small | None |
| 2.1 tool-mux package | 6 | **Large** | Medium (new abstraction) |
| 2.2 event schema | 4 | Medium | Low |
| 3.1 9-state lifecycle | 8 | **Large** | High (runtime behavior change) |
| 3.2 codec architecture | 6 | **Large** | Medium |
| 3.3 install results | 4 | Small | Low |
| 3.4 session backend | 4 | Medium | Low |
| 4.x graph updates | 6 | Small | None |
| 5.x metadata | 4 | Small | None |
| **Total** | **66** | | |
