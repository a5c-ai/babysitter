# Retrospective: joe-habu/superbabysitter -- process-only (subagent-tdd-loop + gates)

Date: 2026-04-12
Source commit: 531a39c13ea7c41b5439afd21fb82701dc69ac80
Process: `process/subagent-tdd-loop.js` (+ `design-gate.js`, `planning-gate.js`, `verification-gate.js`, `debugging-phase.js`, `finishing-gate.js`)
Run: **process-only** (no runs committed to the repo; `.a5c/runs/` is not tracked on `main`)
Outcome: process-only review (no runtime evidence)

## Context

`superbabysitter` is a 6-phase quality-gated development workflow built on top of the babysitter SDK (declared `^0.0.168`) with a custom `babysitter-state` MCP server for cross-phase persistence. The flagship process is `subagent-tdd-loop.js`: it orchestrates per-task TDD implementation with independent **spec-compliance** and **quality** reviewer subagents that explicitly distrust the implementer's self-report. Each phase is guarded by a babysitter breakpoint. The code is well-factored into six process files plus three helper modules (`mcp-state-helpers`, `parallel-task-helpers`, `build-manifest-helpers`), each with a matching `.test.js`.

## Timeline

No journal to replay. For the process shape, reading `subagent-tdd-loop.js#subagentTddLoop` top-to-bottom:

- Decide sequential vs parallel via `hasParallelCapableTasks(tasks)` (line 419)
- Sequential path: for each task, `executeSingleTask` (line 426) → implement → up-to-3 spec-review/fix attempts → up-to-3 quality-review/fix attempts → append to `buildManifest`
- Parallel path: validate deps (line 437) → if invalid, breakpoint + fall back to sequential (lines 439-465); otherwise `buildParallelBatches` (line 467) → per-batch execute via `ctx.parallel.map` (line 501) with a frozen manifest snapshot per batch (line 499)

## What went well

- **Dedicated fixer subagent** instead of looping the implementer back on itself (`subagentFixerTask`, lines 184-220; invoked at lines 349 and 394). This is the pattern the in-repo `/babysitter:retrospect` usually recommends -- the author arrived at it independently. The fixer carries the review issues, the prior implementation, and the manifest, with instructions scoped to "fix ONLY the listed issues" (line 30).
- **Reviewer prompts explicitly distrust the implementer** (`specReviewerInstructions` line 38, `qualityReviewerInstructions` line 49: "IRON LAW: Do NOT trust the implementer report. Read actual code."). Good mitigation against the well-known "implementer marks its own homework" failure mode.
- **Spec review must pass before quality review** (lines 316 vs 362). The ordering is correct -- no point polishing code that solves the wrong problem.
- **Scene context builder** (`buildSceneContext`, lines 69-144) gives each subagent its position in the plan, concurrent peers, upcoming work NOT to do, and an accumulated `buildManifest` of what prior tasks produced. This is exactly the context-engineering lever that distinguishes working subagent orchestration from hand-waving.
- **Parallel batch determinism**: `manifestSnapshot = [...buildManifest]` (line 499) freezes manifest state per batch so parallel peers all see the same prior-tasks view; results are **sorted by taskNumber before append** (line 514) so the accumulated manifest is deterministic regardless of resolution order. This is the right call and matches the babysitter determinism-by-invocation-key contract.
- **Every agent task declares an `outputSchema`** (e.g. lines 164-176). This is the strict-schema habit the SDK rewards.
- **All side effects go through `ctx.task()`**. The process function itself does no file I/O, no shell-outs, no direct git operations -- it composes effects and lets the harness execute them.
- **Test coverage present**: every process/helper file has a `.test.js` sibling (`subagent-tdd-loop.test.js` is 265 lines). Rare in process libraries.

## What went poorly

(Still process-only. Items are predicted-likely from static read.)

