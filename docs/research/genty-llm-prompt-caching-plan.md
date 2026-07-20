# genty-core Vendor-Aware LLM Prompt Caching — Implementation Plan

Status: **plan only** — no source changes. This document specifies an additive design for prompt
caching in `packages/genty/core/src/session.ts`. All line numbers below are current as of
`staging` at commit `743744639` and were verified by reading the file directly.

## 1. Goals & non-goals

### Goals

- Let genty-core opt into vendor-native prompt caching (Anthropic `cache_control`, OpenAI/Azure
  automatic caching, Google Gemini implicit + explicit caching) on the single completion call
  path in `callCompletionApi` (`packages/genty/core/src/session.ts:605-703`).
- Make caching **additive and per-provider opt-in** via `AgentCoreSessionOptions` — a session that
  does not enable caching must produce byte-identical request bodies to today, and behave
  identically on every provider.
- Surface cache-hit/write telemetry (`cache_read`, `cache_creation`, `cached_tokens`, etc.) through
  the existing `CompletionUsage` / `AgentCorePromptResult.usage` shape so callers can observe cache
  effectiveness without new APIs.
- Keep the up-to-50-iteration tool-calling loop (`runCompletionLoop`,
  `packages/genty/core/src/session.ts:1169-1375`, `MAX_TOOL_LOOP_ITERATIONS = 50` at line 35)
  untouched in control flow — caching is a request-shaping concern, not a loop-control concern.
- Follow the repo's "fallbacks are evil" rule (`CLAUDE.md`): if a caller enables caching for a
  provider/config combination that cannot honor it, genty-core must fail loud (throw with a clear
  message) or explicitly no-op with a logged reason — never silently downgrade to "it just didn't
  cache" without telling the caller why.

### Non-goals

- No change to the tool-calling loop's control flow, convergence-guard thresholds
  (`MAX_REPEATED_TOOL_CALLS`, `MAX_CONSECUTIVE_TOOL_ERRORS`), or history bookkeeping
  (`historyEntries`, `AgentCoreHistoryEntry`).
- No change to `readOpenAiStream` / `readAnthropicStream` SSE event *parsing* logic beyond adding
  new usage fields — no new event types are introduced.
- No general-purpose "cache manager" abstraction shared across providers. Gemini's explicit-cache
  resource lifecycle is different enough (create/reference/delete against a REST resource,
  independent of a single completion call) that this plan scopes it as a separate, later-phase
  subsystem (see §5.1) rather than forcing it into the same shape as Anthropic/OpenAI/Azure.
- No change to `resolveEndpoint` provider-detection heuristics
  (`packages/genty/core/src/session.ts:305-362`) beyond reading new env/config for cache settings.
- No retrofitting of `packages/babysitter-sdk/src/prompts/strata.ts` — it is cited as *precedent*
  for the `cache_control` shape, not a dependency to be refactored. Any future unification is out
  of scope for this plan.

## 2. Config surface

### 2.1 Current shape (baseline, read from `packages/genty/core/src/types.ts`)

`AgentCoreSessionOptions` (`types.ts:83-180`) already carries `model`, `systemPrompt`,
`appendSystemPrompt`, `customTools`, `backend`, `modelAttestationKey`, and `policyToolGate`. There
is currently no caching-related field. `CompletionUsage` is defined in `session.ts:111` as
`type CompletionUsage = NonNullable<AgentCorePromptResult["usage"]>`, and
`AgentCorePromptResult.usage` (`types.ts:64-70`) is:

```ts
usage?: {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  provider?: string;
  model?: string;
};
```

No cache-specific counters exist today.

### 2.2 Proposed additions to `AgentCoreSessionOptions` (`types.ts`)

Add one new optional, additive block. Nothing here is required; omitting it must reproduce
today's behavior exactly.

