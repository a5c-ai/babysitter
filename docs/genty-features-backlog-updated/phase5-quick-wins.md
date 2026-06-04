# Phase 5: Quick Wins

Quick wins are gaps with **High or Critical priority**, **S remaining effort**, and **no unresolved blockers**. These can start immediately and deliver disproportionate value.

---

## Tier 1: Critical Priority Quick Wins

### GAP-PERF-001 -- Prompt Caching (Ephemeral)
- **Priority:** Critical | **Remaining:** S | **Risk:** Low
- **What remains:** Wire cache_control API integration uniformly across adapters. Strata-aware prompt assembly with stability tags and checksums already exists.
- **Files:** `packages/sdk/src/prompts/strata.ts`, adapter-specific harness wrappers
- **Impact:** Directly reduces API costs and latency for every orchestrated run. Foundation for context introspection (GAP-OBS-005).
- **Suggested PR:** "feat(sdk): wire ephemeral cache_control across all prompt adapters"

### GAP-SUBOBS-001 -- Streaming Output Capture from Invoked Harnesses
- **Priority:** Critical | **Remaining:** S | **Risk:** Medium
- **What remains:** Pipe stdout/stderr from CLI harness child processes in real-time. Pi adapter already streams via subscribe().
- **Files:** `packages/genty/platform/src/harness/invoker.ts`, `packages/genty/platform/src/harness/invoker/launch.ts`
- **Impact:** **Unblocks 22 downstream gaps** -- the single most impactful foundation gap in the entire backlog. Every subagent observability, parallelization, and streaming UI feature chains through this.
- **Suggested PR:** "feat(platform): stream CLI harness stdout/stderr in real-time"

---

## Tier 2: High Priority Quick Wins

### GAP-HADAPT-003 -- Cost-Based Routing Policies
- **Priority:** High | **Remaining:** S | **Risk:** Low
- **What remains:** Wire auto-downgrade when nearing budget limits. Cost-optimized policy, pricing tables, and session budget with alerts already exist.
- **Files:** `packages/genty/platform/src/harness/selectionPolicies.ts`, `packages/genty/platform/src/session/cost.ts`
- **Impact:** Prevents budget overruns during autonomous runs. Builds on solid cost infrastructure.
- **Suggested PR:** "feat(platform): auto-downgrade model when approaching session budget limits"

### GAP-MCPC-003 -- Channel Permission Relay (Breakpoint Approval via Channels)
- **Priority:** High | **Remaining:** S | **Risk:** Low
- **What remains:** Wire existing ChannelPermissionRelay into the breakpoint resolution flow in the orchestration loop. The relay with racing claim pattern is already implemented.
- **Files:** `packages/genty/platform/src/mcp/channels/permissionRelay.ts`, breakpoint resolution in orchestration loop
- **Impact:** Enables breakpoint approval via Slack, Discord, email -- key for remote/autonomous workflows.
- **Suggested PR:** "feat(platform): wire channel permission relay into breakpoint resolution flow"

### GAP-OBS-NEW-001 -- Webhook and Alert System
- **Priority:** High | **Remaining:** S | **Risk:** Low
- **What remains:** Add HTTP delivery logic (fetch()) and throttling/deduplication. Webhook registration types and registry management already exist.
- **Files:** `packages/genty/platform/src/observability/webhooks.ts`
- **Impact:** Enables real-time notifications for run events to external systems.
- **Suggested PR:** "feat(platform): implement HTTP webhook delivery with throttling"

### GAP-PROMPT-010 -- Safety and Reversibility Prompt Framework
- **Priority:** High | **Remaining:** S | **Risk:** Low
- **What remains:** Dedicated reversibility assessment framework and blast radius reasoning section. criticalRules.ts and nonNegotiables.ts already provide safety content.
- **Files:** `packages/sdk/src/prompts/parts/` (new safetyGuidelines.ts), `packages/sdk/src/prompts/templates/` (new template)
- **Impact:** Improves agent safety for destructive operations. Pure prompt template work.
- **Suggested PR:** "feat(sdk): add reversibility assessment and blast radius prompt framework"

