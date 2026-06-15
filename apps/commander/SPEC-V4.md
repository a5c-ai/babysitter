# A5C Commander v4 — Release Rail, Foundry Deep, Cogitator Tooling (delta spec)

**Relationship:** EXTENDS SPEC.md + SPEC-V2.md + SPEC-V3.md; where V4 conflicts, **V4 wins**.
Everything else persists (cogitator language, board grammar, inquiry dock, review panel,
archive, process tab, determinism rules, allowlist, path-only SVG, no emoji).

**Frozen-suite amendments sanctioned by this spec** (user-mandated product change): AC25's
five-column assertion becomes seven columns; AC30/AC31's merged-seal-inside-approved becomes
the Merged column flow (§V4-1). The e2e author updates exactly those assertions (documented),
retires nothing else, and may raise tickUntil budgets for the slower pacing (§V4-4) — budgets
are not semantic assertions. All other v2/v3 tests must keep passing unchanged.

---

## V4-1. The release rail — Merged and In Production columns

The board gains two lanes, total seven: `backlog, do, ai-review, human-review, approved,
merged, in-production` (testids `kanban-col-merged`, `kanban-col-in-production`). Semantics:

- **Approved** = integration in progress (agent rebases/fixes conflicts as in V3). When
  integration completes, the card AUTO-MOVES to **Merged** (the merged seal now lives there;
  Approved no longer holds terminal cards). Merged = the change is live on **staging**.
- **Merged card** contextual command **`Revert`** (danger): reverts the change from staging —
  the card animates back to **DO** with a `reverted` feedback event and a fresh worker
  iterates. (Sim verb `revertCard(taskId)`.)
- **Merged COLUMN command `Release`**: a brass lever control in the lane header
  (`data-testid="col-release"`, enabled when the lane is non-empty): promotes ALL merged cards
  to **In Production** as one release train (staggered glide animation, `release_shipped`
  events, deterministic release id `rel-NN`). Also exposed as a contextual command when a
  merged card is selected. (Sim verb `release()`.)
- **In Production card** contextual command **`Rollback`** (danger): removes it from
  production back to **Merged** (staging) with a `rolled_back` event. In-production cards are
  terminal otherwise; they compact to slim rows after 30 ticks with a small crown seal.

## V4-2. Bug fix — drag stacking order

While dragging, the card must render ABOVE all lanes and HUD chrome: render the drag ghost
into a top-level layer (portal to body or a board-root overlay layer with z-index above
panels). AC: during an active drag the moving card's effective stacking context places it
topmost (no lane or highlight may occlude it).

## V4-3. Bug fix — Inspect retargeting

`Inspect` (command, double-click, ticker click) while the Inspector is already open MUST
retarget the open Inspector to the new entity (header + tabs re-render for it), preserving the
currently selected tab when the new entity supports it (else falls back to Transcript/Process
per V3 rules).

## V4-4. Simulation pacing + speed control

Default real-time auto-tick interval slows from 250ms to **800ms**, and lifecycle phase
durations roughly double (a card should take ~1.5–3 sim-minutes through Do). `tick(n)` test
semantics are unchanged. TopBar gains a **speed control** (`data-testid="topbar-speed"`)
cycling 0.5× / 1× / 2× (interval 1600/800/400ms; label shows current). The sim exposes
`tickIntervalMs` and `speed` on the test-hooks API. Pause behavior unchanged.

## V4-5. Card editor + Agent Stacks foundry (kradle personalities)

- **Card editor**: `Edit Card` command on any non-merged card (and an edit affordance in the
  SelectionPanel) opens a parchment form dialog (`data-testid="card-editor"`): title, kind
  (select), description (textarea), yolo, parent task (select; legal only while in backlog),
  workspace, and **agent stack** (select, §below). Saving applies via sim verb
  `updateTask(taskId, patch)` (deterministic, evented `task_updated`); board re-renders.
- **Agent Stacks** mirror kradle `AgentStack` (SPEC-V2 §V2 source-of-truth): spec
  `{ baseAgent, adapter, provider?, model, prompt { system, developer }, approvalMode,
  toolProfileRef?, skillRefs?, subagentRefs?, runnerPool? }` + metadata/status.phase. The sim
  seeds 4 stacks (one per adapter family) with distinct **personalities** (prompt.system —
  e.g. a meticulous reviewer, a bold refactorer). Spawning a worker for a card uses the card's
  `stackRef` (defaults derived from taskKind mapping as in V3; the mapping now selects a
  STACK). Agent portraits derive from stack identity so personality shows.
