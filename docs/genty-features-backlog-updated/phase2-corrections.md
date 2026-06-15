# Phase 2 Codebase Audit -- Adversarial Corrections

Date: 2026-06-04

## Summary

The Phase 2 audit upgraded many gaps from Missing/Partial to IMPLEMENTED. This adversarial review verifies those claims by reading the actual source code, checking whether modules are integrated into real code paths, and comparing against the Phase 1 Target State descriptions.

**Verdict:** The code modules exist and are real, substantive implementations -- not stubs. However, several IMPLEMENTED claims overstate the integration level. The modules are written but not wired into the orchestration loop, or they satisfy only the data-structure/algorithm aspect of the target state while missing critical runtime integration.

---

## 1. CHALLENGE: IMPLEMENTED Claims (Originally Missing)

### GAP-REMOTE-007: Host Contract Layer -- DOWNGRADE to PARTIALLY_IMPLEMENTED

**Target State:** "HostContract interface with startRun, getStatus, postEffect, subscribe methods. Implementation over existing CLI commands. Exposed via MCP server and HTTP."

**What exists:** `packages/genty/platform/src/harness/hostContract.ts` defines `HostCapabilityManifest`, `resolveHostCapabilities()`, `validateHostContract()`, and `buildManifestFromDiscovery()`.

**Problem:** The file is a type-definition and validation utility. It defines what a host CAN do, but does NOT implement the `startRun`, `getStatus`, `postEffect`, `subscribe` methods described in the target state. More critically, **this module is not imported by any other file** -- zero consumers. The HostContract is not exposed via MCP server or HTTP. This is a schema-only implementation without runtime integration.

### GAP-OBS-NEW-001: Webhook and Alert System -- DOWNGRADE to PARTIALLY_IMPLEMENTED

**Target State:** "Webhook configuration per event type... Built-in integrations: Slack, PagerDuty, email. Custom webhook support. Alert throttling and deduplication."

**What exists:** `packages/genty/platform/src/observability/webhooks.ts` provides `WebhookRegistration`, `registerWebhook()`, `filterRegistrations()`, `evaluateAlertLevel()`, `buildWebhookEvent()`.

**Problem:** The module is pure functions for registry management and alert level computation. It has no HTTP delivery logic (no `fetch()` call to actually send webhooks). No built-in Slack/PagerDuty/email integrations. No alert throttling or deduplication. Only imported by index.ts barrel and a test file. The target state requires actual webhook delivery, which is absent.

### GAP-STATE-001: Long-Term Memory Extraction -- DOWNGRADE to PARTIALLY_IMPLEMENTED

**Target State:** "Memory extraction from completed runs into ~/.a5c/memory/. Memories indexed by project, topic, and recency. Extracted memories injected into new run prompts as context."

**What exists:** `packages/genty/platform/src/session/memoryExtraction.ts` provides `extractMemoriesFromSession()`, `persistMemories()`, `queryMemories()`, `pruneMemories()` with file-based storage.

**Problem:** Memory extraction and persistence are implemented. However, the critical part of the target state -- "Extracted memories injected into new run prompts as context" -- is NOT implemented. No prompt section renders long-term memories (grep for `longTermMemory` or `renderMemory` in the prompts module returns zero results). Memories are stored but never used during prompt assembly.

### GAP-HADAPT-004: Harness Fallback Chains -- Status: IMPLEMENTED (confirmed)

**Target State:** "Configurable fallback chains per task kind. If primary harness fails, retry with next harness in chain."

**What exists:** `packages/genty/platform/src/harness/fallbackChains.ts` provides `createFallbackChain()` and `resolveFallbackHarness()`. It IS imported by `createRun/utils.ts`, meaning it is wired into the run creation path.

**Verdict:** Correctly marked IMPLEMENTED. The module is clean, has proper deduplication and exhaustion detection, and is used in production code paths.

### GAP-AGENT-007: Delegation Policy Layer -- Status: IMPLEMENTED (confirmed)

**Target State:** "Delegation policies define capability subsets per role... Enforced via agentic tool filtering."

**What exists:** Full governance engine with `createPolicyEngine()`, policy categories (A/B/C/D tiers), sandbox policy, posture bridge, and permission events. The governance bridge is imported by `hookDecisionEffects.ts` in the orchestration path.

**Verdict:** Correctly marked IMPLEMENTED. The governance engine evaluates rules at effect dispatch time through the orchestration pipeline.