### GAP-STATE-001 -- Long-Term Memory Extraction
- **Priority:** High | **Remaining:** S | **Risk:** Low
- **What remains:** Add a prompt section that renders long-term memories into new run prompts. memoryExtraction.ts already provides extraction, persistence, querying, and pruning.
- **Files:** `packages/sdk/src/prompts/parts/` (new longTermMemory.ts), `packages/sdk/src/prompts/strata.ts` (add to PART_STRATA_MAP)
- **Impact:** Closes the loop on memory -- extracted memories will finally be consumed. Unblocks memory consolidation (STATE-002).
- **Suggested PR:** "feat(sdk): inject long-term memories into new run prompts"

### GAP-ECO-003 -- Plugin Trust, Provenance, and Blocklist
- **Priority:** High | **Remaining:** S | **Risk:** Low
- **What remains:** Blocklist data store and provenance metadata at install time. Plugin sandbox and governance trust-level rules already exist.
- **Files:** `packages/genty/platform/src/plugins/`, `packages/sdk/src/blueprints/registry.ts`
- **Impact:** Strengthens plugin security. No upstream blockers (SEC-001 is CLOSED).
- **Suggested PR:** "feat(platform): add plugin blocklist and provenance tracking"

### GAP-SEC-002 -- Trust Classes for Plugins
- **Priority:** High | **Remaining:** S | **Risk:** Low
- **What remains:** TrustLevel as first-class registry field with hook dispatch gating. Plugin sandbox with permission tracking already exists.
- **Files:** `packages/genty/platform/src/plugins/`, `packages/sdk/src/blueprints/registry.ts`
- **Impact:** Enables differentiated plugin permissions based on trust level.
- **Suggested PR:** "feat(platform): add TrustLevel field to plugin registry with hook gating"

### GAP-JSON-004 -- JSON Session Management API
- **Priority:** High | **Remaining:** S | **Risk:** Low
- **What remains:** Unified REST-style session CRUD API following existing api/ patterns. MCP tools already expose session operations.
- **Files:** `packages/genty/platform/src/api/` (new sessions.ts)
- **Impact:** Completes the programmatic API surface for session management.
- **Suggested PR:** "feat(platform): add REST-style JSON session management API"

### GAP-AGENT-001 -- Sub-Harness Invocation with Isolation
- **Priority:** High | **Remaining:** S | **Risk:** Medium
- **What remains:** Wire context isolation and model override per invocation into existing invoker. Subprocess intrinsic and Pi streaming exist.
- **Files:** `packages/genty/platform/src/harness/invoker.ts`, `packages/sdk/src/runtime/intrinsics/subprocess.ts`
- **Impact:** Unblocks 5 direct dependents including cross-run communication and state sharing.
- **Suggested PR:** "feat(platform): add context isolation and model override to sub-harness invocation"

### GAP-AGENT-006 -- Cross-Run State Sharing
- **Priority:** High | **Remaining:** S | **Risk:** Low
- **What remains:** Ensure automatic persistence across all runs and seamless state injection. SessionContext and SessionHistory already provide cross-run shared knowledge.
- **Files:** `packages/genty/platform/src/session/context.ts`, `packages/genty/platform/src/session/history.ts`
- **Impact:** Foundation for long-term memory extraction and multi-run workflows.
- **Suggested PR:** "feat(platform): auto-persist cross-run state for all run types"

---

## Execution Summary

| Tier | Count | Combined Effort | Downstream Unblocked |
|------|-------|-----------------|---------------------|
| Critical quick wins | 2 | 2x S | ~24 gaps |
| High quick wins | 9 | 9x S | ~30 gaps |
| **Total** | **11** | **~11 S = 2-3 M equivalent** | **Massive** |

### Recommended Execution Order

1. **GAP-SUBOBS-001** (22 downstream) -- highest leverage
2. **GAP-PERF-001** (Critical, cost reduction)
3. **GAP-STATE-001** + **GAP-AGENT-006** (memory pipeline)
4. **GAP-AGENT-001** (agent delegation chain)
5. **GAP-HADAPT-003** + **GAP-MCPC-003** + **GAP-OBS-NEW-001** (operational maturity)
6. **GAP-PROMPT-010** + **GAP-ECO-003** + **GAP-SEC-002** (safety and trust)
7. **GAP-JSON-004** (API completeness)

These 11 quick wins represent approximately 2-3 M-equivalent sprints of work but unblock the majority of the downstream backlog.
