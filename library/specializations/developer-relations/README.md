# developer-relations

The **first developer-relations specialization** in the library. Before it, the only devrel
artifact anywhere was a single stub agent
([`../sdk-platform-development/agents/devrel/AGENT.md`](../sdk-platform-development/agents/devrel/AGENT.md),
marked *implementation pending*) — referenced here as the seed, left in place, never edited.
This specialization is additive: its personas are new `devrel-*` agents defined inline in the
flagship process. It carries one product change end-to-end — from API-change intake through
executed sample apps, adversarially verified content, policy-gated external publishing, and
community engagement — with routed human approval on every action that leaves the org
boundary.

## Flagship process: devrel-campaign

`devrel-campaign.js` (`@process developer-relations/devrel-campaign`) walks one product change
through the whole campaign. Every subtask is `kind:'agent'` (no shell subtasks — repo
override); combinators are reused from
[`../common-utilities/routed-gate-combinators.js`](../common-utilities/routed-gate-combinators.js).

| Phase | What happens |
|---|---|
| 0 | `kipRecall` at intake (kind `developer-relations`) — prior devrel content on these APIs, recurring community questions/FAQs, past sample-app patterns thread into every later task. Empty store = fresh brain, never an error. Validation throws on a `productChange` missing `id`, `title`, or a non-empty `changedApis` array |
| 1 | `dvr.intake` — inventories changed APIs against `apiSurfaceRef`, derives/validates `sampleAppSpecs[]` (one runnable app per key capability), produces the `contentPlan` (blog/tutorial/video-script angles); flags `openQuestions` without blocking. A derived spec missing a runnable build+run command throws before any build |
| 2 | `dvr.build-sample-app` — `ctx.parallel.all` over `intake.sampleAppSpecs`. Each build follows the docs and MUST actually build **and run** the app, capturing stdout/stderr/exit code to `runOutputPath`. `built:false` or a non-zero exit is recorded honestly (no green-by-assertion, no fallback stub) |
| 3 | **Adversarial sample-app accuracy gate** — `adversarialGate` (`developer-relations.sample-app-accuracy`). Critics independently RE-RUN every sample against the current API surface and cross-check every API call. **A failed gate returns `success:false` before any approval/publish** |
| 4 | `dvr.produce-content` — 3-way `ctx.parallel.all` over `CONTENT_PIECES`. Each piece is drafted ONLY from the executed samples + intake; every snippet is lifted from a sample that actually ran. Composes the technical-documentation point tasks + content-writer persona **by name** |
| 5 | **Adversarial content technical-accuracy gate** — `adversarialGate` (`developer-relations.content-accuracy`). Critics EXTRACT and EXECUTE every code snippet and cross-check every technical claim against the sample-app run output + current docs. **A failed gate returns `success:false` before any approval/publish** |
| 6 | Policy-gated **sample-app repo publish** — `routedBreakpoint` `sample-app-repo-publish` (devrel-lead); on `approved===true` `dvr.publish-sample-app` pushes/updates the public sample repo |
| 7 | Policy-gated **external content publish** — `routedBreakpoint` `external-content-publish` (devrel-lead), ONE approval covering all three pieces; on `approved===true` `dvr.publish-content` runs per piece via `ctx.parallel.all`, each via the named channel persona. Honors `embargoUntil` (early publish = failure, not retry) |
| 8 | Community triage — `dvr.setup-community-triage` scans `communityThreadsDir`, matches threads against the new content + kip FAQs, and DRAFTS replies (no send). `routedBreakpoint` `community-reply-send` (community-manager) gates the outbound **only when `repliesDrafted > 0`**; on `approved===true` `dvr.send-community-replies` posts them. Zero threads records a no-op, never fabricates threads |
| 9 | `dvr.engagement-retro` consolidates the outcomes into a retro doc; `kipAssert` (kind `developer-relations`) captures content outcomes (with approval provenance), sample-app accuracy results, the content gate outcome, new FAQs, and community-thread outcomes. Assert failures are reported by the librarian task, never swallowed |