- **Foundry gains a `Stacks` tab** (`data-testid="foundry-stacks"`): list seeded + custom
  stacks (name, adapter, model, personality excerpt, phase); **Forge From** any existing stack
  (clone-as-template, "create agents from agents"); edit name/adapter/model/approvalMode and
  the personality prompts (system/developer textareas); save via sim verb
  `upsertStack(stack)` (`stack_forged` event, deterministic ids `stk-cNN`). New stacks appear
  in the card editor's stack select and are honored on next spawn.

## V4-6. Runs & process management

Mirror babysitter surfaces (contracts already exist in contracts/babysitter-run.ts):

- **Runs view**: TopBar `Runs` button (`data-testid="topbar-runs"`) opens a full-screen
  parchment ledger (`data-testid="runs-overlay"`): table of ALL runs (per card attempt):
  runId, card, kind, processId, ObservedRunState badge, phases progress, pending effects,
  tokens/cost, started/ended. Clicking a row opens **run detail** (`run-detail`): the phase
  pipeline, pendingEffectsByKind, and the full journal (seq, type, label, time) with
  auto-follow — the V2-5 inspector Process tab, promoted and reusable (share components).
- **Process management**: a `Processes` tab inside the runs overlay
  (`data-testid="process-library"`): lists the per-taskKind phase pipeline TEMPLATES
  (processId `commander/<kind>@vN`, phases with labels). Editing (`process-editor`): rename /
  add / remove / reorder phases of a template (≥2 phases enforced); saving bumps the template
  revision (`process_updated` event) and **affects the NEXT run created** for that kind
  (running runs keep their pinned revision — record `processRevision` on each run).
  Sim verb `updateProcessTemplate(kind, phases)`.

## V4-7. Terminal tab

New contextual command **`Terminal`** for any card with a workspace (and agents): opens a new
Inspector tab (`data-testid="inspector-tab-terminal"`) — a cogitator terminal plate (dark
slate, amber mono text, block cursor) bound to that session's workspace. A small deterministic
shell over sim state (no real exec): `help`, `pwd`, `ls [dir]` (workspace file tree),
`cat <path>` (file content per §V4-8 content model), `git status` (changed files), `git diff
[path]` (the diff plates' text), `git log` (journal-derived commits), `npm test` (replays
testEvidence with a brief spinner), `clear`, history via ArrowUp. Unknown commands answer in
character ("the cogitator does not know this incantation"). Testid for the input:
`terminal-input`; output region `terminal-output`.

## V4-8. Workspace file model (enables terminal + IDE)

The sim exposes a deterministic workspace FILE TREE per task: `getWorkspaceTree(taskId)` →
nested `{name, path, type: 'dir'|'file', children?}` (8–20 plausible files per repo layout per
task kind) and `getFileContent(taskId, path)` → string (deterministic content, 20–80 lines,
consistent with the changed-file diffs: changed files' content reflects their diff hunks
applied). Same seed ⇒ identical trees/contents.

## V4-9. Memory I/O tab

New Inspector tab (`data-testid="inspector-tab-memory"`) for agents/cards: two ledger sections
— **Read** (pieces obtained via memory_query: record id, kind badge, silo, tick) and
**Written** (memory_update proposals: changes, target silo, phase) — each rendered as a mini
graph strip (nodes + <path> edges, reusing archive node visuals) plus list rows. Clicking a
piece deep-links into the Archive overlay focused on that node.

## V4-10. Archive graph usability overhaul

The Archive overlay becomes navigable: **wheel zoom + drag pan** on the graph canvas (clamped),
**search box** (`data-testid="memory-search"`) filtering/highlighting nodes by title/id with
match count, layout clustered BY SILO (distinct sectors with clear gutters, silo captions on
the canvas), node labels that appear at zoom ≥1 (and on hover always), edge decluttering
(only intra-cluster + selected-node edges at low zoom; full edges on focus), a reset-view
button. Keep determinism (layout from seed; zoom/pan are view-only) and <path>-only edges.

## V4-11. Web IDE (light) + Open in IDE

- Review panel gains **`Open in IDE`** (`data-testid="review-open-ide"`); also available as a
  contextual command on human-review/do cards.