- **Breakpoint on 3rd-failure is approval-only, not choice-gated**. Lines 333-345 and 378-390 ask the user to "resolve this breakpoint to accept the current state" and then `specPassed = true` / `qualityPassed = true` regardless of resolution shape. A rejected/feedback-bearing breakpoint result is indistinguishable from an approval -- the breakpoint has no branch on `result.approved` or `result.option`. In babysitter idiom, this should use the robust rejection pattern: inspect the returned `BreakpointResult`, and if `approved === false`, either abort the run or loop back with the user's `feedback` as additional review issues.
- **Spec failure after 3 attempts still reports `specAttempts`** but the manifest shows the task as completed with the (still-failing) implementation. Downstream consumers of `completedTasks` cannot tell the difference between "passed review" and "user override". Recommend an explicit `outcome: 'passed' | 'escalated'` field per completed task.
- **Parallel fallback on dep-validation failure is a silent demotion**. Lines 439-465: when `validateDependencies` fails, the process shows a breakpoint then falls back to sequential. If the user resolves the breakpoint expecting "fix and retry", the process just continues sequentially anyway. The breakpoint question text ("Resolve to continue with sequential mode") is honest but the UX conflates "I accept" and "I wanted to edit my task list".
- **`ctx.runId` fallback at lines 345, 390, 449**. The pattern `context: { runId: runId || ctx.runId }` is defensive, but if `runId` is missing the caller has already skipped the MCP-state layer (`runId ? mcpImplementerInstructions(...) : []`) -- so the breakpoint context is the only place `ctx.runId` ever surfaces. Either commit to MCP state being mandatory or remove the `ctx.runId` fallback so the absence is visible.
- **Implementer `concerns` / `selfReviewFindings` arrays are collected but never consumed**. Lines 167-175 declare them; `buildManifestEntry` (line 59-67) ignores them. Dead surface area. Either feed them into the reviewer context (so the reviewer can verify the self-review claims) or drop them from the schema.
- **Declared SDK floor is `^0.0.168`** (package.json) -- pre-1.0 and behind current. Any reliance on `ctx.parallel.map` semantics (line 501) should pin the exact SDK version, because effect-batching behavior has evolved in 0.0.18x.
- **No `stableKey` on any `defineTask`**. With the loops at lines 320 and 365 re-dispatching `subagentFixerTask` / reviewer tasks, and with parallel batches doing `ctx.parallel.map`, replay identity relies entirely on the default `processId:stepId:taskId` hash. If the task author ever reorders the phases, the replay index invalidates. Explicit `stableKey` per attempt (e.g. `stableKey: \`fix-${reviewType}-${specAttempts}\``) would insulate.

## Process-quality review

| Criterion | Assessment |
|-----------|------------|
| Determinism | **Good.** No wall-clock branching, no `Math.random`, no unpinned env reads in the process body. Parallel batches freeze the manifest snapshot per batch (line 499) and sort by taskNumber before append (line 514). One concern: `runId` comes from MCP state (external), meaning replay depends on MCP server state -- see upstream note below. |
| Effect granularity | **Right-sized.** Four task kinds (implementer, fixer, spec-reviewer, quality-reviewer) with clear boundaries. Not too coarse (each is a focused subagent), not too fine (no per-file or per-line tasks). |
| Idempotency | **Mostly.** Side effects are in `ctx.task()`. The implementer/fixer DO perform `git commit` (implementer instruction line 23: "Commit your work."), which is not itself wrapped in an identifiable task kind -- so a replay of the implementer effect after a `state.json` rebuild would re-run the agent, which would attempt to commit again. Idempotency here depends on the agent noticing its prior commit, which is fragile. Recommend a dedicated `kind: 'git-commit'` task or an invocationKey that encodes the expected tree hash. |
| Breakpoint discipline | **Partial.** Breakpoints guard escalation (3-strikes-out) but don't branch on approval vs rejection (see "What went poorly" item 1). No `breakpointId` or `autoApproveAfterN` set -- every escalation is a full human gate. That's fine for a quality workflow but worth an explicit decision. |
| Error surfacing | **Weak.** No `try/catch` around `ctx.task()` calls. If an effect throws (e.g. Runtime error in the agent), the process bubbles the throw out of `executeSingleTask`, which means the manifest for the partial batch is lost. In parallel mode (line 501), one failing peer causes `ctx.parallel.map` to reject and all peer results from that batch are discarded. Consider per-task error capture → breakpoint-for-triage rather than run-failure. |
| Labels | **Missing.** No `labels: [...]` on any of the four task defs in `subagent-tdd-loop.js`. The gates (`design-gate.js`) also omit labels. Labels power observer-dashboard filtering and retrospective queries -- adding `labels: ['tdd', 'implementer']` / `['tdd', 'spec-review']` / etc. is a cheap win. |
| Re-use | **Could import shared components.** The pattern "implement → review → fix, with N-retry escalation" is a candidate for `library/processes/shared/tdd-triplet.js` (which exists in this repo). The validation phase could use `shared/deterministic-quality-gate.js`. Worth a comparative read. |

## Suggestions

### For the run

N/A -- process-only.

### For the process

Concrete edits, each cites the evidence line:

1. **Branch on breakpoint result** at lines 333-345 and 378-390. Replace:
   ```js
   await ctx.breakpoint({ question, title, context });
   specPassed = true; // Human approved continuation
   ```
   with:
   ```js
   const bp = await ctx.breakpoint({ breakpointId: 'tdd.spec-escalation', question, title, context });
   if (!bp.approved) {
     // Feed feedback back as additional review issues and loop
     specReview.issues.push(`User rejection: ${bp.feedback || 'no feedback'}`);
     continue;
   }
   specPassed = true;
   ```
