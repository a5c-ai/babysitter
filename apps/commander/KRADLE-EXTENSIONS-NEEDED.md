# KRADLE-EXTENSIONS-NEEDED — what Commander needs that kradle does not (yet) provide

> **Purpose & scope.** Commander is being re-modeled onto kradle's REAL CRD + BFF model
> (`SPEC-KRADLE-MODEL.md`). In doing so, several Commander concepts have **no kradle counterpart**.
> This is a **requirements doc for a SEPARATE, later kradle effort** — **kradle is NOT edited now**
> (it lives in the MAIN checkout `packages/kradle`, not on this branch). For **each** gap below:
> (a) **what kradle would add** (new CRD field / status / BFF route / controller behavior),
> (b) **why Commander needs it**, (c) the Commander-side **INTERIM** used until kradle ships it —
> one of: **conform** (bend Commander to kradle's existing shape), **derive-from-labels** (compute
> it from a `commander.a5c.ai/*` label convention), or **document-gap** (render a disabled/empty
> affordance with a "kradle-gap" tooltip).
>
> All "INTERIM via labels" use the reserved Commander label namespace **`commander.a5c.ai/*`** on
> kradle resources; these are UI conventions kradle ignores, never a fork of the schema.
> Citations `file:line` are against the MAIN checkout (`packages/kradle/...`) and Commander
> (`apps/commander/...`).

---

## Summary table

| ID | gap | kradle add | Commander INTERIM |
|---|---|---|---|
| **E-LIFECYCLE** | no board-column / kanban lifecycle on a run | `AgentDispatchRun.status.boardColumn` + transitions | derive-from-phase+labels (§4.2 of the model) |
| **E-RELEASE-RAIL** | no merged / staging / in-production release states | release-rail status enum + `AgentRelease` CRD | derive-from-labels (`/merged`,`/release-id`) |
| **E-HUMAN-REVIEW** | human-review is an approval gate, not a first-class routed lane/role | first-class human-review routing on `AgentApproval`/run | conform to `AgentApproval` + `human-review` column |
| **E-RUNACTIONS** | `resume`/`fork`/`continue` run actions not live | implement the proposed typed routes | document-gap (disabled buttons) |
| **E-ATTEMPT-API** | no list/watch of `AgentDispatchAttempt` per run | typed attempts list + watch plural | conform via generic `?kind=AgentDispatchAttempt` |
| **E-CARD-ORDER** | no backlog ordering / priority field | `spec.priority` or `status.queuePosition` | derive-from-labels (`/order`) |
| **E-SUBTASK** | no parent/child run decomposition link | `spec.parentRunRef` (or reuse work-item links) | derive-from-labels (`/parent`) |
| **E-YOLO** | no per-run auto-approve flag | `spec.approvalPolicy.autoApprove` | derive-from-labels (`/yolo`) |
| **E-PROCESS-TEMPLATE** | no per-taskKind phase-pipeline template resource | `AgentProcessTemplate` CRD | document-gap (Commander-local template) |
| **E-CARD-DISPLAY** | no human title / description / progress on a run | `spec.title`/`spec.description`, `status.progress` | derive (sourceRefs/annotations) + step-function progress |
| **E-WS-SNAPSHOT-LINK** | run↔workspace link is by name only | `KradleWorkspace` ↔ run back-reference + dirty rollup | conform (`spec.workspaceRef`) + client join |
| **E-REVIEW-ARTIFACT** | "review artifact" is split across `Review`+`KradleArtifact` | a unified `AgentReviewArtifact` (optional) | conform (read `Review` ∪ `KradleArtifact(kind:review)`) |
| **E-DISPATCH-RICH** | dispatch route ignores prompt/contextLabels/workspacePolicy | accept the full `api-contract-spec.md` dispatch body | conform (send the live subset) + document-gap |
| **E-EVENTS-FILTER** | agent SSE not filterable by run/kind | query-param filters on `…/events/stream` | conform (client-side filter) |

