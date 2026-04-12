# Retrospective: hagaybar/budget-manager -- banking-ux-polish (run 01KM8764BPNS14FMJQQGYEHBM3)

Date: 2026-04-12
Source commit: cloned HEAD at `.a5c/tmp/external-runs/bm/`
Process: `.a5c/processes/banking-ux-polish.js` (253 lines)
Run: `01KM8764BPNS14FMJQQGYEHBM3`
Outcome: **success** (RUN_COMPLETED after 18 journal events, 8 effects, all first-try resolved; 0 fix iterations triggered)

## Context

Personal budget-manager Android app (FastAPI backend, Compose mobile frontend). The `banking-ux-polish` process redesigns three Android screens -- `TransactionListScreen`, `MonthlySummaryScreen`, and "remaining screens" -- to a banking-app look, with a gradle `assembleDebug` build gating each phase and a fix-task fallback loop (up to `maxIter=5`).

## Timeline

- 13 journal events of `EFFECT_REQUESTED` / `EFFECT_RESOLVED` pairs -- 8 pairs, perfectly interleaved.
- No retries, no fixers invoked -- every build passed first try. Total wall time ~21 min (2026-03-21T12:51:09 → 13:12:40).
- Final `ctx.breakpoint` asks the user to test the APK; result is discarded.

## What went well

- **Phase decomposition is clean**: three redesign phases + a final APK build, each with its own iterative fix loop. The shape matches what the task needs.
- **Per-task labels are present** (`['main-screen','hero']`, `['summary-screen']`, `['polish']`, `['build', args.step]`, `['fix', args.step]`). Observer dashboard can filter, unlike the joe-habu/superbabysitter retrospective target.
- **Prompts are detailed and specific**: exact file paths to read, token constraints (Compose BOM 2024.02.00 and navigation-compose 2.7.7), explicit "DO NOT modify ViewModels / MainActivity.kt" guardrails. This is the kind of context-engineering that makes agent runs deterministic in outcome.
- **Tasks have strict `outputSchema`** on every agent task (summary, filesModified, allPassing, errors). The SDK rewards this.
- **First-try success across all 8 effects** on the inspected run. The prompts + constraints are tight enough that agents didn't need fix loops.

## What went poorly

- **The terminal breakpoint is fire-and-forget** (`banking-ux-polish.js:68`). `await ctx.breakpoint(...)` with no `.approved` branch -- this is the exact anti-pattern the new `library/processes/shared/n-strikes-escalation.js` component exists to prevent. If the user rejects the breakpoint with feedback, the process ignores both the rejection and the feedback and still returns `{ success: apk.allPassing }`. Our new `scripts/lint-breakpoint-results.cjs` flags this.
- **`ctx.now()` at line 73** is wall-clock branching in the process body. The returned `metadata.timestamp` is included in the process output, which means the run's output hash will differ on replay even when all effects are identical. This is the textbook determinism hazard the SDK docs warn about. Deterministic alternative: read the `RUN_CREATED` timestamp from the journal, or omit `timestamp` from the output.
- **No `stableKey` on any task definition**. The loop bodies at lines 25-30, 40-45, 54-59 each re-dispatch `buildTask` / `fixTask` with `{step, iteration}` args. The default invocation key is `processId:stepId:taskId` (hashed) -- if the author ever reorders phases or inserts a new intermediate task, the replay index invalidates. Adding `stableKey: \`build-${args.step}-${args.iteration}\`` would insulate.
- **No `breakpointId` on the terminal breakpoint**. Users can't auto-approve "Banking UX Polish Complete" prompts via rules without writing a rule that matches on title substring. Add a canonical `breakpointId: 'banking-ux-polish.final-review'`.
- **No `instructions:` array on `defineTask`s**; instead the author encodes instructions inside `agent.prompt.instructions`. This works, but it bypasses the SDK-standard `TaskDef.instructions` surface and any future instruction-level tooling (e.g. compression/caching layers). Minor consistency nit.
- **`fixTask` has no access to prior fix attempts**. On iteration N, the fixer only sees `buildResult` for iteration N's build. If the same error resurfaces repeatedly it has no memory. For a 5-iteration loop this matters.

## Process-quality review

