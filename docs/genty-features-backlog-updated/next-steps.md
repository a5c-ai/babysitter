# Next Steps

Concrete actions to begin executing the gap analysis roadmap.

> **Update 2026-06-05:** All 18 Pi parity + trust enforcement gaps are now CLOSED.
> The priority items below (from the original M0 quick wins) remain the next focus.

---

## First 5 PRs to Create

These are from the M0 quick wins, ordered by downstream impact. All have S remaining effort and no blockers.

### PR 1: GAP-SUBOBS-001 -- Stream CLI harness stdout/stderr in real-time

**Why first:** Unblocks 22 downstream gaps -- the highest-leverage single item in the entire backlog.

- **Files:** `packages/genty/platform/src/harness/invoker.ts`, `packages/genty/platform/src/harness/invoker/launch.ts`
- **Branch:** `feat/subobs-001-cli-harness-streaming`
- **Acceptance criteria:**
  - `invokeHarness()` pipes child process stdout/stderr in real-time, not after exit
  - JournalWatcher receives incremental output events during CLI harness execution
  - Pi adapter streaming continues to work (no regression)
  - Output events are timestamped and associated with the correct effect ID
- **Suggested title:** `feat(platform): stream CLI harness stdout/stderr in real-time`

### PR 2: GAP-PERF-001 -- Wire ephemeral cache_control across all prompt adapters

**Why second:** Critical priority, directly reduces API costs and latency for every orchestrated run.

- **Files:** `packages/sdk/src/prompts/strata.ts`, `packages/genty/platform/src/harness/piWrapper.ts`, `packages/adapters/codecs/src/claude-code/`
- **Branch:** `feat/perf-001-prompt-cache-control`
- **Acceptance criteria:**
  - Stable strata sections include `cache_control: { type: 'ephemeral' }` in API calls
  - All harness adapters apply cache hints based on strata volatility scores
  - Cache-break detection via checksums triggers cache invalidation appropriately
  - Token cost reduction is measurable in test scenarios
- **Suggested title:** `feat(sdk): wire ephemeral cache_control across all prompt adapters`

### PR 3: GAP-STATE-001 -- Inject long-term memories into new run prompts

**Why third:** Closes the loop on memory extraction (80% done) and unblocks memory consolidation.

- **Files:** `packages/sdk/src/prompts/parts/` (new `longTermMemory.ts`), `packages/sdk/src/prompts/strata.ts` (add to `PART_STRATA_MAP`)
- **Branch:** `feat/state-001-memory-prompt-injection`
- **Acceptance criteria:**
  - New `longTermMemory` prompt part renders extracted memories from `memoryExtraction.ts`
  - Memories are filtered by relevance (project, category) and recency
  - Section mapped in `PART_STRATA_MAP` as runtime stratum
  - Memories appear in assembled prompts for new runs
- **Suggested title:** `feat(sdk): inject long-term memories into new run prompts`

### PR 4: GAP-HADAPT-003 -- Auto-downgrade model when approaching session budget

**Why fourth:** Prevents budget overruns during autonomous runs. Builds on solid existing cost infrastructure.

- **Files:** `packages/genty/platform/src/harness/selectionPolicies.ts`, `packages/genty/platform/src/session/cost.ts`, `packages/genty/platform/src/harness/modelSelection.ts`
- **Branch:** `feat/hadapt-003-budget-auto-downgrade`
- **Acceptance criteria:**
  - When session cost exceeds 80% of budget, model selection automatically downgrades to cheaper model
  - Downgrade respects task requirements (does not downgrade below minimum capability)
  - Budget alert thresholds trigger downgrade evaluation
  - Operator can override auto-downgrade via config tool
- **Suggested title:** `feat(platform): auto-downgrade model when approaching session budget`

### PR 5: GAP-MCPC-003 -- Wire channel permission relay into breakpoint resolution

**Why fifth:** Enables breakpoint approval via Slack, Discord, email -- critical for remote/autonomous workflows. The relay implementation already exists; this is pure integration wiring.