---

## E-LIFECYCLE — a board-column / kanban lifecycle concept on a run

- **What kradle would add.** A `status.boardColumn` (or `status.lane`) enum on `AgentDispatchRun`
  with a controller-owned transition model, e.g.
  `backlog → do → ai-review → human-review → approved → merged → in-production`, plus a typed
  move/transition route (`POST /api/orgs/<org>/agents/runs/<run>/transition {to}`).
- **Why Commander needs it.** Commander IS a kanban board: `ColumnId` has seven lanes
  (`apps/commander/src/game/board.ts:14`) and the whole UX is column-driven. kradle's run has only a
  flat `status.phase` (`pending|queued|running|waiting-for-approval|succeeded|failed|cancelled`,
  `core/docs/agents/agent-stack-management-spec.md:277`) — there is **no lane/column** notion and no
  user-driven board move. Dispatching-design mentions "board columns" only as an abstract issue-board
  idea (`core/docs/agents/dispatching-design.md:87`), never a CRD field.
- **Commander INTERIM — derive-from-phase+labels.** Map `status.phase` → `ColumnId` deterministically
  (`SPEC-KRADLE-MODEL.md` §4.2) and refine with `commander.a5c.ai/*` labels for the lanes kradle
  cannot express (`approved`/`merged`/`in-production`). User board moves are **local board state +
  label writes**, not a server transition, until the route exists.

## E-RELEASE-RAIL — merged / staging / in-production release states

- **What kradle would add.** Either (a) extend the run lifecycle with `merged` / `in-production`
  terminal-plus states, or (b) a dedicated **`AgentRelease`** CRD (a "release train" grouping runs
  shipped together) with `status.environment ∈ {staging,production}` and `releasedAt`, referenced by
  runs.
- **Why Commander needs it.** Commander has an explicit release rail: cards flow
  `approved → merged → in-production`, a `release()` order ships ALL merged cards as a train, and
  cards carry `releaseId` + `compacted` (`apps/commander/src/game/store.ts:1600-1603`,
  `apps/commander/src/backend/mock/simulation.ts:253-256`). kradle has **no** merged/production phase
  and **no** release-train entity (the closest anchors are `Deployment`/`Environment`, which are
  org-sibling infra, `core/docs/agents/org-route-resource-model-spec.md:72-85`, not run states).
- **Commander INTERIM — derive-from-labels.** `commander.a5c.ai/merged='true'`,
  `commander.a5c.ai/release-id=<id>` on the `AgentDispatchRun`; the `merged`/`in-production` columns
  and the release train are computed from these labels (`SPEC-KRADLE-MODEL.md` §4.2). `compacted` is
  pure UI timing.

## E-HUMAN-REVIEW — human-review routing as a first-class flow

- **What kradle would add.** First-class human-review **routing** on `AgentApproval` (or a sibling
  `AgentReviewRequest`): a `spec.reviewLane`/`assignee`/`role` so a run can be *routed to a named
  human/team for review* (not merely "blocked on an approval"), with a "human-review" lifecycle the
  board can render and a routed inbox.
- **Why Commander needs it.** Commander has a dedicated **Human Review** lane and panel
  (`apps/commander/src/components/panels/ReviewPanel.tsx`, `human-review` column with legal moves
  `human-review → do|ai-review|approved`, `apps/commander/src/game/board.ts:30`) and a per-card human
  assignee. kradle models the human gate only as an `AgentApproval` (`requestedBy`/`action`,
  `packages/kradle/charts/crds/aggregated-resources.yaml:896`) + an approvals **inbox**
  (`core/docs/agents/dispatching-design.md:107`) — there is no *routing-to-a-reviewer* lane or role.
