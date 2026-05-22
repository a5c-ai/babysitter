# 18 — Babysitter SDK Parity Analysis

> Archived parity document. Preserved for historical context; not part of the current normative `reference/` contract.

**Date:** 2026-04-12
**Upstream:** github.com/a5c-ai/babysitter @ `staging` — `packages/sdk/src/harness/*`
**Local:** `C:/work/agent-mux/packages/adapters/src/*-adapter.ts`

> Note on scope: babysitter's `HarnessAdapter` and agent-mux's `AgentAdapter` are **not the same contract**. babysitter adapters are *orchestration-loop controllers* (session-binding, stop-hook decisions, iteration caps, inactive retained-state exits, completion-proof matching) that live next to an external harness. agent-mux adapters are *subprocess adapters* (spawn args, JSONL event parsing, auth, config, sessions on disk). Still, several generic features from babysitter are directly portable and close real gaps.

---

## 1. Per-Adapter Gap Table

| Adapter | babysitter file | agent-mux file | Babysitter-only features (gaps in agent-mux) |
|---|---|---|---|
| **claude** | `harness/claudeCode.ts` | `claude-adapter.ts` | PID-scoped session marker (`~/.a5c/state/current-session-pid-{PID}`); `CLAUDE_ENV_FILE` last-match resolution; `bindSession` with re-entrancy guard; `handleStopHook` (iteration cap 65000, inactive retained-state exits, breakpoint-only gating, promise-tag `<promise>VALUE</promise>` completion proof, density-filter prompt compression, processLibraryCache pre-warming); `STOP_HOOK_INVOKED` journal telemetry; process-tree ancestor walk (wmic/PowerShell on Windows); atomic tmp→target env file writes. |
| **codex** | `harness/codex.ts` | `codex-adapter.ts` | Session ID cascade (`CODEX_THREAD_ID`, `CODEX_SESSION_ID`); stop-hook delegates to claude adapter (shared loop logic); snake_case/camelCase input normalization; synthetic stdin injection for delegated hooks. |
| **cursor** | `harness/cursor.ts` | `cursor-adapter.ts` | `conversation_id` extraction from hook stdin; `followup_message` auto-continue contract; IDE vs. CLI hook-type split (rejects `after-agent-response` in CLI); promise-tag matching against `run.completionProof`; fallback run resolution under `.a5c/.a5c/runs/`. |
| **gemini** | `harness/geminiCli.ts` | `gemini-adapter.ts` | `{"decision":"block","reason":…,"systemMessage":…}` stop-hook contract; `prompt_response` parsing; `GEMINI_EXTENSION_PATH/hooks/after-agent.sh` dispatcher; env signals `GEMINI_PROJECT_DIR`, `GEMINI_CWD`. |
| **copilot** | `harness/githubCopilot.ts` | `copilot-adapter.ts` | `sessionEnd` cleanup handler; env-file stale-line stripping (`setBabysitterSessionIdInCopilotEnvFile`); explicit "in-turn model" capability flag (no stop-hook). |
| **opencode** | `harness/opencode.ts` | `opencode-adapter.ts` | `shell.env` plugin hook for auto-injecting `BABYSITTER_SESSION_ID`; `.opencode/plugins/` + Accomplish data-dir discovery; explicit capability set `[HeadlessPrompt]`. |
| **openclaw** | `harness/openclaw.ts` | `openclaw-adapter.ts` | Composite session key `agent:<id>:<channel>:<type>:<id>`; daemon model (no spawn); programmatic plugin registration. |
| **pi / omp** | `harness/pi.ts`, `ohMyPi.ts` | `pi-adapter.ts`, `omp-adapter.ts` | Explicit `supportsHookType(): false`; runId-mismatch error on re-bind; `createPiContext()` prompt-context generator. |
| **custom / null** | `harness/customAdapter.ts`, `nullAdapter.ts` | *(no equivalent)* | Fallback adapter that demands explicit `--session-id`; null adapter for unknown environments. |
| *(cross-cutting)* | `harness/fallbackChains.ts`, `registry.ts`, `capabilityRouter.ts`, `selectionPolicies.ts`, `modelSelection.ts` | *(partial in core)* | Ordered fallback sequence with failure set and `maxRetries`; capability-based routing; selection policies. |

---

## 2. Top 10 Generic Feature Gaps

