# Genty Stack Roadmap

> The genty stack is a superset of Pi's capabilities plus trust enforcement.
> Baseline: [pi.dev](https://pi.dev/) as of 2026-06-04
> **Status: All 18 gaps (11 Pi parity + 7 trust) CLOSED as of 2026-06-05**

---

## Stack Layer Reference

| Layer | Abstract Role | Our Implementation |
|-------|--------------|-------------------|
| L4 agent-core | Core runtime primitives | `@a5c-ai/genty-core` |
| L5 agent-runtime | Session/daemon/resource management | `@a5c-ai/genty-runtime` |
| L6 agent-platform | Orchestration, harness, governance | `@a5c-ai/genty-platform` |
| SDK | Public API surface | `@a5c-ai/babysitter-sdk` |
| Adapters | Harness integration | `@a5c-ai/adapters` family |

---

## 1. Modes of Operation

### 1.1 Interactive Mode — IMPLEMENTED

Full TUI via `@a5c-ai/genty-tui` (Ink). Harness orchestration via genty-platform. Real-time event rendering, breakpoint approval, parallel task visualization.

### 1.2 Print / JSON Mode — IMPLEMENTED ✅

`genty -p "query"` one-shot mode. JSON event stream via `--json`. CLI at `packages/genty/cli/src/cli/commands/print.ts`.

### 1.3 RPC Mode — IMPLEMENTED ✅

JSON-RPC over stdin/stdout. `genty rpc` command. Server at `packages/genty/runtime/src/rpc/server.ts`, CLI entry at `packages/genty/cli/src/cli/commands/rpc.ts`. Supports `session.create`, `session.send`, `model.switch`, `model.list`, `tool.list`, `extension.list`, `health`.

### 1.4 SDK Mode — IMPLEMENTED

`@a5c-ai/babysitter-sdk` provides `defineTask`, run management, sessions, hooks. Programmatic embedding works.

---

## 2. Context Engineering

### 2.1 AGENTS.md — IMPLEMENTED ✅

Hierarchical loading from `~/.genty/agent/AGENTS.md`, parent directories, and CWD. Also loads `GENTY.md`. Wired into orchestration session via `GentySessionContext`.

**Where:** `packages/genty/platform/src/context/instructions.ts`

### 2.2 SYSTEM.md — IMPLEMENTED ✅

Per-project `SYSTEM.md` with frontmatter `mode: replace|append`. Wired into orchestration and worker sessions.

**Where:** Same file, `parseSystemMd()` function.

### 2.3 Compaction — IMPLEMENTED

4-layer compression subsystem (29%–94% reduction). Auto-summarizes at context limit. Customizable per-layer.

### 2.4 Skills — IMPLEMENTED

Skills with `SKILL.md`, progressive disclosure, on-demand loading. Unified plugin system with marketplace.

### 2.5 Prompt Templates — IMPLEMENTED

Commands as markdown files. `/name` expansion. Frontmatter metadata.

### 2.6 Dynamic Context — IMPLEMENTED ✅

Provider-based pipeline with `collectInjections`/`applyInjections`. Extension-registered providers auto-wired. Supports message injection and system prompt append. Wired into orchestration loop.

**Where:** `packages/genty/platform/src/context/dynamic.ts`

---

## 3. Extensibility

### 3.1 Extension API — IMPLEMENTED ✅

Full TypeScript Extension API:
- `GentyExtension` interface with `activate(ctx)`/`deactivate()`
- `ExtensionContext`: registerTool, registerCommand, registerKeyBinding, onEvent, registerStatusBarItem, injectContext, getConfig, log
- `ExtensionRegistry` with namespace isolation (`ext:<name>:` prefix), permission policy enforcement, key binding conflict detection
- 10 permission types, event system with error isolation
- 14 unit tests

**Where:** `packages/genty/core/src/extensions/`

### 3.2 Plugins — IMPLEMENTED

Full plugin system: skills, MCP servers, hooks, commands. Marketplace CLI. Per-harness bundles.

### 3.3 Hooks — IMPLEMENTED

Lifecycle hooks with 13 per-harness adapters.

### 3.4 MCP — IMPLEMENTED

MCP server mode + client for plugin tool servers.

### 3.5 Installable Extension Packages — IMPLEMENTED ✅

- `installFromNpm(packageName, version?)` — npm install to `~/.genty/extensions/`
- `installFromGit(url, ref?)` — git clone + npm install
- `installFromLocal(path)` — symlink/reference
- `listInstalled()` — enumerate installed extensions
- Filesystem discovery scans `~/.genty/extensions/` on startup, auto-activates into registry

**Where:** `packages/genty/platform/src/extensions/installer.ts` + `discovery.ts`

---

## 4. Session Management

### 4.1 Tree-Structured History — IMPLEMENTED ✅

Tree data structure with parent pointers, branch IDs, forking from any node, navigation, bookmarks, serialize/deserialize.

**Where:** `packages/genty/runtime/src/session/tree.ts`

### 4.2 Session Export / Share — IMPLEMENTED ✅

HTML export (dark theme, styled per-role) and markdown export. CLI command `genty session-export <tree-path> [html|markdown] [output-path]`.

**Where:** `packages/genty/runtime/src/session/export.ts` + `packages/genty/cli/src/cli/commands/session/export.ts`

### 4.3 Session Resume — IMPLEMENTED

Event-sourced journal with deterministic replay. Works across sessions and harnesses.

---

## 5. Model & Provider Support

### 5.1 Multi-Provider — IMPLEMENTED

15+ harnesses with provider routing via transport-adapter proxy.

### 5.2 Mid-Session Model Switch — IMPLEMENTED ✅

`ModelSwitchState` with `switchModel`, `cycleFavorite`, `addFavorite`, `removeFavorite`. Wired into `GentySessionContext` — model switch state used for session creation.

**Where:** `packages/genty/platform/src/interaction/model-switch.ts`

---

## 6. Agent Interaction

### 6.1 Steering — IMPLEMENTED ✅

`SteeringQueue` with typed messages (`steer`/`followup`), drain between orchestration turns, prepended to prompt. Listener subscriptions.

**Where:** `packages/genty/platform/src/interaction/steering.ts`

### 6.2 Approval Modes — IMPLEMENTED

Interactive (breakpoints) and yolo (auto-approve). Profile-driven density.

---

## 7. Trust Enforcement — IMPLEMENTED ✅ (beyond Pi)

This is where the genty stack goes beyond Pi. Every action in the system produces cryptographically signed evidence.

### 7.1 Design Principles — IMPLEMENTED

All 4 principles are enforced through the signing primitives.

### 7.2 Tool Call Signing — IMPLEMENTED ✅

`signToolResult`/`verifyToolResult` with Ed25519 signatures. Covers tool name, input params, output, timestamp, upstream signatures.

**Where:** `packages/genty/core/src/trust/tool-signing.ts`

### 7.3 Model Response Signing — IMPLEMENTED ✅

`signModelResponse`/`verifyModelResponse`. Covers model ID, provider, input messages hash, output content, thinking content, token usage.

**Where:** `packages/genty/core/src/trust/model-signing.ts`

### 7.4 Agent Request Signing — IMPLEMENTED ✅

`signAgentRequest`/`verifyAgentRequest`. Covers agent ID, session ID, turn number, request type, content, delegation chain.

**Where:** `packages/genty/core/src/trust/agent-signing.ts`

### 7.5 Permission as Signed Evidence — IMPLEMENTED ✅

`signPermissionEvidence`/`verifyPermissionEvidence`/`isPermissionValid`. Scoped with expiry, conditions, approver identity.

**Where:** `packages/genty/core/src/trust/tool-signing.ts`

### 7.6 Prompt Signing — IMPLEMENTED ✅

`signPrompt`/`verifyPrompt`. Supports initial/followup/steering types. Author ID, instruction hashes, content hashing.

**Where:** `packages/genty/core/src/trust/agent-signing.ts`

### 7.7 Trust Chain Verification — IMPLEMENTED ✅

`verifyTrustChain` validates end-to-end signature chain with delegation link verification.

**Where:** `packages/genty/core/src/trust/chain.ts`

### 7.8 Key Persistence — IMPLEMENTED ✅

Ed25519 key pairs stored at `~/.genty/keys/`. Load-or-create semantics per agent ID.

**Where:** `packages/genty/platform/src/trust/key-store.ts`

### 7.9 Harness Integration — IMPLEMENTED ✅

All trust primitives wired into the production harness via `GentySessionContext`:
- `gentySessionContext.ts` — central factory
- `harness-signing.ts` — trust context bridge for prompt/tool/model signing
- `internalPhase.ts` — orchestration loop integration
- `workerSessionEnhancer.ts` — worker session integration

---

## Priority Order — Completion Status

All 11 items IMPLEMENTED as of 2026-06-05:

1. ~~**Trust Enforcement**~~ ✅ — 7 gaps, 30 tests
2. ~~**Extension API**~~ ✅ — 14 tests
3. ~~**Print/JSON mode**~~ ✅
4. ~~**RPC mode**~~ ✅
5. ~~**AGENTS.md / SYSTEM.md**~~ ✅
6. ~~**Tree-structured history**~~ ✅
7. ~~**Steering**~~ ✅
8. ~~**Mid-session model switch**~~ ✅
9. ~~**Session export/share**~~ ✅
10. ~~**Dynamic context extensions**~~ ✅
11. ~~**Installable extension packages**~~ ✅