- **Commander INTERIM — conform.** Treat the `human-review` column as "the run has a pending
  `AgentApproval` of action `write-back`/`release`/`tool-use`"; surface it in the Review panel and
  the Approvals registry tab; decide via the live `…/approvals/<name>/decide`
  (`packages/kradle/web/app/api/orgs/[org]/agents/approvals/[name]/decide/route.js`). Reviewer
  *assignment* is dropped (it was part of the removed roster) until kradle adds routing.

## E-RUNACTIONS — resume / fork / continue run actions

- **What kradle would add.** Implement the **already-specified-but-not-live** typed routes
  `POST /api/orgs/<org>/agents/runs/<run>/{resume,fork,continue}` (`core/docs/agents/api-contract-spec.md:152-154`),
  each creating a new `AgentDispatchAttempt` with the matching `attemptReason`
  (`resume|fork|continuation`, `core/docs/agents/crd-schema-spec.md:236`).
- **Why Commander needs it.** The run-action footer mirrors kradle's own
  (`packages/kradle/web/app/components/agent/run-actions.jsx`) and the dispatching design lists
  "cancel, retry, resume, fork, continue" as run controls
  (`core/docs/agents/dispatching-design.md:54`). Only **cancel** (`…/runs/<run>/cancel`) and
  **retry = re-dispatch** are live today; `resume/fork/continue` routes do not exist.
- **Commander INTERIM — document-gap.** Render `Resume`/`Fork`/`Continue` as **disabled** buttons
  with a "kradle-gap: route not yet available" tooltip (`SPEC-KRADLE-MODEL.md` §5.4). `Cancel` and
  `Retry` work against the live routes.

## E-ATTEMPT-API — list / watch attempts per run

- **What kradle would add.** A typed `GET /api/orgs/<org>/agents/runs/<run>/attempts` and a stable
  `AgentDispatchAttempt.spec.agentDispatchRun` back-reference + a watch plural
  `…/watch/orgs/<org>/agentdispatchattempts`, so the Run→Attempt→Session tree is cheaply queryable.
- **Why Commander needs it.** The whole point of this cut is to surface the
  **Run → Attempt → Session** hierarchy (`SPEC-KRADLE-MODEL.md` §4.1). The `AgentDispatchAttempt`
  CRD exists (`packages/kradle/charts/crds/aggregated-resources.yaml:748`) but there is **no typed
  per-run attempts endpoint** — only generic resource listing.
- **Commander INTERIM — conform.** List attempts via the generic gateway
  `GET /api/orgs/<org>/resources?kind=AgentDispatchAttempt` and group client-side by
  `spec.agentDispatchRun` (`SPEC-KRADLE-MODEL.md` §3.1, §4.1). Watch via the generic
  `…/watch/orgs/<org>/agentdispatchattempts` plural.

## E-CARD-ORDER — backlog ordering / priority

- **What kradle would add.** A `spec.priority` (or `status.queuePosition`) on `AgentDispatchRun` so
  the backlog has a stable server-side order, plus a reorder action.
- **Why Commander needs it.** `SimCardView.order` drives backlog rendering and the `prioritize()`
  order bumps a card to the top of its lane (`apps/commander/src/backend/mock/simulation.ts:235`,
  `apps/commander/src/game/store.ts:1587`). kradle runs have no ordering/priority field.
- **Commander INTERIM — derive-from-labels.** `commander.a5c.ai/order=<int>`; absent it, sort by
  `metadata.creationTimestamp` (`SPEC-KRADLE-MODEL.md` §4.3). `prioritize()` writes the label.

## E-SUBTASK — parent/child run decomposition

- **What kradle would add.** A `spec.parentRunRef` on `AgentDispatchRun` (or first-class use of
  `WorkItemSessionLink`/`WorkItemWorkspaceLink` for run decomposition) so a run can be a child of
  another run.
- **Why Commander needs it.** Cards stack: `parentId`/`childIds` and the card editor's `parentId`
  (legal only in backlog) model sub-tasks (`apps/commander/src/backend/mock/simulation.ts:241-242`,
  `:473`). kradle's run has no parent link; `childSubagentRuns` (`core/docs/agents/agent-stack-management-spec.md:280`)
  is **subagent** fan-out within one run, not user-decomposed sibling cards.