- **Files:** `packages/genty/platform/src/mcp/channels/permissionRelay.ts`, breakpoint resolution in `packages/genty/platform/src/breakpoints/`
- **Branch:** `feat/mcpc-003-channel-breakpoint-approval`
- **Acceptance criteria:**
  - Breakpoint resolution checks for channel-based approvals via `ChannelPermissionRelay`
  - Racing claim pattern works: first response (local or channel) wins
  - Security config (`terminalOnlyTags`) is respected
  - Channel approvals are logged to `governance-decisions.jsonl`
- **Suggested title:** `feat(platform): wire channel permission relay into breakpoint resolution`

---

## Respec Decision Required

### GAP-UX-001: Rendering Foundation

**Decision needed before Track 6 (10 gaps, M4 milestone) can start.**

The original spec assumed Ink-based components embedded in `packages/sdk/`. The architecture has evolved:
- `packages/tula/ui/` is being extracted as a component library
- `packages/observer-dashboard/` exists as a separate package

**Options:**
1. **tula-ui** as the rendering foundation (React components, reusable across web and Ink)
2. **observer-dashboard** as the primary rendering target (web-only)
3. **Hybrid:** tula-ui for components, observer-dashboard for full dashboard

**Action:** Schedule a focused respec session. Document the decision. Update GAP-UX-001 and all 6 dependent NEEDS_RESPEC gaps (UX-001a, UX-001b, UX-001d, UX-001e, UX-001f, SUBOBS-005).

**If deferred:** Track 6 remains blocked. 12 gaps in M4 cannot start.

---

## Ongoing Gap Triage Process

As features land, gaps should be triaged to keep this analysis current.

### When a PR merges that addresses a gap:

1. Update `phase3-reclassified.json` -- change `finalStatus` to `CLOSED`, set `reclassifiedPriority` and `remainingEffort` to null, add `statusChangeReason`
2. Update `gap-status-matrix.md` -- move the gap to the CLOSED section
3. Check if any downstream gaps are now unblocked (check `blockers` in `phase3-reclassified.json` and dependencies in `phase4-dependency-graph.json`)
4. If a downstream gap is unblocked and ready, move it to the current milestone

### When a gap's scope changes:

1. If the spec's assumptions are outdated, change status to `NEEDS_RESPEC`
2. If new requirements emerge, add a new gap ID (use the next available number in the relevant category prefix)
3. Update `phase5-effort-recalibration.json` with revised effort estimate

### Monthly review cadence:

1. Run a quick audit of IN_PROGRESS gaps -- have any been completed without being closed?
2. Check OPEN gaps -- have any been started?
3. Review the critical path -- has GAP-SUBOBS-001 been resolved? If so, update the critical path analysis
4. Check if ECO-002 (CC Marketplace Protocol) is still relevant or if the CC marketplace has changed

---

## How to Update This Analysis

### Regenerate the gap-status-matrix.md

After editing `phase3-reclassified.json` or `phase5-effort-recalibration.json`, regenerate the matrix:

```bash
# From repo root, run the matrix generator
node -e "
const fs = require('fs');
const phase3 = JSON.parse(fs.readFileSync('docs/genty-features-backlog-updated/phase3-reclassified.json', 'utf8'));
const phase5 = JSON.parse(fs.readFileSync('docs/genty-features-backlog-updated/phase5-effort-recalibration.json', 'utf8'));
const phase6tasks = JSON.parse(fs.readFileSync('docs/genty-features-backlog-updated/phase6-task-definitions.json', 'utf8'));
// ... (see scripts in this analysis for full generator)
"
```

### Add a new gap

1. Add the gap to `phase3-reclassified.json` with all fields
2. Add effort recalibration to `phase5-effort-recalibration.json`
3. Add task definition to `phase6-task-definitions.json`
4. Add dependency edges to `phase4-dependency-graph.json`
5. Regenerate `gap-status-matrix.md`

### Close a milestone

When all gaps in a milestone are CLOSED or moved:
1. Update `phase6-roadmap.md` with completion date and actual effort
2. Update `phase6-milestone-summary.md` with retrospective notes
3. Verify next milestone's dependencies are all satisfied