- IDE overlay (`data-testid="ide-overlay"`, full-screen plate, Esc closes — top of cascade
  with foundry/archive/runs): left **explorer** (`ide-explorer`, the §V4-8 tree, dirs
  collapsible, changed files badged A/M/D), center **multi-tab editor** — opening files adds
  tabs (`ide-tab-<sanitized-path>`, close buttons, dirty dot), content in an editable buffer
  with **syntax highlighting** for ts/tsx/js/json/css/md (hand-rolled regex tokenizer to CSS
  token spans — comments/strings/keywords/numbers/types; no new deps; highlight layer behind a
  transparent textarea is the recommended architecture), engraved line numbers, current-line
  tint.
- **Copilot-style ghost completion**: after ~400ms idle with the caret at line end, the mock
  microagent (`suggestCompletion(context) → string` — new Microagent member, deterministic
  from file path + preceding line) renders inline ghost text (`data-testid="ide-ghost"`);
  **Tab accepts**, Esc dismisses, typing re-triggers. Edits are session-local (sim verb
  `writeFile(taskId, path, content)` updates the workspace view + dirty badges; diff plates
  reflect it).

## V4-12. New acceptance criteria (e2e/v4-*.spec.ts; plus the sanctioned AC25/AC30/AC31
amendments noted in the header)

AC34. Seven lanes render with testids; an approved card completing integration AUTO-moves to
      `merged` carrying the merged seal (no terminal cards remain in approved).
AC35. Merged card `Revert` returns it to DO (reverted event, fresh worker); `col-release`
      ships ALL merged cards to `in-production` (staggered is-moving, release event); an
      in-production card `Rollback` returns it to merged.
AC36. During an active pointer drag the dragged card is topmost: elementFromPoint at the
      card's center returns the drag ghost (not a lane), and no occlusion class applies.
AC37. With the Inspector open on entity A, invoking Inspect on entity B retargets the open
      Inspector (header shows B) without closing/reopening; selected tab preserved when valid.
AC38. `topbar-speed` cycles 0.5x/1x/2x and `sim.tickIntervalMs` reflects 1600/800/400; default
      is 800; pause + tick(n) determinism unaffected (board snapshot equality on same script).
AC39. `card-editor` opens from the Edit Card command; changing title + kind + yolo persists to
      the card; stack select lists seeded + custom stacks.
AC40. `foundry-stacks` lists 4 seeded stacks; Forge From clones one; editing personality
      (system prompt) and saving yields a new `stk-cNN` stack that appears in the card editor
      and is used by the next spawn for a card bound to it (agent's stack visible in
      Inspector header).
AC41. `topbar-runs` opens `runs-overlay` listing ≥1 run with state badges; row click opens
      `run-detail` with phase pipeline + growing journal; `process-library` tab lists kind
      templates; renaming a phase in `process-editor` bumps revision and the NEXT run for that
      kind shows the renamed phase (existing runs unchanged).
AC42. Terminal: the Terminal command opens `inspector-tab-terminal`; `ls` lists tree roots,
      `git status` lists changed files, `cat <changed file>` prints content containing the
      diff's added text; unknown command answers in character.
AC43. `inspector-tab-memory` shows Read and Written sections with ≥1 piece each (tick until
      memory events occurred); clicking a piece opens the Archive focused on that node.
AC44. Archive: wheel zoom changes scale (clamped), drag pans, `memory-search` filters with
      match count, silo cluster captions visible, reset-view restores.
AC45. IDE: `review-open-ide` opens `ide-overlay`; explorer shows the tree with changed-file
      badges; opening two files yields two tabs with token-span highlighting; typing at line
      end surfaces `ide-ghost` and Tab accepts it (buffer contains the suggestion; dirty dot
      appears); Esc closes the IDE (cascade respected).

## V4-13. Constraints

No new dependencies (the IDE highlighter and terminal are hand-rolled). All new verbs are
deterministic and journaled in the frame stream (same seed + verb script ⇒ identical state —
extend the determinism tests). Zero <line>/<polyline>. New overlays join the Esc cascade ahead
of steer/inspector. ≤12 command specs holds (kind sets trim for the new staples Terminal /
Edit Card / Open in IDE per column priority). The v3 residual design punch list (diff edge
fade-mask, Comms/Selection plate etching, monocle crest charm, card medallion variants,
top-bar right-cluster spacing, archive canvas watermark) SHOULD be addressed during the v4
design-polish phase.
