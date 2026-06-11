# A5C Commander v2 — "The Aegis Cogitator" (delta spec)

**Relationship to SPEC.md:** this document EXTENDS SPEC.md. Everything in SPEC.md remains in force
(layout §4, interaction grammar §5, contracts §2/§7, test hooks §9, ACs 1–14, the frozen v1 e2e
suite, the dependency allowlist and path-only SVG rule) — EXCEPT where this document explicitly
overrides it. The only override is §V2-1 (visual direction replaces SPEC.md §10's dark-neon theme).
All v1 data-testids, command labels, and behaviors asserted by the frozen v1 suite must keep passing.

---

## V2-1. Look & feel — the Aegis Cogitator (overrides SPEC.md §10)

Steampunk clockwork cogitator, modeled on the reference plate: a warm **parchment field**
(aged-paper #e9dcbe family with faint gear watermarks and plate-border flourishes) framing deep
**slate-umber panels** (#22231e family) edged with **brass/gold ornament** (#b9913f family —
etched double borders, corner gears, rivet dots), **warm amber glows** (lamp-light, not neon),
and oval **amber "eye" indicators** for live status. Illustration surfaces (selection portraits,
memory cards, diff headers) read as **sepia hand-inked plates** on parchment cards. Typography:
serif display stack (`'Iowan Old Style', 'Palatino Linotype', Georgia, serif`) with small-caps
letter-spaced headers ("THE AEGIS COGITATOR" tone); numbers keep the mono accent. Faction accents
become jewel-toned **stained-glass tints over brass**: claude-code → verdigris teal glass,
codex → garnet glass, gemini-cli → amber glass, pi → peridot glass.

Unit avatars v2: **whimsical clockwork creatures** — gear-and-boiler bodies, brass limbs and
antennae, stained-glass wing/shell panels, expressive eyes (the mechanical-dragonfly /
walking-teapot spirit of the reference plate). Friendly, hand-drawn feel; still procedural,
path-only, byte-identical per id, crisp 24–64px. Task nodes become brass-ringed wax-seal badges.
Map floor: aged drafting-paper sepia with faint grid + gear watermarks; vignette stays; scanlines
are replaced by a ≤4%-effective paper-grain texture. HUD chrome: dark slate panels with brass
frames and parchment insets replace glass-neon; glows are warm amber. No emoji; no image assets;
no new dependencies — all ornament is CSS + inline SVG (path-only).

Everything geometric stays: SPEC.md §4 layout, hit targets, boot camera, staging rows, minimap
behavior, motion timings. This is a re-skin plus icon-style evolution, not a re-layout.

## V2-2. Deep contextual commands

The command card must fit the SPECIFIC context — task kind, session activity, run stage, approval
state, workspace dirt — not just lifecycle state. Context sources: `task.spec.taskKind`, the
unit's current process stage (§V2-5), pending approval kind (§V2-7), workspace dirty state.

Task kinds (sim must generate all): `implement`, `review`, `fix`, `root-cause-analysis`,
`polish`, `test-coverage`, `docs`, `deploy`, `research`, `migrate`.

Kind-specific command sets (shown for a unit WORKING that kind of task, layered above the v1
working staples Steer…/Pause/Inspect/Abort, ≤12 total — drop lowest-priority staples if needed,
but never Abort):
- review → `Approve Review`, `Request Changes`, `Add Comment`, `Open Diff` (jumps to Workspace tab)
- fix → `Run Tests`, `Root-Cause`, `Apply Patch`, `Rollback`
- root-cause-analysis → `Hypothesize`, `Bisect`, `Instrument`, `Conclude`
- polish → `Capture Plates` (screenshots), `Score`, `Apply Findings`
- implement → `Run Tests`, `Open Diff`, `Checkpoint`
- test-coverage → `Run Suite`, `Coverage Report`, `Add Cases`
- docs → `Preview`, `Spell-Gauge`, `Publish Draft`
- deploy → `Dry Run`, `Ship It`, `Hold the Line` (danger styling on Ship It)
- research → `Summarize`, `Cite Sources`, `Archive to Brain` (memory write, §V2-3)
- migrate → `Plan Steps`, `Execute Step`, `Verify Parity`
Selected TASK nodes likewise get kind-aware sets (e.g. review task: `Assign Reviewer`,
`Open Checklist`, plus v1 task staples). Every command intent must do something VISIBLE and
honest: a real sim verb where one exists; otherwise it advances task progress / emits labeled
sim events (e.g. `Run Tests` emits a tool_call_start/tool_result pair named vitest with a
deterministic pass/fail and progress bump).

Every CommandSpec carries a microagent-GENERATED icon: distinct procedural path-only glyph per
command id (brass-line engraving style per §V2-1). The v1 frozen labels for lifecycle staples
(`Dispatch…`, `Rally`, `Clone`, `Retire`, `Abort`, `Select All Idle`, `Jump to Alert`,
`Pause Sim`/`Resume Sim`) are unchanged for the selections the v1 suite exercises (pure idle
units, pure same-state selections, empty selection).

## V2-3. Memory system & visualization ("the Company Brain")

Mirror the kradle memory contracts (source-of-truth: `packages/kradle/core/docs/agents/`
`crd-schema-spec.md` + `memory-ontology-schema-spec.md`, and `packages/kradle/sdk` query API, in
the staging checkout):

- **Silo** = `AgentMemoryRepository` (spec: `repositoryRef`, `defaultBranch`, `layoutProfile`;
  status: `phase`, `currentCommit`, `indexDigest`) + its `AgentMemorySource` scoping
  (`appliesTo {repositories[], teams[]}`, `include {graphKinds[], paths[]}`, `maxContextBytes`).
- **Graph record** (verbatim shape): `{ nodeKind, id, attributes { title, status:
  'draft'|'approved'|'deprecated'|'archived', owners[], summary?, tags?, updatedAt },
  edges?: Record<edgeKind, {target}[]> }`. Node kinds: Repository, Team, Service, Package,
  Runbook, Decision, Incident, AgentPractice, Skill, Tool, Customer, ProductArea, Term,
  PromptFragment. Edge kinds: documents, implements, depends_on, supersedes, owned_by,
  applies_to_repo, applies_to_stack, mentions, derived_from, requires_secret, requires_config,
  safe_for_trigger, resolved_by.
- **Request** = `AgentMemoryQuery` (spec: `snapshotRef`, `requester {kind,name}`, `query { text,
  modes[], graph {kinds[], edgeDepth}, grep {paths[], maxMatches} }`) with `queryGraph()`-shaped
  results (`{ matches: [{record, score, edges[]}], totalMatches }`).
- **Send** = `AgentMemoryUpdate` (spec: `memoryRepository`, `sourceRun`, `updateKind:
  'proposed-pr'`, `baseCommit`, `branchName`, `changes [{path, action, reason}]`,
  `validationPolicy`; status: `phase`, `diffDigest`, `pullRequestRef`).

**Sim:** one unified graph of 40–60 records partitioned across 3–4 silos (by workspace/team —
each silo holds a subset; a few records replicated). Working units periodically REQUEST pieces
(AgentMemoryQuery against a silo; matched records enter the unit's held-pieces set) and on
completion SEND pieces back (AgentMemoryUpdate proposing changes). Both emit run.event-enveloped
sim-local payloads (`memory_query`, `memory_update`) for ticker/inspector, deterministic per seed.

**UI — the Archive overlay:** opened via TopBar button `data-testid="topbar-memory"` or `M` key;
full-screen parchment plate over the map (Esc closes; Esc cascade gains: archive > steer modal >
inspector > targeting > selection). Contents: silo cards (name, phase, commit short-sha, record
count, owning team) along one edge; a deterministic radial/clustered SVG graph of the unified
graph (nodes colored by nodeKind with engraved-glyph badges, edges drawn as `<path>` curves —
NEVER `<line>`/`<polyline>`, which stay reserved for the map LinkLayer; silo membership rendered
as tinted convex sector hulls or badge rings). Interactions: filter chips by nodeKind; click node
→ attributes card (title, status, owners, tags, summary); click silo card → focus/zoom its
sector; selecting a unit (before opening, or via a unit picker chip row) highlights pieces it
holds and dims the rest; live transfer events animate a pulse along the silo→graph-node path and
log to the ticker. All overlay testids: `memory-overlay`, `memory-silo-<name>`,
`memory-node-<id>` (id sanitized: ':' → '-'), `memory-filter-<kind>`.

## V2-4. Task hierarchy

`CommanderTask` gains CRD-faithful parent linkage: child tasks carry
`metadata.labels['kradle.a5c.ai/parent-task'] = <parent metadata.name>` (and parents carry
`spec.taskKind` as usual — any kind can parent). Sim generates 2–3 root objectives each with 2–4
children (one chain may nest a grandchild). Parent progress = mean of children progress; a parent
is `done` only when all children are. Map: children cluster in an arc around their parent with
engraved connector curves (`<path>`, never line/polyline); parent nodes render larger with a
child-count pip. SelectionPanel task view shows a hierarchy breadcrumb (root › … › task) and a
clickable children list with per-child state/progress. Dispatching units onto a PARENT
auto-assigns each to an open child (visible: assignment events + links to children). Right-click
dispatch onto a child behaves as v1.

## V2-5. Process-flow tab (babysitter run visualization)

Mirror the babysitter run-observation shapes (source-of-truth: `packages/sdk/src/runtime/` and
`storage/` in THIS repo): `JournalEvent { seq, ulid, type, recordedAt, data }` with event types
`RUN_CREATED | EFFECT_REQUESTED | EFFECT_RESOLVED | EFFECT_CANCELLED | RUN_COMPLETED |
RUN_HALTED | RUN_FAILED | PROCESS_RUNTIME_ERROR`; `ObservedRunState = created | waiting |
completed | halted | failed`; `EffectStatus = requested | resolved_ok | resolved_error |
cancelled`; `pendingEffectsByKind: Record<string, number>`; effect kinds
`node | breakpoint | orchestrator_task | sleep | subprocess | agent | shell | skill`.

**Sim:** every dispatched unit's work is modeled as a babysitter process run with named phases
derived from its task kind (e.g. fix → `reproduce → diagnose → patch → verify`; review →
`survey → annotate → verdict`; default → `plan → implement → verify → review`). Each phase emits
EFFECT_REQUESTED then EFFECT_RESOLVED journal events (deterministic timing); approval
hook.requests map to `breakpoint` effects (pendingEffectsByKind reflects them); run completes/
fails with the task. Journal kept per run (ring-capped ~100 events).

**UI:** the Inspector becomes tabbed: `Transcript` (v1 behavior, default,
`data-testid="inspector-tab-transcript"`) and `Process` (`data-testid="inspector-tab-process"`):
a brass stage-pipeline of phase chips (done = filled brass, current = glowing amber with gear
spinner, pending = etched outline), an ObservedRunState badge, pendingEffectsByKind chips (e.g.
`breakpoint ×1` pulsing when waiting), and a scrolling journal list (seq, type, short label,
clock time) newest-last with auto-follow. The unit's current stage ALSO shows as a small chip in
SelectionPanel single-unit view (`data-testid="sel-stage"`). Workspace tab: §V2-7.

## V2-6. Creation flows (the Foundry)

TopBar button `data-testid="topbar-create"` (or `N` key) opens the Foundry dialog
(`data-testid="foundry"`; Esc closes, top of Esc cascade alongside archive):
- **Commission Task** tab: choose taskKind (full §V2-2 list), title (default suggested
  deterministically), optional parent task (dropdown of existing tasks), workspace. Submit →
  sim verb `createTask` → new queued task node appears on the map in its workspace zone
  (deterministic id `adr-cXX-…` from a creation counter), ticker logs it, Foundry closes.
- **Forge Agent** tab: choose adapter (the 4 factions), name (deterministic suggestion,
  editable), model (per-adapter list from contracts). Submit → sim verb `createUnit` → unit
  spawns in the staging area with a fresh clockwork-creature portrait, ticker logs it.
Both verbs are deterministic given the same inputs+seed and emit run.event-enveloped sim-local
payloads (`task_created`, `unit_forged`). Created entities behave identically to seeded ones.

## V2-7. Workspace view & change approval

Mirror the workspace/review contracts (source-of-truth: kradle `crd-schema-spec.md`,
`workspace-lifecycle-spec.md`, `artifacts-writeback-spec.md`):
- `AgentWorkspaceStatus.gitStatus { branch, headSha, ahead?, behind?, dirty, uncommittedCount? }`
  and `phase: created|ready|missing|conflicted|archived`.
- **Patch artifact** `{ kind: 'patch', baseRef, targetBranch?, fileList[], diffDigest,
  patchObjectRef, testEvidence { status: 'passed'|'failed'|'unknown', summary? }, applyStrategy:
  'comment-only'|'branch-update'|'pr-update'|'local-workspace-only' }`.
- `AgentApproval` spec `{ dispatchRun, requestedBy {kind,name}, action {type, target, summary},
  policyReasons?[] }`, status `{ phase: pending|approved|denied|completed, decision?, feedback? }`.
- `AgentStack.writeBackPolicy { requireApproval, allowedTargets[] }` (sim stacks set
  `requireApproval: true`).

**Sim:** working units accumulate workspace changes: a deterministic changed-file list (paths
plausible per task kind; statuses A/M/D) where each file has a synthetic unified diff (5–25
lines, deterministic content referencing the task title) plus testEvidence. When the work phase
completes, the unit raises an `AgentApproval` (pending) for write-back instead of finishing
silently; `Approve & Apply` → patch applied (workspace clean, task → review→done, approval
phase=approved, events); `Request Changes` (with optional feedback) → approval denied + unit
returns to working with a feedback event and new diff iteration. These approvals are distinct
from v1 hook.request tool approvals and appear in the alerts slice tagged `kind: 'write-back'`.

**UI:** Inspector third tab `Workspace` (`data-testid="inspector-tab-workspace"`): header
(branch, short headSha, dirty badge with uncommittedCount, workspace phase, test evidence
chip), changed-file list (`data-testid="ws-file-<index>"`, status letter + path, additions/
deletions counts), click file → diff plate (sepia parchment: context ink-gray, additions
verdigris on pale green-tinted rows, deletions garnet on pale red-tinted rows, engraved line
numbers), and when an approval is pending: an approval bar with `Approve & Apply`
(`data-testid="ws-approve"`) and `Request Changes` (`data-testid="ws-reject"`). The workspace
zone label on the map shows a dirty-files count badge. AlertBanner write-back alerts deep-link
to this tab.

## V2-8. New acceptance criteria (each e2e-verifiable; authored as e2e/v2-*.spec.ts; the
v1 suite files are untouched and must keep passing)

AC15. Cogitator theme boots: body/background resolves to the parchment family, panels carry the
      brass-border custom property, display headers render the serif small-caps stack (assert
      via computed styles/CSS vars), and the v1 boot AC1 assertions still hold.
AC16. Deep context: a unit working a `review` task shows `Approve Review` and `Request Changes`
      in the command card; a unit working a `fix` task shows `Run Tests` and `Root-Cause`;
      every visible command cell contains an inline SVG icon.
AC17. Archive overlay: `M` (and topbar-memory) opens `memory-overlay` showing ≥3 silo cards and
      ≥30 `memory-node-*` elements; a nodeKind filter chip narrows visible nodes; clicking a
      node shows its attributes card (title + status + owners).
AC18. Memory transfer: ticking until a `memory_query` event fires yields a ticker entry and,
      with the overlay open, a transfer pulse element; the requesting unit's held-pieces
      highlight count increases.
AC19. Hierarchy: a parent task renders a child-count pip and connector paths to ≥2 children;
      selecting the parent lists children in the SelectionPanel; right-click dispatching a unit
      onto the parent results in the unit assigned to one of its children (link line + event).
AC20. Process tab: for a working unit, the Inspector `Process` tab shows a stage pipeline with
      exactly one current stage, an ObservedRunState badge reading `waiting`, and a journal list
      that grows over ticks; when an approval is pending, `breakpoint ×1` chip appears.
AC21. Foundry: commissioning a task (kind `fix`, default title) adds a queued task node on the
      map and a ticker entry; forging an agent (adapter `codex`) adds a unit in staging whose
      portrait SVG is non-empty; both survive `tick(10)` and are selectable.
AC22. Workspace tab: a working unit's `Workspace` tab lists ≥2 changed files with status
      letters; clicking the first shows a diff plate containing both an addition row and a
      deletion row; the header shows branch and a dirty badge.
AC23. Write-back approval: when a write-back approval is pending, `ws-approve` applies the patch
      (workspace dirty badge clears, approval-resolved event logged, task state advances) and
      `ws-reject` (on a fresh pending approval) returns the unit to working with a feedback
      event.
AC24. Style-safety: with the v2 theme, document-wide `<line>`/`<polyline>` census still equals
      the LinkLayer count (memory edges + hierarchy connectors are `<path>`), and same-seed
      reload still yields byte-identical unit portraits (v2 avatar style).

## V2-9. Constraints

All SPEC.md constraints persist: dependency allowlist (no additions), TypeScript strict, no
`any`, path-only icons, `<line>/<polyline>` reserved for LinkLayer, determinism (no Date.now()
in sim/game state paths), one store commit per tick, ≤12 command specs, min-width gate, no
routing (tabs/overlays are component state), no emoji. New keyboard keys (M, N) must not
conflict with the existing grammar (M/N are currently unbound; they act only when no modal is
open and not typing in an input). The frozen v1 e2e suite and the new frozen v2 suite both gate
every later phase.