2. **Declare `stableKey` per attempt** on the reviewer/fixer task definitions. Without it, moving the loop body around will invalidate replay identity. Minimum: `stableKey: \`spec-review-attempt-${specAttempts}\`` and analogous for fixer/quality. Line 322, 349, 367, 394.
3. **Record `outcome` per completed task** so `completedTasks[i].outcome ∈ {'passed','spec-escalated','quality-escalated'}`. Line 407 builds the return; extend the shape.
4. **Consume `concerns` and `selfReviewFindings` in the reviewer context**. Lines 167-175 declare them; the reviewer prompts at lines 38/49 ignore them. Pass them into `specReviewerTask.context` so the reviewer can verify the self-review claims.
5. **Protect against peer-task failure in parallel mode**. Wrap the `ctx.parallel.map` at line 501 so a single peer rejection doesn't discard sibling results. Capture per-peer outcomes and surface failures via a triage breakpoint.
6. **Add `labels: ['tdd','implementer']` / `['tdd','reviewer','spec']` / etc.** on the four task defs (lines 148-284). Ten-second change, pays back on every observer-dashboard filter.
7. **Wrap `git commit` in a named task kind**. Currently the implementer is instructed to commit inline (line 23). Extract to a dedicated `commitImplementationTask` with invocationKey that encodes the expected tree hash for true replay idempotency.
8. **Pin the SDK dependency** in `package.json` from `^0.0.168` to an exact version, because `ctx.parallel.map` semantics and `stableKey` support matter for correctness.
9. **Consider replacing `executeSingleTask`'s review loops with `library/processes/shared/tdd-triplet.js`** (upstream babysitter repo). Reduces surface area and keeps the bespoke logic focused on the novel pieces (scene context, MCP state, parallel batching).

### Generalization into a reusable library process

Two reusable patterns are hiding in this code that the shared library doesn't yet have:

- **`scene-context-builder`** (from `buildSceneContext`, lines 69-144): position-in-plan + concurrent peers + upcoming tasks + accumulated manifest. This is a generic scaffold for any multi-task orchestration where subagents need to know "where am I, what's already built, what's next, what not to touch". Ripe for `library/processes/shared/scene-context-builder.js`. Route: `/babysitter:contrib library contribution: add scene-context-builder shared process -- generalized from joe-habu/superbabysitter`.
- **`3-strikes-escalation-loop`** (from the spec/quality retry blocks, lines 320-359 and 365-404): "run review, if fail run fixer, after N failures open a breakpoint for human override". `tdd-triplet.js` covers the happy path but not the escalation + human-override shape. Worth a `library/processes/shared/n-strikes-escalation.js`. Route: `/babysitter:contrib library contribution: add n-strikes-escalation shared process with robust rejection branching`.

### For babysitter upstream

General-applicability observations worth filing via `/babysitter:contrib`:

1. **The "breakpoint with no branch on result" anti-pattern is common** in externally-authored processes. The SDK could surface a docs warning or ESLint-style lint against `await ctx.breakpoint(...)` whose result is not read. Route: `/babysitter:contrib library contribution: add lint/docs warning for unchecked breakpoint results`.
2. **Dead schema fields in agent outputs** (e.g. `concerns`, `selfReviewFindings` declared in the output schema but never consumed). The SDK's prompts/templates could suggest "declared output fields should be referenced downstream or removed". Route: `/babysitter:contrib documentation question: outputSchema fields and downstream consumption guidance`.
3. **Git operations from inside an agent task are a replay hazard**. No primitive currently makes "commit the current tree" deterministic under replay. A `kind: 'git-commit'` or `kind: 'tree-snapshot'` with invocationKey tied to the git tree hash would be a reusable primitive. Route: `/babysitter:contrib feature request: dedicated git-commit task kind with tree-hash invocationKey`.
4. **Parallel batching error model is coarse-grained**. `ctx.parallel.map` rejects on first failure, discarding sibling successes (observed shape, line 501). A `ctx.parallel.allSettled`-style primitive (or a `failureMode: 'isolate'` option) would be broadly useful -- this exact case arose here in the TDD-loop parallel batches. Route: `/babysitter:contrib feature request: isolate-per-peer failure mode for ctx.parallel.map`.
5. **External authors reach for `^0.0.168` and never update**. The SDK's release notes should highlight `ctx.parallel.map` / `stableKey` changes loud enough that downstream pins move. Route: `/babysitter:contrib documentation question: upgrade guide visibility for pre-1.0 consumers`.

## Evidence

- Process: `.a5c/tmp/external-runs/superbabysitter/process/subagent-tdd-loop.js` (527 lines)
- Gates: `.a5c/tmp/external-runs/superbabysitter/process/{design,planning,verification,finishing}-gate.js`, `debugging-phase.js`
- Helpers: `process/mcp-state-helpers.js`, `process/parallel-task-helpers.js`, `process/build-manifest-helpers.js` (all test-covered)
- Manifest: `package.json` pins `@a5c-ai/babysitter-sdk: ^0.0.168`
- Runs: none committed on `main` (both `ls .a5c/runs/` and `git log --all --diff-filter=A -- '.a5c/runs/'` returned empty)
- Source commit: `531a39c13ea7c41b5439afd21fb82701dc69ac80`

## Notes

Excerpts above are quoted for retrospective analysis under fair use; the repo is MIT-licensed regardless. No process from this repo was executed -- the analysis is purely static.