```ts
/**
 * Opt-in vendor-aware prompt caching. When absent, no caching directives are
 * added to any provider request body (current behavior, byte-identical).
 * Per-provider knobs are independent because each vendor's cache mechanism
 * has a different shape (Anthropic: explicit breakpoints; OpenAI/Azure:
 * automatic, config is advisory only; Gemini: implicit + optional explicit
 * resource).
 */
promptCaching?: {
  /** Master switch. Defaults to false. When false, all sub-options are ignored. */
  enabled: boolean;
  anthropic?: {
    /**
     * Where to place cache_control breakpoints. See §4 for placement
     * rationale. Defaults to ["system", "tools"] when enabled.
     */
    breakpoints?: Array<"tools" | "system" | "history">;
    /** cache_control.ttl. Anthropic supports "5m" (default) or "1h". */
    ttl?: "5m" | "1h";
  };
  openai?: {
    /** Forwarded as prompt_cache_key (routing hint only, no-op if unsupported by model). */
    promptCacheKey?: string;
  };
  azure?: {
    /** Forwarded as prompt_cache_key where the deployment supports it. */
    promptCacheKey?: string;
  };
  gemini?: {
    /**
     * "implicit" relies on automatic server-side caching (no request
     * change). "explicit" requires an out-of-band CachedContent resource —
     * see §5.1. Defaults to "implicit" when enabled.
     */
    mode?: "implicit" | "explicit";
    /** Required when mode === "explicit"; see §5.1 lifecycle. */
    cachedContentName?: string;
    ttl?: string; // e.g. "3600s"
  };
};
```

Design rationale for this shape:

- **One master `enabled` flag** rather than per-provider enable flags, because a given genty-core
  session already resolves to exactly one provider via `resolveEndpoint`
  (`session.ts:305-362`) — a caller cannot mix providers mid-session. Per-provider sub-objects
  hold vendor-specific *tuning*, not independent on/off switches, which avoids the ambiguous case
  of "anthropic disabled but openai enabled" on a session that is actually routed to Anthropic.
- **Additive to `AgentCoreSessionOptions`**, not a new top-level session constructor parameter,
  because `AgentCoreSessionHandle` (`session.ts:1077` onward) already threads `this.options`
  through `runCompletionLoop` → `callCompletionApi` with no other config channel; introducing a
  second config object would fork the plumbing.
- **No silent capability fallback.** If `promptCaching.enabled === true` and the resolved
  `ResolvedEndpoint` (`session.ts:297-303`) is neither `isAnthropic` nor `isAzure`/OpenAI-shaped
  nor recognized as Gemini (Gemini is not currently a supported `ResolvedEndpoint` branch at all —
  see §3.4), `callCompletionApi` must throw
  `Error("promptCaching.enabled is set but endpoint <apiBase> has no supported caching path")`
  rather than proceed uncached. This is the "fail loud" side of the no-fallback rule.

## 3. Per-vendor request-shape changes

All changes are confined to the three branches inside `callCompletionApi`
(`session.ts:605-703`): the Anthropic branch (639-656), the Azure branch (657-667), and the plain
OpenAI-compatible branch (668-679). Gemini has no branch today (see §3.4).

### 3.1 Anthropic (`session.ts:639-656`)

Current body construction:

```ts
const systemPrompts = request.messages.filter(m => m.role === "system").map(m => contentToText(m.content));
const nonSystemMsgs = request.messages.filter(m => m.role !== "system");
const structuredPrompt = buildAnthropicStructuredOutputPrompt(request.structuredOutput);
const system = [...systemPrompts, structuredPrompt].filter(Boolean).join("\n\n");
const baseMessages = nonSystemMsgs.map(m => ({ role: m.role, content: toAnthropicContent(m.content) }));
const extra = extraRawMessages.map((m) => ({ role: m.role, content: m.content }));
body = JSON.stringify({
  model: endpoint.model,
  max_tokens: 16384,
  stream: true,
  ...(system ? { system } : {}),
  ...buildAnthropicTools(request.customTools),
  messages: [...baseMessages, ...extra],
});
```