1. **Orchestration stop-hook loop** — iteration counter, `maxIterations` (65000), breakpoint-only gating. Not present in any agent-mux adapter.
2. **Completion-proof / promise-tag matching** — `<promise>VALUE</promise>` extraction from last assistant message cross-checked against run metadata.
3. **Session binding with re-entrancy guard** — prevents two runs grabbing the same harness session; auto-releases on terminal run state.
4. **PID-scoped session markers + ancestor-PID walk** — Windows fallback via wmic/PowerShell; tolerates forked shells.
5. **Fallback chain / capability router** — `fallbackChains.ts` + `capabilityRouter.ts` aren't mirrored in agent-mux's router.
6. **Structured journal telemetry** — `STOP_HOOK_INVOKED` events (decision, reason, pending kinds, run state) appended to the run journal.
7. **Prompt compression / density filter + processLibraryCache** — reduces context size across iterations with TTL cache; agent-mux does no prompt compression.
8. **Atomic env-file writes with stale-line stripping** — `CLAUDE_ENV_FILE` / Copilot env file handling; last-match semantics; tmp→rename.
9. **Hook logger** — per-hook log at `~/.a5c/log/{hookName}.log`, best-effort, context-rich (session/run/ancestor/alive). agent-mux has no hook-side logger.
10. **Explicit capability enums** (`HeadlessPrompt`, `SessionBinding`, `StopHook`, `MCP`, `Programmatic`) — surfaced per adapter so callers can branch; agent-mux's `AgentCapabilities` is large but lacks the orchestration-layer flags (`supportsStopHook`, `supportsSessionBinding`, `inTurnOnly`).

---

## 3. Actionable Follow-ups

| # | Area | File (agent-mux) | Suggested change |
|---|------|------------------|------------------|
| F1 | Capabilities surface | `packages/core/src/types.ts` (AgentCapabilities) | Add `supportsStopHook`, `supportsSessionBinding`, `supportsInTurnOnly`, `autoResolvesSessionId`, `maxIterationsDefault` fields. |
| F2 | Base session binding | `packages/adapters/src/base-adapter.ts` | Add `bindSession({sessionId, runId})` + `~/.a5c/state/{sessionId}.md` state file with re-entrancy guard; mirrors `bindSessionImpl` from babysitter. |
| F3 | Stop-hook loop primitives | new `packages/adapters/src/stop-hook.ts` | Port iteration counter, `iterationTimes[]` runaway detector, breakpoint-only gate, promise-tag parser from `claudeCode.ts`. |
| F4 | Claude PID marker | `packages/adapters/src/claude-adapter.ts` | Add PID-scoped marker file + `CLAUDE_ENV_FILE` last-match resolver in `resolveSessionId`. |
| F5 | Codex session cascade | `packages/adapters/src/codex-adapter.ts` | Extend `resolveSessionId` to read `CODEX_THREAD_ID` then `CODEX_SESSION_ID` before legacy `BABYSITTER_SESSION_ID`. |
| F6 | Cursor followup contract | `packages/adapters/src/cursor-adapter.ts` | Add stop-hook emitter that returns `{followup_message}` JSON; reject `after-agent-response` when in CLI mode. |
| F7 | Gemini decision JSON | `packages/adapters/src/gemini-adapter.ts` | Add `decision:"block"/"allow"` + `systemMessage` helper for stop hooks; include `GEMINI_PROJECT_DIR`/`GEMINI_CWD` in hostEnvSignals. |
| F8 | Copilot env-file hygiene | `packages/adapters/src/copilot-adapter.ts` | Add `setBabysitterSessionIdInCopilotEnvFile` equivalent — strip prior lines, atomic rename. |
| F9 | Fallback chain utility | new `packages/core/src/fallback-chain.ts` | Port `resolveFallbackHarness(chain, failed, maxRetries)` returning `{next, attempt, isFallback, exhausted}`. |
| F10 | Hook logger | new `packages/core/src/hook-logger.ts` | Structured logger → `~/.a5c/log/{hookName}.log`; best-effort, context-rich; used by all adapters' hook handlers. |
| F11 | Journal telemetry | `packages/core/src/journal.ts` (or equivalent) | Emit `STOP_HOOK_INVOKED` with `{decision, reason, iteration, runState, pendingKinds, hadPromise}`. |
| F12 | Prompt compression | new `packages/core/src/density-filter.ts` | Port `densityFilterText` + `processLibraryCache` with TTL; hook into iteration prompt builder. |
| F13 | Custom / null adapters | `packages/adapters/src/` | Add `custom-adapter.ts` (requires explicit session-id) and `null-adapter.ts` (safe no-op) to match babysitter's fallback ladder. |
| F14 | Retry policy default | `packages/adapters/src/base-adapter.ts::shouldRetry` | Extend `retryOn` defaults to include `AUTH_EXPIRED`; add exponential backoff helper (babysitter delegates but agent-mux owns retries). |
| F15 | Windows process-tree walk | `packages/core/src/process-tree.ts` | Add wmic + PowerShell fallback for ancestor PID resolution (used by Claude adapter). |

---

## 4. API Shape Differences (summary)

- **agent-mux**: class-based `BaseAgentAdapter` with `buildSpawnArgs`/`parseEvent`/`detectAuth`/session-on-disk.
- **babysitter**: factory-returning `HarnessAdapter` object with `isActive`/`bindSession`/`handleStopHook`/`handleSessionStartHook`/`installHarness`/`installPlugin`/`getPromptContext`.
- These are **complementary, not overlapping**. A future `OrchestrationAdapter` mixin or sibling interface on agent-mux adapters would let a single package expose both. See F1–F3.


