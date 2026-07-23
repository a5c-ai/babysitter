# Communication specialization

Processes for communication work: channel management (Slack/Discord), content
production and validation, and governed multi-audience announcements. The
specialization layers a flagship orchestrated pipeline over four Style-B
persona point files.

## Flagship

`multi-audience-announcement-pipeline.js` — end-to-end governed announcement
flow: source-material intake -> single canonical fact sheet -> `ctx.parallel`
per-audience variants (internal, customers, press, partners) -> adversarial
claim-trace/tone/cross-audience-drift gate -> per-audience routed approvals
(frozen audience->expert map) -> policy-gated sends -> delivery confirmation;
kip recall at intake and assert at close (kind `communication`).

Policy-gated actions:

| actionId | Audiences covered | Expert |
| --- | --- | --- |
| `internal-broadcast` | internal | `exec-sponsor` |
| `external-comms-send` | customers, partners (single gate covering both variants) | `comms-lead` |
| `press-release-publish` | press | `comms-lead` |

## Point files

- `slack-manager.js` — Slack-manager persona: scan channels/unanswered mentions,
  classify each (respond / moderate / escalate / notify), draft per-mention
  responses in parallel, send via `@slack/web-api` ad-hoc code.
- `discord-manager.js` — Discord counterpart: scan server/unanswered mentions,
  classify, draft and execute per-mention actions in parallel via `discord.js`.
- `content-writer.js` — brief -> plan -> draft -> self-edit persona; drives the
  flagship's per-audience drafting stage.
- `content-validator.js` — 5-axis devil's-advocate review (clarity, audience
  perspectives, ambiguity, metaphors, consistency); drives the flagship's
  tone-audience critic.

Note: the flagship composes these point files BY NAME as draft/send-stage
executor personas in task prompts — there are no ESM imports of point files.

## Shared combinators

The flagship depends on `../common-utilities/routed-gate-combinators.js`
(`routedBreakpoint`, `adversarialGate`, `kipRecall`, `kipAssert`,
`gateFixerTask`).

## Governance model

Fail-closed policy gates: `breakpointId` equals the `actionId`, send executors
run ONLY inside `approved === true` guards, and every outcome — including
skipped gates on a failed accuracy gate and non-interactive auto-approvals —
is recorded in `outputs.gatedActions`. One audience's rejection records the
decision and never blocks the other audiences.