Today `system` is a single joined **string**. Anthropic's `cache_control` can only be attached to
a **content block**, not a bare string, so caching the system prompt requires switching `system`
from `string` to `Array<{type:"text", text:string, cache_control?}>` when caching is enabled
(Anthropic accepts both shapes for `system`; the array form is additive and does not change
behavior for callers who never read the raw body). Insertion points:

1. **New helper** `buildAnthropicSystemBlocks(system: string, cacheEnabled: boolean, ttl)` next to
   the existing `buildAnthropicStructuredOutputPrompt` (`session.ts:448-466`). When
   `cacheEnabled` and `"system"` is in `breakpoints`, emit
   `[{ type: "text", text: system, cache_control: { type: "ephemeral", ...(ttl==="1h"?{ttl:"1h"}:{}) } }]`;
   otherwise keep the current bare-string `system` field untouched.
2. **`buildAnthropicTools`** (`session.ts:592-603`) — add `cache_control` to the **last** tool
   definition in the array when `"tools"` is in `breakpoints`. Anthropic's cache lookback covers
   everything before and including a breakpoint, so tagging only the final tool entry is
   sufficient to cache the whole tool block; this mirrors the `strata.ts` pattern of tagging the
   rendered block, not every sub-part (`strata.ts:305-310`).
3. **History breakpoint** (optional, `"history"` in `breakpoints`) — tag the **last message** in
   `baseMessages` (i.e., the end of stable prior turns, before `extra`) with `cache_control` when
   the caller signals the conversation prefix is stable. This is the one insertion point that
   interacts with the tool loop; see §5.

Anthropic constraint to encode in the helper: **max 4 `cache_control` breakpoints per request**
(hard vendor limit) — the plan's three breakpoint categories (tools, system, history) plus any
future one must be validated against this cap in the helper, throwing rather than silently
dropping a breakpoint if a caller somehow requests more than 4.

### 3.2 Azure OpenAI (`session.ts:657-667`)

```ts
body = JSON.stringify({
  model: endpoint.model,
  messages: [...request.messages.map(toOpenAiMessage), ...extraRawMessages.map(toOpenAiRawMessage)],
  max_completion_tokens: 16384,
  stream: true,
  ...buildOpenAiResponseFormat(request.structuredOutput),
  ...buildOpenAiTools(request.customTools),
});
```

Azure's caching is automatic server-side (on by default, cannot be disabled) — there is **no
request field required** to enable it. The only request-shape change is optionally forwarding
`prompt_cache_key: options.promptCaching.azure.promptCacheKey` as a spread, e.g.
`...(cacheKey ? { prompt_cache_key: cacheKey } : {})`, inserted directly in the body object at
line ~663. Because Azure caching cannot be turned off, `promptCaching.enabled === true` with no
`azure` sub-config is a valid, meaningful no-op-on-the-wire state — this must NOT throw (contrast
with Gemini in §3.4), since the caching is already happening; the config only adds an optional
routing hint. Document this asymmetry explicitly in the helper's comment so it isn't mistaken for
an oversight.

### 3.3 Plain OpenAI-compatible (`session.ts:668-679`)

Structurally identical to the Azure branch (same `toOpenAiMessage`/`buildOpenAiTools` helpers).
Apply the same treatment: optional `prompt_cache_key` from `promptCaching.openai.promptCacheKey`,
same "automatic, cannot disable, cache key is advisory only" comment. Note this branch is also
used for non-Azure, non-Anthropic custom endpoints (`agentMuxApiBase` without provider hints,
`session.ts:333-336`) — the plan makes no assumption that these are truly OpenAI-compatible for
caching purposes beyond forwarding the same optional field; if a custom endpoint ignores it, that
is expected and harmless (it is not a "supported caching path" being silently downgraded, it is an
optional hint being sent to an endpoint that may or may not use it — consistent with OpenAI's own
"prompt_cache_key is advisory" semantics).