### GAP-AGENT-008: Harness Selection Policies -- Status: IMPLEMENTED (confirmed)

**Target State:** "Harness selection policies that consider task kind, capability requirements, model preference, cost constraints, and harness availability/health."

**What exists:** `selectionPolicies.ts` with 4 named policies, `capabilityRouter.ts` with scoring. Both are imported by `createRun/utils.ts`.

**Verdict:** Correctly marked IMPLEMENTED.

### GAP-BRK-001: Breakpoint Approval Chains -- Status: IMPLEMENTED (confirmed)

**Target State:** "Multi-level approval chains per breakpoint type. Configurable escalation timeouts."

**What exists:** Full `approvalChains.ts` with `ApprovalChainDefinition`, `evaluateApprovalChain()`, quorum logic, escalation paths. Imported by `createRun/orchestration/effects.ts`.

**Verdict:** Correctly marked IMPLEMENTED. Wired into orchestration.

### GAP-BRK-002: Breakpoint Delegation to External Systems -- Status: IMPLEMENTED (confirmed)

**Target State:** "Breakpoint routing to external systems via webhook. Async approval with configurable timeout."

**What exists:** `delegation.ts` with `delegateBreakpoint()`, `sendDelegationWebhook()` (actual `fetch()` calls), timeout handling, rule matching.

**Verdict:** Correctly marked IMPLEMENTED. This module actually sends HTTP requests and handles timeouts, unlike the webhook module.

### GAP-MCPC-003: Channel Permission Relay -- DOWNGRADE to PARTIALLY_IMPLEMENTED

**Target State:** "Breakpoint prompts routed to configured channels. Channel responses race against local interaction. First approval wins. Security: channel-based approval requires explicit opt-in per breakpoint tag/expert level."

**What exists:** `permissionRelay.ts` provides `ChannelPermissionRelay` class with `relay()`, `handleResponse()`, racing claim pattern, and security config with `terminalOnlyTags`.