**Inputs:** `{ productChange: {id, title, summary, changedApis[] (non-empty), docsRefs[], sampleAppSpecs?, sourceMaterials?, embargoUntil?} (required), repoRoot?='.', apiSurfaceRef?='docs/', contentChannels?, communityThreadsDir?='artifacts/community/inbox', sampleRepoTarget?, maxFixAttempts?=2, kipEnabled?=true, kipDir?='.a5c/kip', kipModel?='sonnet' }`

**Outputs:** `{ success, intake, sampleApps, sampleAppGate, content, contentGate, gatedActions, publishes, communityTriage, retro, kipFactsAsserted, artifacts, metadata }` — `success = sampleAppGate.passed && contentGate.passed && every gatedActions record satisfies (!required || approved === executed)`. A failed sample-app **or** content gate returns `success:false` before any publish/approval, with all three gated actions recorded as skipped.

## Executed-evidence quality gates

Both accuracy gates run through the `adversarialGate` combinator and demand **executed
evidence** — read-only review is a protocol failure:

- **`developer-relations.sample-app-accuracy`** — `sample-execution-critic` (RE-RUNS every
  sample against the current surface, captures its own stdout/exit) + `api-currency-critic`
  (re-extracts every API call and matches it against `apiSurfaceRef`; any deprecated/removed/
  hallucinated call fails). Fixer: built-in `gateFixerTask` edits the offending sample.
- **`developer-relations.content-accuracy`** — `snippet-execution-critic` (extracts and runs
  every snippet, captures output) + `claim-cross-check-critic` (builds a claim-trace table;
  any claim with no evidence source or contradicting the sample run output fails). Fixer:
  built-in `gateFixerTask` edits the offending piece.

Critic independence is enforced by the combinator (fresh parallel instances; producers never
review their own work). `passed:true` with an empty evidence array is coerced to a protocol
failure. Each critic prompt pins the exact verdict JSON shape `{ passed, issues[], evidence[] }`
at its end (prior insight: 3/12 critics drifted shape). On fix-budget exhaustion the combinator
raises `developer-relations.sample-app-accuracy.gate-escalation` /
`developer-relations.content-accuracy.gate-escalation` (expert `owner`), pushed to
`metadata.breakpointsHit`.

## Policy-gated actions

All approvals go through `routedBreakpoint`; for the three policy-gated actions the
`breakpointId` **equals** the actionId and tags are `['policy-gated','developer-relations']`,
strategy `'single'`. Fail-closed: the executor task runs **only** on `approved === true` — a
rejection is honored, recorded, and never worked around.

| actionId | expert | when | fail-closed behavior |
|---|---|---|---|
| `sample-app-repo-publish` | devrel-lead | Phase 6, always (after both accuracy gates pass) | `dvr.publish-sample-app` runs only on `approved===true`; rejection records the decision and leaves the repo untouched |
| `external-content-publish` | devrel-lead | Phase 7, always — ONE approval covering all three pieces | `dvr.publish-content` (x3 via `ctx.parallel.all`) runs only on `approved===true`; `embargoUntil` honored (early publish = failure); each outcome audited |
| `community-reply-send` | community-manager | Phase 8, **only when `repliesDrafted > 0`** | `dvr.send-community-replies` runs only on `approved===true`; no send for any thread not covered by the approval; skipped/rejected recorded, never worked around |

`outputs.gatedActions` records **every** decision — `{ actionId, required, approved,
autoApproved, response, executed }` per action, including non-interactive auto-approvals
(recorded raw from the BreakpointResult) and skipped gates
(`{ required:false, approved:false, autoApproved:false, executed:false }` — never omitted).
`metadata.breakpointsHit` logs every raised breakpointId in order.

## Composition by name

The content pieces reuse existing library point tasks rather than re-implementing them —
`dvr.produce-content` composes, **by name**:

- [`technical-documentation/interactive-tutorials`](../technical-documentation/interactive-tutorials.js) — the tutorial piece (executable walkthrough).
- [`technical-documentation/how-to-guides`](../technical-documentation/how-to-guides.js) — the blog/how-to angle.
- [`technical-documentation/api-reference-docs`](../technical-documentation/api-reference-docs.js) — the reference sections.
- [`communication/content-writer`](../communication/content-writer.js) — the prose-drafting persona for each piece.

The gated-send skeleton follows
[`communication/multi-audience-announcement-pipeline.js`](../communication/multi-audience-announcement-pipeline.js):
the `recordGatedAction` audit shape, `routedBreakpoint(breakpointId = actionId, policy-gated
tag)`, fail-closed executors, a single shared external approval covering multiple outputs, the
executed-evidence gate, and the fail-closed early return on a failed gate.

## Parallel tracks

- `ctx.parallel.all` over `intake.sampleAppSpecs` — concurrent docs-driven sample-app builds (Phase 2).
- `adversarialGate` fans its critics out concurrently (Phases 3 and 5).
- `ctx.parallel.all` over `CONTENT_PIECES` — concurrent content production (Phase 4).
- `ctx.parallel.all` over `CONTENT_PIECES` — concurrent publish executors under the single `external-content-publish` approval (Phase 7).

## kip integration

`kipRecall` at intake (topic: prior devrel content on these APIs, recurring community
questions/FAQs, past sample-app patterns for `productChange.title`; kind
`developer-relations`) and `kipAssert` at close — content published-to channel with approval
provenance, sample-app accuracy results with `runOutputPath`, the content-gate outcome, new
FAQ candidates from triage, and community-thread outcomes with `community-reply-send`
provenance. Gated on `kipEnabled`; an empty store is a fresh brain, never an error; assert
failures are reported by the librarian task, never swallowed. See
[`../shared/skills/kip-librarian`](../shared/skills).

## No fallbacks

- Missing `productChange` / `id` / `title` / non-empty `changedApis` throws at Phase 0.
- Unknown keys in `contentChannels` throw against `CONTENT_PIECES` (never silently ignored).
- A derived `sampleAppSpecs` entry without a runnable build+run command throws before any build.
- `expertFor` / `actionFor` / `channelFor` are throwing lookups — no silent defaults.
- A failed sample-app or content gate ends the run with `success:false` before any external action; rejected gates are honored, never worked around.

## Usage

```bash
babysitter run:create \
  --process library/specializations/developer-relations/devrel-campaign.js \
  --inputs '{
    "productChange": {
      "id": "PC-3.4-webhooks",
      "title": "Signed webhook deliveries",
      "summary": "v3.4 adds HMAC signatures + a retry endpoint to the webhooks API.",
      "changedApis": ["webhooks.createEndpoint", "webhooks.verifySignature", "webhooks.retry"],
      "docsRefs": ["docs/webhooks.md"],
      "embargoUntil": "2026-08-01T09:00:00Z"
    },
    "apiSurfaceRef": "docs/",
    "contentChannels": { "blog": "devblog", "tutorial": "docs-site", "video-script": "youtube" },
    "sampleRepoTarget": "org/webhooks-samples",
    "communityThreadsDir": "artifacts/community/inbox",
    "maxFixAttempts": 2
  }'
```

## Files

- [`devrel-campaign.js`](./devrel-campaign.js) — the flagship process (8 `dvr.*` Style-A agent tasks + orchestration).
- Combinators: [`../common-utilities/routed-gate-combinators.js`](../common-utilities/routed-gate-combinators.js) — `routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`, `gateFixerTask`.
- Seed: [`../sdk-platform-development/agents/devrel/AGENT.md`](../sdk-platform-development/agents/devrel/AGENT.md) — the pre-existing devrel agent stub (referenced, not modified).