| Criterion | Assessment |
|-----------|------------|
| Determinism | **Mixed.** No `Math.random`. But `ctx.now()` on line 73 baked wall-clock into the output. |
| Effect granularity | **Right-sized.** Five task kinds: 3 redesign + 1 build + 1 fix. Each is a focused agent prompt. |
| Idempotency | **Weak for mutation tasks.** Redesign + fix tasks modify Kotlin files directly. No tree-hash or content-hash in invocation keys -- a replay after losing state cache would re-dispatch agents that would make "the same change" again, but Kotlin semantics of that are nondeterministic. |
| Breakpoint discipline | **Bad.** Terminal breakpoint has no `breakpointId`, no result branching, no rejection handling. |
| Error surfacing | **Adequate.** `buildTask` returns `{allPassing, errors, buildOutput}`. Fix loop caps at `maxIter=5` and falls through silently if never passing -- the loop exits without marking failure. `apk.allPassing` at the end would be false, but the final `{success}` is computed only from the APK build, not from whether fix loops succeeded. |
| Labels | **Present and useful** (see "What went well"). |
| Re-use | **Could replace the retry blocks with `tdd-triplet` or the new `n-strikes-escalation`**. Three near-identical while loops (lines 25-30, 40-45, 54-59) cry out for a helper. |

## Suggestions

### For the run

N/A -- run completed successfully.

### For the process

1. **Branch on the final breakpoint** (line 68-71). Replace with:
   ```js
   const bp = await ctx.breakpoint({
     breakpointId: 'banking-ux-polish.final-review',
     title: 'Banking UX Polish Complete',
     question: `APK built: ${apk.allPassing}. Please test and confirm.`,
   });
   if (!bp.approved) {
     return { success: false, rejectedFeedback: bp.feedback };
   }
   ```
2. **Drop `ctx.now()` from the output** at line 73 (or replace with a value derived from `RUN_CREATED`). Output determinism matters for replay parity.
3. **Add `stableKey` per attempt** on `buildTask` / `fixTask`: `stableKey: \`${args.step}-${args.iteration}\``. Lines 27, 29, 42, 44, 57, 59, 66.
4. **Collapse the three retry blocks** (lines 25-30, 40-45, 54-59) into one helper -- or better, use the new shared `nStrikesEscalation` from this repo's `library/processes/shared/`. Removes ~20 lines and gains robust rejection for free if the fix cap is ever hit.
5. **Feed prior fix attempts into `fixTask`**. Currently `fixTask` only sees the latest `buildResult`. Extend `fixTask` args with `priorAttempts` (array of summaries from previous iterations) so the fixer can avoid repeating a failed approach.
6. **Use the SDK-standard `TaskDef.instructions` field** instead of burying instructions inside `agent.prompt.instructions`. Enables SDK-level tooling.

### For babysitter upstream

1. **The terminal-breakpoint-with-unread-result anti-pattern keeps recurring**. Two retrospectives in, two hits. Worth a lint rule shipped in the SDK (`docs warning` or a vitest hook). Route: `/babysitter:contrib library contribution: ship lint-breakpoint-results as an SDK-exposed lint rule`.
2. **`ctx.now()` is a determinism footgun** -- it's available on the context but there's no guard-rail that warns when its output is written into the process return value. Consider either removing it from `ProcessContext` or wrapping it with a clearly-named `ctx.unsafe.wallClock()` so authors think twice. Route: `/babysitter:contrib feature request: rename ctx.now to ctx.unsafe.wallClockNow`.
3. **`stableKey` discoverability**: authors consistently omit it. See if a doc paragraph in the `defineTask` JSDoc can surface it. Route: `/babysitter:contrib documentation question: stableKey visibility in defineTask JSDoc`.

## Evidence

- Process: `.a5c/tmp/external-runs/bm/.a5c/processes/banking-ux-polish.js` (253 lines)
- Run: `.a5c/tmp/external-runs/bm/.a5c/runs/01KM8764BPNS14FMJQQGYEHBM3/`
  - 18 journal events: 1 RUN_CREATED, 8 EFFECT_REQUESTED, 8 EFFECT_RESOLVED, 1 RUN_COMPLETED
  - All effects resolved first-try; no fixer invocations
- Repo-wide: 14 process files under `.a5c/processes/`, 14 runs under `.a5c/runs/` (6 with ULIDs from October 2025 -- not inspected).

## Notes

Quoted for retrospective analysis under fair use; source is the target repo's HEAD (license not inspected but Budget Manager appears to be a personal project).