- **Commander INTERIM — derive-from-labels.** `commander.a5c.ai/parent=<runName>`; children are runs
  whose parent label points back (`SPEC-KRADLE-MODEL.md` §4.3).

## E-YOLO — per-run auto-approve

- **What kradle would add.** `spec.approvalPolicy.autoApprove: boolean` on the run (auto-resolve
  review/write-back gates) — distinct from the stack-level `approvalMode: yolo`.
- **Why Commander needs it.** `SimCardView.yolo` + `setYolo()` flip per-card auto-approve ("passing
  AI review auto-approves", `apps/commander/src/game/store.ts:1592`). kradle has stack-level
  `approvalMode` (`yolo|prompt|deny|policy-derived`,
  `packages/kradle/web/app/components/agent/stack-builder.jsx:6`) but **no per-run override**.
- **Commander INTERIM — derive-from-labels.** `commander.a5c.ai/yolo='true'`; `setYolo()` writes it;
  the §4.2 review-column logic honors it (`SPEC-KRADLE-MODEL.md` §4.2-4.3).

## E-PROCESS-TEMPLATE — per-taskKind phase-pipeline template

- **What kradle would add.** An `AgentProcessTemplate` CRD: a reusable, versioned phase pipeline per
  `taskKind` (`commander/<kind>@vN`), so the run-observation phases are a declared template, not
  ad-hoc.
- **Why Commander needs it.** Commander has process templates with revisions + a process editor that
  bumps revisions (`SimProcessTemplateView`, `updateProcessTemplate()`,
  `apps/commander/src/backend/mock/simulation.ts:502`, `apps/commander/src/game/store.ts:1614`).
  kradle has no phase-template resource — phases are derived from the run's conditions/attempt
  timeline (`core/docs/agents/agent-stack-management-spec.md:351`).
- **Commander INTERIM — document-gap.** Keep the process template as **Commander-local** config
  (mock-seeded / derived), with a note that it is not a kradle resource; the run-observation phases
  in real mode are derived from `status.conditions` + attempt timings (`SPEC-KRADLE-MODEL.md` §4.4).

## E-CARD-DISPLAY — human title / description / progress on a run

- **What kradle would add.** `spec.title`, `spec.description`, and a `status.progress` (0..1) on
  `AgentDispatchRun` for direct card rendering.
- **Why Commander needs it.** `SimCardView` needs `title`/`description`/`progress`
  (`apps/commander/src/backend/mock/simulation.ts:231,240,252`). kradle runs carry no human title or
  numeric progress — only `repository`/`taskKind`/`sourceRefs` and a phase.
- **Commander INTERIM — derive.** `title = sourceRefs.pullRequest ?? repository+':'+taskKind ?? name`;
  `description` from `sourceEvent`/annotations; `progress` as a deterministic step-function of
  phase (`Running→0.5`, `Succeeded→1`, else `0`) — no rng (`SPEC-KRADLE-MODEL.md` §4.3).

## E-WS-SNAPSHOT-LINK — run ↔ workspace link + dirty rollup

- **What kradle would add.** A `KradleWorkspace.status` back-reference to its run(s) and an
  aggregate dirty/uncommitted rollup, so the workspaces registry can show per-card git lines without
  a client-side join.
- **Why Commander needs it.** `SimWorkspaceSummaryView` shows per-card git status + active sessions
  across a workspace (`apps/commander/src/backend/mock/simulation.ts:431-445`). The real
  `KradleWorkspace` (`packages/kradle/charts/crds/agent-resources.yaml:1765`) has a bare
  preserve-unknown `status` and the run→workspace link is one-way (`run.spec.workspaceRef`).
- **Commander INTERIM — conform + client join.** Join runs to workspaces on `spec.workspaceRef`
  client-side; compute the dirty rollup from each run's `KradleArtifact` patch `fileList`
  (`SPEC-KRADLE-MODEL.md` §4.4).

## E-REVIEW-ARTIFACT — unified review artifact

- **What kradle would add.** (Optional) a unified `AgentReviewArtifact` CRD as named in the
  relationship map (`core/docs/agents/resource-relationship-map.md:48,62`), instead of splitting
  review output across `Review` (`packages/kradle/charts/crds/aggregated-resources.yaml:303`) and
  `KradleArtifact` (`:859`).
- **Why Commander needs it.** Commander's Review panel + write-back surface treats "the review
  output" as one thing (`apps/commander/src/contracts/kradle-workspace.ts` patch + review). Today
  it must read two kinds.
- **Commander INTERIM — conform.** Model review output as `Review ∪ KradleArtifact(kind:'review')`
  and present them as one panel (`SPEC-KRADLE-MODEL.md` §1.B, §4.4). No kradle change required to
  ship; the unified CRD is a nice-to-have.

## E-DISPATCH-RICH — full dispatch body

- **What kradle would add.** Make the live dispatch route honor the **full** documented body —
  `prompt`, `contextLabels`, `workspacePolicy`, `writeBackPolicy`, `sourceRefs`
  (`core/docs/agents/api-contract-spec.md:122-135`) — not just
  `{agentStack|agentDefinition, repository, ref, taskKind, actor, meetingRef}`
  (`packages/kradle/web/app/api/orgs/[org]/agents/dispatch/route.js:21-30`).
- **Why Commander needs it.** The dispatch composer (`ui-flow-spec.md:107-116`) wants to pass
  prompt + context labels + workspace mode at dispatch time; Commander's commission flow collects
  these.
- **Commander INTERIM — conform + document-gap.** Send only the live subset today; stash the extra
  composer fields as `commander.a5c.ai/*` annotations on the created run for display, and note the
  richer body as a kradle gap.

## E-EVENTS-FILTER — filterable agent event stream

- **What kradle would add.** Query-param filters (`?run=`/`?kind=`/`?since=`) on
  `GET /api/orgs/<org>/agents/events/stream` so a client can subscribe to one run's events.
- **Why Commander needs it.** Commander focuses a single card/run and wants only that run's frames;
  the live stream is org-wide (`packages/kradle/web/app/api/orgs/[org]/agents/events/stream/route.js`,
  generic watch is per-plural not per-run, `packages/kradle/web/app/api/watch/[[...resource]]/route.js`).
- **Commander INTERIM — conform.** Subscribe to the org stream and **filter client-side** by run
  name; the snapshot remains the single source of truth and frames only trigger a debounced refresh
  (`SPEC-KRADLE-MODEL.md` §3.3; `apps/commander/src/backend/real/realBoot.ts:14`).

---

## Out of scope for this requirements doc (explicitly NOT gaps)

- **Personas (`AgentPersona/Soul/Appearance/VoiceProfile/AgentDefinition`).** Present in kradle
  (`packages/kradle/charts/crds/agent-resources.yaml:178-426`) but Commander dispatches by stack and
  has no persona system — Commander simply does not use them (`SPEC-KRADLE-MODEL.md` §1.A aside). Not
  a gap.
- **Company-brain memory model.** Already covered by real kinds
  (`AgentMemoryRepository/Source/Ontology/Snapshot/Query/Update`,
  `packages/kradle/charts/crds/{agent,aggregated}-resources.yaml`) and the live
  `/api/orgs/<org>/agents/memory/query`. Commander conforms; no extension needed.
- **`status.phase` enum.** Commander was wrong (`Ready|Pending|Failed`); kradle is right
  (`[Pending,Ready,Blocked,Error]`). This is a **Commander fix** (`SPEC-KRADLE-MODEL.md` §2.1), not a
  kradle gap.
