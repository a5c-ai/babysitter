# Graph Alignment Tasks — Make the Repo Match the Graph

The Atlas graph is the source of truth. This document lists every task needed to make the repo's package names, structure, and capabilities match the 9 canonical muxes, 14 stack layers, and the agent-stack node kinds defined in the graph.

## Guiding Principle

When a package name doesn't match the graph → rename the package.
When a graph concept has no package → create one or assign ownership.
When a package implements something not in the graph → update the graph or remove the code.

---

## Phase 1: Package Renames

Make npm package names and directory names match graph adapter names.

### 1.1 extensions-adapter → extensions-adapter

| Aspect | Current | Target |
|--------|---------|--------|
| Graph adapter | `adapter:extensions-adapter` | — |
| npm name | `@a5c-ai/extensions-adapter` | `@a5c-ai/extensions-adapter` |
| Directory | `packages/extensions-adapter/` | `packages/extensions-adapter/` |
| Binary | (none) | (none) |

**Tasks:**
- [ ] Rename directory `packages/extensions-adapter/` → `packages/extensions-adapter/`
- [ ] Update `package.json` name to `@a5c-ai/extensions-adapter`
- [ ] Update all workspace references in root `package.json`
- [ ] Update all import paths across the monorepo
- [ ] Update CI workflows referencing the old name
- [ ] Publish `@a5c-ai/extensions-adapter` and deprecate `@a5c-ai/extensions-adapter` on npm
- [ ] Update graph YAML to reference new package name in SourceRef nodes

### 1.2 tasks-adapter → tasks-adapter

| Aspect | Current | Target |
|--------|---------|--------|
| Graph adapter | `adapter:tasks-adapter` | — |
| npm name | `@a5c-ai/tasks-adapter` | `@a5c-ai/tasks-adapter` |
| Directory | `packages/tasks-adapter/` | `packages/tasks-adapter/` |
| Binary | `tasks-adapter` | `tasks-adapter` |

**Tasks:**
- [ ] Rename directory `packages/tasks-adapter/` → `packages/tasks-adapter/`
- [ ] Update `package.json` name to `@a5c-ai/tasks-adapter`
- [ ] Update binary name in package.json bin field
- [ ] Update all workspace references
- [ ] Update all import paths across the monorepo
- [ ] Update CI workflows
- [ ] Publish `@a5c-ai/tasks-adapter` and deprecate `@a5c-ai/tasks-adapter`
- [ ] Update graph YAML SourceRef nodes

### 1.3 adapters decomposition — align sub-packages to graph muxes

The graph defines 3 muxes inside what's currently the adapters monolith:
- `agent-launch-adapter` (spawn/lifecycle)
- `agent-comm-adapter` (event streaming)
- `agent-config-adapter` (install/config/auth)

Currently these are split differently:
- `agent-comm-adapter` = agent-comm-adapter + types
- `adapters-cli` = agent-launch-adapter + agent-config-adapter + interaction
- `adapters-adapters` = part of agent-config-adapter

**Tasks:**
- [ ] Extract `agent-launch-adapter` from `adapters-cli/src/commands/launch.ts` into `packages/adapters/launch/`
  - npm: `@a5c-ai/launch-adapter`
  - Owns: InvocationOptions, SpawnArgs, process lifecycle, signal propagation, retry
- [ ] Extract `agent-config-adapter` from `adapters-cli/src/commands/install*.ts` + `adapters-adapters/` into `packages/adapters/config/`
  - npm: `@a5c-ai/config-adapter`
  - Owns: install, uninstall, update, detect, auth verification per adapter
- [ ] Rename `agent-comm-adapter` to `agent-comm-adapter`
  - npm: `@a5c-ai/comm-adapter`
  - Owns: event streaming, client, canonical event schema
- [ ] Keep `adapters-cli` as the composition CLI (`adapters`) that wires the 3 muxes together
- [ ] Keep `adapters-gateway`, `adapters-tui`, `adapters-ui`, `adapters-webui` as presentation packages (they consume muxes)

### 1.4 sdk → orchestration-adapter (or keep as-is)

The graph layer is "Orchestration" and the concept of "session-storage-adapter" lives inside the SDK.

**Decision needed:** The SDK is intentionally monolithic per v6.0. Splitting it would be a v7 concern. For v6.1, annotate the SDK with its graph layer ownership rather than renaming.

**Tasks:**
- [ ] Add `"atlas": { "layers": ["L13-orchestration"], "muxes": ["session-storage-adapter"] }` to sdk `package.json`
- [ ] Extract session-storage-adapter interface (not implementation) for documentation

### 1.5 agent-platform — align to graph

Graph has `AgentRuntimeImpl` and `AgentPlatformImpl`. agent-platform implements both.

**Tasks:**
- [ ] Add `"atlas": { "layers": ["L5-agent-runtime", "L6-agent-platform"], "nodeKinds": ["AgentRuntimeImpl"] }` to package.json
- [ ] Document the seam between agent-runtime (L5) and agent-platform (L6) concerns within the package

---

## Phase 2: Missing Packages

Create packages for graph muxes that have no implementation.

### 2.1 Create tools-adapter package

Graph: `adapter:tools-adapter` — CLI→MCP gateway, tool-level hooks, tool dispatch policies.

Currently scattered across:
- `babysitter-sdk/src/mcp/` (MCP server)
- `agent-platform/` (tool dispatch)
- `agent-comm-adapter/` (tool call events)