**Problem:** The relay, claim racing, and security config are implemented. However, this module is only exported through an index barrel -- no evidence of it being wired into the actual breakpoint resolution flow (the orchestration loop's breakpoint handling). The racing pattern exists in the module but is not connected to the CLI's local interaction flow.

### GAP-JSON-002: JSON Effect Dispatch and Response Protocol -- Status: IMPLEMENTED (confirmed)

**Target State:** "JSON protocol for effect dispatch: request effect, receive pending notification, post result."

**What exists:** Full API in `packages/genty/platform/src/api/effects.ts` with `apiListEffects`, `apiShowEffect`, `apiCancelEffect`, `apiBatchCommitEffects`. All return `ApiResult` envelopes.

**Verdict:** Correctly marked IMPLEMENTED.

### GAP-JSON-003: JSON Breakpoint Interaction API -- Status: IMPLEMENTED (confirmed)

**Target State:** "JSON API for breakpoint interaction: list pending breakpoints, get breakpoint context, post approval/rejection with feedback."

**What exists:** Full API in `breakpoints.ts` with all listed operations plus auto-approval rule management. Fires `on-permission-denied` hook on rejection.

**Verdict:** Correctly marked IMPLEMENTED.

### GAP-REMOTE-001: Daemon Mode -- Status: IMPLEMENTED (confirmed)

**Target State:** "System service with start/stop/status lifecycle. File change watcher. Trigger-based activation."

**What exists:** Full daemon in `packages/genty/platform/src/daemon/`: `lifecycle.ts` (start/stop/status with PID management), `timerScheduler.ts` (cron), `webhookListener.ts`, `fileWatcher.ts`. Imported by CLI `daemon.ts` command.

**Verdict:** Correctly marked IMPLEMENTED. This is one of the most complete implementations.

### GAP-REMOTE-003: Remote Sessions (WebSocket) -- DOWNGRADE to PARTIALLY_IMPLEMENTED

**Target State:** "WebSocket transport for MCP server. Session multiplexing for concurrent remote users. Authentication and authorization. Run directory synchronization for remote execution."

**What exists:** `packages/genty/platform/src/mcp/transport/websocket.ts` provides `createWebSocketTransport` with `WebSocketConnectionTransport`, session management, Bearer token auth, ping/pong, rate limiting. Imported by CLI `mcpServe.ts`.

**Problem:** WebSocket transport, session multiplexing, and authentication are implemented. However, "Run directory synchronization for remote execution" is NOT implemented. The transport only carries MCP messages; it does not sync run directories to remote machines. This is a meaningful gap for the "remote execution" aspect of the target state.

### GAP-PROC-002: Process Nesting and Sub-Process Invocation -- Status: IMPLEMENTED (confirmed)

**Target State:** "ctx.subprocess() effect that invokes a child process. Child process inherits parent context. Results returned to parent as effect result."

**What exists:** `packages/babysitter-sdk/src/runtime/intrinsics/subprocess.ts` provides `runSubprocessIntrinsic` with `SubprocessInvocation` type including `processPath`, `exportName`, `processId`, `prompt`, `inputs`, `inputSchema`, `outputSchema`, `harness`, `model`, `maxIterations`, `shareSession`. Imported by `processContext.ts` -- wired into the context object.

**Verdict:** Correctly marked IMPLEMENTED. The ctx.subprocess() intrinsic is fully available.

### GAP-SESSION-004: Session-Level Cost Tracking -- Status: IMPLEMENTED (confirmed)

**Target State:** "Session-level cost aggregation across all runs. Configurable session budgets. Alerts at budget thresholds (50%, 80%, 100%). Auto-pause when budget exceeded."

**What exists:** `packages/genty/platform/src/session/cost.ts` with `SessionBudget`, cost summaries, threshold alerts. Imported by `orchestration/effects.ts` -- wired into the orchestration loop.

**Verdict:** Correctly marked IMPLEMENTED. Integration into the orchestration loop is confirmed.

### GAP-PERF-005: Cache-Aware Prompt Assembly -- Status: IMPLEMENTED (confirmed)

**Target State:** "Prompt sections tagged with volatility levels and sorted by stability. Cache-break detection."

**What exists:** `strata.ts` provides `PART_STRATA_MAP` with 30+ parts classified by stratum and volatility score. `composeByStrataWithMeta` returns per-stratum checksums for cache-break detection.

**Verdict:** Correctly marked IMPLEMENTED.

---

## 2. CHALLENGE: NOT_STARTED Claims

### GAP-RUN-001: Run Comparison and Diffing -- Confirmed NOT_STARTED
No `compareRuns`, `diffRuns`, or `run:diff` implementation found in packages.

### GAP-RUN-002: Run Archival and Restore -- Confirmed NOT_STARTED
No `archiveRun`, `restoreRun` implementation. Only cleanup exists.

### GAP-RUN-003: Run Forking and Branching -- Confirmed NOT_STARTED
No `forkRun` or journal fork-from-point capability.

### GAP-SEC-006: OAuth Integration -- Confirmed NOT_STARTED
No OAuth flow in the SDK or platform. OAuth code exists in `packages/adapters/tasks/src/auth/` but that is for GitHub OAuth for the adapters task runner, not for MCP server authentication.

### GAP-OBS-008: Agent Progress Summarization -- Confirmed NOT_STARTED
No progress summarization module found.

### GAP-TOOLS-007: JS/TS REPL Tool -- Confirmed NOT_STARTED
No `js_repl` or `node_repl` tool in agentic tools.

### GAP-TOOLS-012: LSP Integration -- Confirmed NOT_STARTED
No LSP client module in the codebase (only atlas graph documentation references).

### GAP-TOOLS-017: Git Worktree Isolation -- Confirmed NOT_STARTED
No worktree manager for parallel effects. Worktree references exist in adapters (hooks, gateway) for existing session workspace management, but not for parallel effect execution isolation.

### GAP-SESSION-003: Session Templates and Presets -- Confirmed NOT_STARTED
No `SessionTemplate` type or `.a5c/session-templates/` directory.

### GAP-BRK-003: Breakpoint Analytics and SLA Tracking -- Confirmed NOT_STARTED
No breakpoint analytics or SLA tracking implementation.

**Verdict:** All 10 NOT_STARTED claims are correctly assessed.

---

## 3. EVIDENCE QUALITY: PARTIALLY_IMPLEMENTED Verification

### GAP-PERF-002: Session Compaction -- Accurate
Evidence states compaction settings exist but no multiple strategies or auto-compact triggers. `piWrapper/compaction.ts` and `session/continuityState.ts` confirm the "what exists" description. The gap about missing auto-compact triggers is real.

### GAP-OBS-005: Context Introspection -- Accurate
Evidence states token analysis exists post-hoc but no real-time dashboard integration. `tokensStats.ts` and session cost tracking confirm this. No dashboard rendering exists.

### GAP-PROMPT-006: Instructions Loaded Hook -- Accurate
Evidence states hook exists in adapters layer but not in SDK. Confirmed: `InstructionsLoaded` is adapter-specific (Claude Code codecs), not a generalized SDK hook type.

### GAP-PAR-001: Concurrent Effect Execution -- Accurate
Evidence states `concurrentExecution.ts` and `asyncEffects.ts` exist but concurrent harness invocations not wired. Confirmed: the modules are utility/helper functions, not integrated into the orchestration loop for true concurrent dispatch.

### GAP-SUBOBS-002: Subagent Progress Tracking -- Accurate
Evidence states `backgroundTracker.ts` tracks state but no percentage/ETA. Confirmed: only status tracking (running/completed/error/timed_out), no progress bars or estimation.

### GAP-UX-001c: Permission and Breakpoint Approval UI -- Accurate
Evidence states `askUserQuestion.ts` provides prompts but no Ink-based component. Confirmed: readline-based interaction, no React/Ink rendering.

### GAP-ECO-003: Plugin Trust, Provenance, and Blocklist -- Accurate
Evidence states sandbox permissions exist but no blocklist or provenance tracking. Confirmed: `sandbox.ts` has permission types, but no `PluginBlocklist` or `PluginProvenance` types.

### GAP-ROUTE-002: Effect Priority and Scheduling -- Accurate
Evidence states parallel strategies exist but no priority queue. Confirmed: `parallelStrategies.ts` has strategy patterns (all-or-nothing, best-effort, etc.) but no priority-based scheduling.

### GAP-HADAPT-003: Cost-Based Routing Policies -- Accurate
Evidence states cost-optimized policy exists but automatic model downgrade not wired. Confirmed: `selectionPolicies.ts` has the policy, `session/cost.ts` has budgets, but they are not connected for automatic downgrade on budget approach.

### GAP-TOOLS-026: Structured User Interaction from Within Effects -- Accurate
Evidence states `AskUserQuestion` tool supports structured mode but no `ctx.ask()` intrinsic. Confirmed: interaction exists at the tool level in agentic tools, not as a process context intrinsic.

**Verdict:** All 10 PARTIALLY_IMPLEMENTED descriptions are accurate.

---

## 4. RENAME AWARENESS: Path References

All evidence paths in phase2-codebase-audit.json reference current paths (`packages/genty/platform/src/...` and `packages/babysitter-sdk/src/...`). No stale references to old paths like `packages/babysitter-sdk/src/harness/` where the code has moved to `packages/genty/platform/src/harness/`. One minor note: `packages/babysitter-sdk/src/harness/types.ts` is still referenced for `HarnessCapability` -- this appears to still be valid as the SDK has its own harness types that the platform imports.

---

## Status Change Summary

| Gap ID | Current Status | New Status | Reason |
|--------|---------------|------------|--------|
| GAP-REMOTE-007 | IMPLEMENTED | PARTIALLY_IMPLEMENTED | Type definitions only, zero consumers, no startRun/getStatus/postEffect methods |
| GAP-OBS-NEW-001 | IMPLEMENTED | PARTIALLY_IMPLEMENTED | Pure functions only, no HTTP delivery, no Slack/PagerDuty integrations |
| GAP-STATE-001 | IMPLEMENTED | PARTIALLY_IMPLEMENTED | Memory extraction works, but memories never injected into prompts |
| GAP-MCPC-003 | IMPLEMENTED | PARTIALLY_IMPLEMENTED | Racing pattern exists but not wired into actual breakpoint resolution flow |
| GAP-REMOTE-003 | IMPLEMENTED | PARTIALLY_IMPLEMENTED | WebSocket transport works, but no run directory synchronization for remote execution |

**Net impact:** 5 downgrades from IMPLEMENTED to PARTIALLY_IMPLEMENTED.
- Corrected count: 69 IMPLEMENTED, 49 PARTIALLY_IMPLEMENTED, 29 NOT_STARTED (147 total gaps).
- The original Phase 1 had 95 Missing, 52 Partial. The corrected audit now shows meaningful improvement but more honestly: 69 fully implemented (vs 74 claimed), with 5 items that have code modules but lack critical integration or runtime wiring.