### 3.4 Google Gemini — not currently a supported endpoint

`ResolvedEndpoint` (`session.ts:297-303`) and `resolveEndpoint` (`session.ts:305-362`) have no
Gemini branch today: the function only distinguishes `isAzure` / `isAnthropic` / (implicit)
OpenAI-compatible. This plan does **not** propose adding full Gemini chat-completion support as a
side effect of a caching plan — that is a separate, larger change (new SSE parser shape, since
Gemini's `generateContent`/`streamGenerateContent` response schema differs from both OpenAI's and
Anthropic's `readOpenAiStream`/`readAnthropicStream`). Two consequences:

- Per the no-fallback rule, if `promptCaching.gemini` is set on a session whose `resolveEndpoint()`
  result is not recognized as Gemini, `callCompletionApi` throws — it must never silently ignore
  Gemini config on a non-Gemini endpoint.
- The vendor-request-shape work for Gemini in this plan is written as a **forward-looking
  specification** to land only once/if genty-core gains a Gemini `ResolvedEndpoint` branch and its
  own stream reader (tracked as a prerequisite, not part of this caching change). Until then,
  `promptCaching.gemini` remains a documented-but-unimplemented config shape that throws
  `"Gemini caching requires Gemini endpoint support, which genty-core does not yet have"` if set.
  This keeps the config surface (§2.2) stable for when that prerequisite lands, without pretending
  the capability exists today.

Implicit-mode request shape (once Gemini support exists): no changes to `generateContent` body —
caching is automatic for Gemini 2.5+ when the model is used unmodified; only `usage_metadata`
parsing changes to surface `cached_content_token_count`.

Explicit-mode request shape: instead of building an inline `body`, the call site must first
resolve/create a `CachedContent` resource (`POST /v1beta/cachedContents`) out-of-band and then send
`{ "cachedContent": "cachedContents/{id}" }` alongside the turn's volatile content. See §5.1 for
why this does not fit the current single-call `callCompletionApi` shape without a new lifecycle
layer.

## 4. Cache-breakpoint placement strategy for genty

Aligning with the `strata.ts` model (`packages/babysitter-sdk/src/prompts/strata.ts:27`,
`STRATUM_ORDER = ['stable', 'runtime', 'turnLocal']`) and its `stratumToCacheControl` mapping
(`strata.ts:284-290`, which tags `stable` and `runtime` as `ephemeral` and leaves `turnLocal`
uncached), genty-core's completion path has an analogous three-tier structure, even though it does
not use `strata.ts` directly (that module lives in `babysitter-sdk`, genty-core is a separate
package with its own message-building code):

| Tier | genty-core source | Cache breakpoint? |
|---|---|---|
| **stable** | `buildAnthropicTools`/`buildOpenAiTools` output (`session.ts:575-603`) — `request.customTools`, which is fixed per session (`AgentCoreSessionOptions.customTools`, set once at session construction) | Yes — tag last tool entry |
| **stable/runtime** | `system` block: `options.systemPrompt` + `options.appendSystemPrompt` joined in `buildSystemPrompt` (`session.ts:115-130`), flowing into `request.messages` as a `role: "system"` entry consumed at `session.ts:643` | Yes — tag the system block |
| **runtime** | Prior conversation history fed via `baseMessages` (`session.ts:647`) — the non-system messages already in `request.messages` before this turn's user prompt | Optional — tag the last stable-prefix message only when the caller opts into `"history"` breakpoints, since this segment grows every turn and a misplaced breakpoint here wastes writes (see gotcha below) |
| **turnLocal** | `extraRawMessages` (`session.ts:616`, `648`, `655`) — the tool-call/tool-result turns appended by `runCompletionLoop` for the *current* prompt's tool loop, plus the just-submitted user prompt | No — never cache; this is the volatile tail by construction (fresh every loop iteration) |

Rationale mirrors `strata.ts`'s ordering principle (`STRATUM_ORDER`, stable-first) directly:
Anthropic's own docs specify cache lookback covers the prefix *before* a breakpoint, so
breakpoints must be placed after the most-stable, least-frequently-changing content and as early
in the render order as possible. genty-core's Anthropic body render order is **tools → system →
messages** (matches `session.ts:649-656` field order in the `JSON.stringify` call), which already
lines up with stable-first placement with zero reordering needed — tools and system are
structurally first, so tagging their end blocks is sufficient without moving anything.

Gotcha specific to genty's tool loop: unlike a single-shot completion, `extraRawMessages` grows on
every iteration of `runCompletionLoop` (`session.ts:1231`, `1347`, `1350`) within the same prompt's
50-iteration budget. A `"history"` breakpoint tagging the last `baseMessages` entry stays valid
across all iterations of one `runCompletionLoop` call because `baseMessages` itself is fixed for
the duration of that call (only `extraRawMessages` mutates) — so per-call cache reuse across tool
iterations is free once implemented. Cross-*prompt* reuse (a fresh `session.prompt()` call reusing
a previous prompt's cached prefix) is a separate question the config's `ttl` addresses (5m default
covers back-to-back prompts in the same session; 1h for longer gaps) but is bounded by the strict
byte-prefix-match rule — any change to `customTools`, `systemPrompt`, or the history included
invalidates the cache regardless of `ttl`.

## 5. Streaming/tool-loop interaction

### 5.1 Do cache markers change `readAnthropicStream`/`readOpenAiStream`?

Only additively, to parse new usage fields — no change to control flow, SSE event dispatch, or the
existing `text`/`toolCalls` extraction.

- **`readAnthropicStream`** (`session.ts:859-981`): the `message_start` handler
  (`session.ts:900-914`) currently reads `message.usage.input_tokens`. Anthropic's
  `message_start.message.usage` object also carries `cache_creation_input_tokens` and
  `cache_read_input_tokens` when caching is active. Extend the usage object built at
  `session.ts:905-911` (and the `message_delta` handler at `session.ts:931-943`, which currently
  only reads `output_tokens`) to also read and forward these two fields when present. No new event
  types, no change to `toolUseBlocks` handling (`session.ts:872-897`, `921-927`).
- **`readOpenAiStream`** (`session.ts:716-821`): the `chunk.usage` branch
  (`session.ts:780-790`) currently reads `prompt_tokens`/`completion_tokens`/`total_tokens`.
  OpenAI/Azure report `usage.prompt_tokens_details.cached_tokens` when caching is active — extend
  the `chunk` type annotation (`session.ts:742-755`) to include
  `prompt_tokens_details?: { cached_tokens?: number }` and forward it into the constructed
  `CompletionUsage`. No change to `toolCallAccumulator` handling (`session.ts:730`, `769-779`).

### 5.2 `CompletionUsage` / `AgentCorePromptResult.usage` extension

Add optional fields to both `CompletionUsage` (derived from `AgentCorePromptResult.usage`,
`types.ts:64-70`) and update `mergeUsage` (`session.ts:1001-1014`) to sum them across tool-loop
iterations exactly like `inputTokens`/`outputTokens` are summed today:

```ts
usage?: {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  provider?: string;
  model?: string;
  cacheReadTokens?: number;      // Anthropic cache_read_input_tokens / OpenAI-Azure cached_tokens
  cacheWriteTokens?: number;     // Anthropic cache_creation_input_tokens only (OpenAI/Azure don't report writes)
};
```

`mergeUsage` gains two more `base.x + next.x` lines guarded the same way `inputTokens` is (treat
absent as 0). This is purely additive to an already-optional field, so it does not change the
shape for callers who never enabled caching.

### 5.3 Does inserting cache markers change the tool-result-feeding logic?

No, by construction, for Anthropic and OpenAI/Azure. `buildAssistantToolCallMessage`
(`session.ts:1027-1051`) and `buildToolResultMessages` (`session.ts:1054-1075`) build
`extraRawMessages` entries, which per §4 are always in the **turnLocal / never-cached** tier — cache
markers are never attached to entries these two functions produce. The only touch point is that
`callCompletionApi` (called once per loop iteration at `session.ts:1205-1215`) must re-apply the
*same* stable-tier breakpoints (tools, system, optionally the fixed `baseMessages` prefix) on every
iteration, which it already does naturally since `request` (containing `customTools` and the system
message) is the same `NormalizedCompletionRequest` object across all iterations of one
`runCompletionLoop` call — no new per-iteration state is needed.

### 5.4 Gemini explicit caching does not fit today's per-call architecture

This is the one genuinely structural mismatch, and it needs its own subsection because it cannot
be solved by editing `callCompletionApi` alone:

- `callCompletionApi` is a stateless, single-request function — it builds a `url`/`headers`/`body`
  and calls `fetch` exactly once per iteration (`session.ts:681-686`). Anthropic and OpenAI/Azure
  caching fit this model because the "cache" is a passive server-side artifact keyed off request
  content — no separate resource to create, reference, or delete.
- Gemini explicit caching is a **stateful external resource**: `POST /v1beta/cachedContents` to
  create it (returns an id + `expireTime`), then every subsequent `generateContent` call references
  it via `"cachedContent": "cachedContents/{id}"`, and callers are billed **storage** for the
  resource's lifetime regardless of hit rate — so an unmanaged resource is a live cost leak, not
  just a missed optimization.
- This resource's lifecycle spans multiple `runCompletionLoop` calls (potentially multiple
  `session.prompt()` calls sharing one `AgentCoreSessionHandle`), which is a different lifetime
  than anything `AgentCoreSessionHandle` (`session.ts:1077` onward) currently manages — the handle
  today has no "session-scoped external resource that must be cleaned up" concept at all (compare
  to `activeAbortController`, which is per-loop-call, not per-session).
- Recommendation (not designed in full here, flagged as follow-up work gated on Gemini endpoint
  support existing at all per §3.4): introduce a small resource-lifecycle helper — e.g.
  `GeminiCacheHandle` created lazily on first use of a session with
  `promptCaching.gemini.mode === "explicit"`, held on `AgentCoreSessionHandle` alongside
  `activeAbortController`, and explicitly disposed (`DELETE /v1beta/cachedContents/{id}`) in a new
  `session.dispose()`/`close()` path. No such disposal path exists on `AgentCoreSessionHandle`
  today — introducing session-level `dispose()` is itself a small breaking-adjacent addition (an
  optional method, not a required lifecycle change) that should be scoped and reviewed
  independently of vendor request-shaping. Per the no-fallback rule, if a caller sets
  `mode: "explicit"` without a mechanism to guarantee disposal (e.g. process exit without cleanup),
  the plan should surface a loud warning at minimum, not silently leak the resource.

## 6. Testing strategy

### 6.1 Unit tests per vendor request-builder

Colocate with existing `session.ts` tests (find via the package's `packages/genty/core` test
directory — mirror existing suite naming). For each provider branch:

- **Anthropic**: assert `system` is a bare string when `promptCaching` absent/disabled (regression
  guard for the byte-identical requirement in §1); assert `system` becomes a one-element array with
  `cache_control: { type: "ephemeral" }` when `breakpoints` includes `"system"`; assert the last
  tool in `buildAnthropicTools` output carries `cache_control` and earlier tools do not, when
  `breakpoints` includes `"tools"`; assert a request with 5 conceptual breakpoints requested throws
  before hitting the network (validates the 4-breakpoint cap from §3.1); assert `ttl: "1h"` is
  forwarded as `cache_control.ttl` only when configured, defaulting to no `ttl` field (Anthropic's
  own default) otherwise.
- **Azure/OpenAI**: assert body has no new fields when `promptCaching` absent; assert
  `prompt_cache_key` appears only when `promptCaching.azure.promptCacheKey` /
  `promptCaching.openai.promptCacheKey` is set; assert `promptCaching.enabled: true` with no
  provider sub-config does **not** throw (the "automatic, no request change needed" no-op case from
  §3.2/§3.3, as opposed to Gemini's throw case).
- **Gemini (forward-looking)**: assert `promptCaching.gemini` set against a non-Gemini-resolved
  endpoint throws with the documented message from §3.4, proving the no-fallback guard exists even
  before full Gemini support lands. This test can be written and should pass today, before any
  other Gemini work exists.
- **`mergeUsage`**: unit-test that `cacheReadTokens`/`cacheWriteTokens` sum correctly across two
  merged `CompletionUsage` objects, including the case where one side is `undefined` (mirrors
  existing `inputTokens` merge tests).
- **Stream parsers**: feed a synthetic Anthropic SSE stream whose `message_start` includes
  `cache_creation_input_tokens`/`cache_read_input_tokens` into `readAnthropicStream` and assert
  they land in the returned `usage`; same for a synthetic OpenAI-shape chunk with
  `usage.prompt_tokens_details.cached_tokens` into `readOpenAiStream`.

### 6.2 Verifying cache hits in genty's own usage reporting

- Add a debug-log line (gated behind existing `process.stderr.write(...)` conventions already used
  in this file, e.g. `session.ts:318`, `345`) inside `runCompletionLoop` after `mergeUsage` when
  `aggregatedUsage.cacheReadTokens` is present and non-zero, printing a hit-rate-style ratio
  (`cacheReadTokens / inputTokens`). This gives operators observable confirmation without a new
  telemetry pipeline.
- For live/manual verification (per repo convention of live-stack validation over trusting local
  green — see `MEMORY.md` "Genty weak-model ceiling" and "Live-stack adapters install" entries):
  run two back-to-back prompts in the same session with a large, unchanged system prompt/tool set
  and confirm the second call's `usage.cacheReadTokens` is non-zero against a real Anthropic/OpenAI
  endpoint — this is the only way to confirm the vendor actually recognized the prefix, since
  local/unit tests can only prove genty-core sent the right shape, not that the vendor's cache
  logic accepted it.

## 7. Rollout plan

Phased by implementation risk and external dependency surface, cheapest/most-isolated first:

1. **Phase 1 — Anthropic.** Pure additive request field, no external resource lifecycle, single
   provider branch (`session.ts:639-656`), immediately testable against the real API. Ship behind
   `promptCaching.enabled` (default `false`) so existing sessions are unaffected. Add the
   `cacheReadTokens`/`cacheWriteTokens` usage fields and stream-parser changes from §5.1/§5.2 in
   the same phase since Anthropic is the only vendor emitting a *write* counter today, and
   validating it end-to-end needs both sides.
2. **Phase 2 — OpenAI / Azure.** Automatic, no-request-change-required caching plus the optional
   `prompt_cache_key` hint (`session.ts:657-679`). Lowest implementation risk of all phases (no
   conditional body branching beyond one optional spread), but sequenced after Anthropic because
   the shared usage-field plumbing (§5.2) and its tests will already exist from Phase 1 and this
   phase only needs to add the `cached_tokens` read path, not invent the merge/report machinery.
3. **Phase 3 — Gemini implicit caching**, gated entirely on Gemini gaining a `ResolvedEndpoint`
   branch and its own stream reader (a prerequisite outside this plan's scope, §3.4). Once that
   prerequisite exists, implicit-mode caching is close to free (no request change, only
   `usage_metadata.cached_content_token_count` parsing) and should ship alongside/immediately after
   basic Gemini chat support lands, not as a separate large effort.
4. **Phase 4 — Gemini explicit caching**, last, because it requires new resource-lifecycle
   management (§5.4: create/reference/dispose against `POST/PATCH/DELETE /v1beta/cachedContents`)
   that has no analog in `AgentCoreSessionHandle` today. This phase should be scoped as its own
   design pass (a `GeminiCacheHandle` + `session.dispose()` addition) rather than an extension of
   the vendor-request-shaping work in Phases 1-3.

Feature-flag/metrics notes:

- `promptCaching.enabled` (default `false`) is itself the feature flag — no separate env-var gate
  is needed since the option is per-session and per-caller-controlled already, consistent with how
  other opt-in behaviors on `AgentCoreSessionOptions` work today (e.g. `customTools`,
  `modelAttestationKey`).
- The debug-log hit-rate line from §6.2 is the initial "metrics" surface; if usage grows, promoting
  it to a structured `AgentCoreSessionEvent` (the existing `emit()` mechanism at
  `session.ts:1377-1380`, used for `text_delta`/`tool_use`/`tool_result` today) is the natural next
  step — e.g. a `cache_usage` event alongside the existing ones — but is not required for initial
  rollout since `usage` is already returned synchronously from `prompt()`.

## 8. Open questions / risks

- **Anthropic parallel fan-out cold-start.** If a caller fires multiple `session.prompt()` calls
  concurrently with an identical stable prefix, all of them can miss the cache (a write is only
  readable by other requests once the first response begins streaming). `AgentCoreSessionHandle`
  is single-session/single-loop (`this.activeAbortController` is a single field, `session.ts:1083`)
  so this only matters if a *caller* runs multiple sessions/handles concurrently with the same
  system prompt/tools — worth documenting as a known limitation rather than solving in genty-core,
  since genty-core has no visibility into sibling sessions.
- **Byte-exact prefix sensitivity.** Any of `customTools`, `systemPrompt`, or `appendSystemPrompt`
  changing between prompts on the same session invalidates the entire cached prefix (all vendors).
  Since `appendSystemPrompt` is explicitly documented as "additional... segments appended before
  dispatch" (`types.ts:115-116`) and could vary per-call in caller code, callers who want to
  benefit from caching need to be told (in the config's JSDoc) to keep these stable across a
  session's lifetime — this is a documentation/API-contract risk, not a code risk.
- **Gemini storage billing for explicit caches.** Per the vendor research, explicit caching bills
  storage per-token-per-hour for the life of the cache regardless of reuse, which can cost *more*
  than no caching for low-reuse workloads. The `GeminiCacheHandle` design in §5.4 must default to
  short TTLs and/or require explicit opt-in per session rather than a global default, to avoid
  surprising operators with idle storage costs — this should be a design constraint carried into
  Phase 4, not solved here.
- **`prompt_cache_key` cardinality (OpenAI/Azure).** OpenAI's docs note caching scope is
  per-organization; a `promptCacheKey` set to something highly unique per call (e.g. a random UUID
  per prompt) would effectively partition the cache away from reuse. The config JSDoc should warn
  callers to set a stable key (e.g. per-session, per-agent-role) rather than per-call.
- **Whether `"history"` breakpoints (§3.1 item 3, §4) are worth the complexity.** Unlike system/
  tools, the conversation history grows every turn, so a naive "tag the last message" strategy
  needs care about *which* message is tagged (the last one **before** the current turn's volatile
  tail) to avoid constantly moving the breakpoint and forcing cache-write churn instead of reuse.
  This plan recommends shipping tools+system breakpoints first (Phase 1) and treating history
  breakpoints as an experimental follow-up gated on real usage data showing history reuse is
  actually happening across prompts (not just within one tool loop, where it's free per §4's
  gotcha analysis).
- **No current Gemini support at all.** This plan's Gemini sections (§3.4, §5.4, Phases 3-4) are
  necessarily speculative about the exact `ResolvedEndpoint`/stream-reader shape, since that
  prerequisite doesn't exist. They should be revisited once/if a genty-core Gemini integration
  design exists, rather than treated as final.