**Tasks:**
- [ ] Create `packages/tools-adapter/` with npm name `@a5c-ai/tools-adapter`
- [ ] Define `ToolDescriptor` interface (from graph node kind)
- [ ] Implement tool schema translation: MCP ↔ OpenAI function calling ↔ Anthropic tools ↔ Google functionDeclarations
- [ ] Implement `ToolDispatchPolicy` (from graph): routing rules for which tool server handles which tool
- [ ] Move MCP serving surface from babysitter-sdk to tools-adapter (or re-export)
- [ ] Wire hooks-adapter PreToolUse/PostToolUse through tools-adapter

### 2.2 Formalize agent-comm-adapter event schema

Graph defines this as a adapter but there's no formal schema.

**Tasks:**
- [ ] Define canonical event types in TypeScript: `AgentEvent`, `ToolCallEvent`, `MessageEvent`, `SessionEvent`, `ErrorEvent`
- [ ] Create JSON Schema for each event type
- [ ] Validate adapter output against schema in tests
- [ ] Publish schema as part of `@a5c-ai/comm-adapter` package

---

## Phase 3: Missing Functionality

Implement graph-defined capabilities that don't exist in code.

### 3.1 agent-launch-adapter: 9-state invocation lifecycle

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

### 3.2 transport-adapter: complete codec architecture

Graph: "Adding a new native impl is a Catalog edit."

**Tasks:**
- [ ] Define `TransportCodec` interface: decode request, encode response, encode stream chunk
- [ ] Implement per-protocol codecs: anthropic, openai-chat, openai-responses, google, bedrock
- [ ] Tool schema translation in each codec
- [ ] Cost/usage normalization: input_tokens ↔ prompt_tokens ↔ promptTokenCount
- [ ] Make codec selection data-driven from atlas graph `TransportDescriptor` records
- [ ] Streaming codec for SSE/NDJSON translation

### 3.3 agent-config-adapter: structured install results

**Tasks:**
- [ ] Return structured error from install failures (not just `installed: false`)
- [ ] Include npm stderr, exit code, and suggested fix in the result
- [ ] Add auth verification step per adapter (check API key validity)
- [ ] Add min-version check post-install

### 3.4 session-storage-adapter: backend abstraction

Graph defines this as a adapter (multiple backends). Current: filesystem only.

**Tasks:**
- [ ] Define `SessionStorageBackend` interface: read, write, list, delete
- [ ] Implement `FileSystemBackend` (current behavior)
- [ ] Define `CloudBackend` interface (S3/GCS/Azure Blob)
- [ ] Make backend selection configurable via environment or config

---

## Phase 4: Graph Updates

Update the atlas graph to reflect actual code structure.

### 4.1 Add adapters internal decomposition to graph

**Tasks:**
- [ ] Add `AgentCoreImpl` record for agent-comm-adapter / agent-comm-adapter
- [ ] Add `AgentRuntimeImpl` record for adapters-cli (as composition runtime)
- [ ] Link Presentation records to their implementing packages (adapters-tui, adapters-ui, adapters-webui)
- [ ] Add SourceRef nodes for each adapters sub-package

### 4.2 Move misplaced node kinds to correct clusters

**Tasks:**
- [ ] Move `ProviderTranslation` from extensions → compute cluster
- [ ] Move `TransportRuntime` from extensions → compute cluster
- [ ] Move `AdapterModel` from extensions → capabilities-and-models cluster
- [ ] Verify all node kinds are in their architectural layer's cluster

### 4.3 Add layer annotations to graph

**Tasks:**
- [ ] For each adapter record, add `implementedBy` edge to the package SourceRef
- [ ] For each AgentProduct, add `decomposedInto` edges to its sub-packages
- [ ] Add `layer` metadata to each package SourceRef node

---

## Phase 5: Package Metadata

Low-effort tasks that improve discoverability.

**Tasks:**
- [ ] Add `"atlas"` field to every package.json: `{ "layers": [...], "muxes": [...], "nodeKinds": [...] }`
- [ ] Add graph layer reference to every package README header
- [ ] Add "Canonical adapter" section to each adapter package README linking to the atlas record
- [ ] Update CLAUDE.md with graph-aligned package descriptions

---

## Execution Order

```
Phase 1.1 (extensions-adapter rename)
Phase 1.2 (tasks-adapter rename)
  ↓
Phase 2.1 (tools-adapter create) — can start in parallel with renames
Phase 2.2 (event schema) — can start in parallel
  ↓
Phase 1.3 (adapters decomposition) — biggest refactor, do after renames settle
  ↓
Phase 3.1 (9-state lifecycle) — depends on agent-launch-adapter extraction
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
| 1.1 extensions-adapter rename | 7 | Medium | Low (rename + deprecate) |
| 1.2 tasks-adapter rename | 8 | Medium | Low |
| 1.3 adapters decomposition | 5 | **Large** | Medium (API surface changes) |
| 1.4 SDK annotation | 2 | Small | None |
| 1.5 agent-platform annotation | 2 | Small | None |
| 2.1 tools-adapter package | 6 | **Large** | Medium (new abstraction) |
| 2.2 event schema | 4 | Medium | Low |
| 3.1 9-state lifecycle | 8 | **Large** | High (runtime behavior change) |
| 3.2 codec architecture | 6 | **Large** | Medium |
| 3.3 install results | 4 | Small | Low |
| 3.4 session backend | 4 | Medium | Low |
| 4.x graph updates | 6 | Small | None |
| 5.x metadata | 4 | Small | None |
| **Total** | **66** | | |
