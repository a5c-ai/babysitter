# A5C Commander v3 — The Cogitator Board (kanban pivot, delta spec)

**Relationship to SPEC.md and SPEC-V2.md:** this document EXTENDS both and SUPERSEDES the
free-roam RTS canvas. Where V3 conflicts with V1/V2, **V3 wins**. Everything not superseded
persists — notably: the Aegis Cogitator visual language (V2-1), deep contextual commands (V2-2,
with column added to the context), the memory system + Archive overlay (V2-3, AC17/AC18),
task hierarchy data model (V2-4, now rendered as subtask stacks), the babysitter process-flow
inspector tab (V2-5, AC20), workspace/diff contracts (V2-7, re-surfaced per §V3-5), the
dependency allowlist, determinism rules, test hooks API, and the no-emoji rule.

**RETIRED by V3** (the v1 e2e tests covering these are retired with documented mapping):
the world map canvas, camera pan/zoom, minimap, marquee selection, right-click dispatch/rally,
unit staging rows, control groups, F idle-cycle, LinkLayer, PingLayer, the idle-unit command
set (no idle agents exist anymore), and the Forge Agent tab (agents are never created manually).
With LinkLayer gone the SVG census rule simplifies: **zero `<line>`/`<polyline>` elements
document-wide, always.** Still-valid v1 behaviors (boot counters, icon determinism, ticker,
inspector transcript, steer modal, Esc cascade, sim test hooks, viewport gate) persist.

---

## V3-1. The board

The entire canvas is a kanban board (`data-testid="kanban-board"`) of five columns, styled as
brass-framed parchment lanes with etched small-caps headers and card-count chips
(`data-testid="kanban-col-<id>"`, ids: `backlog`, `do`, `ai-review`, `human-review`,
`approved`):

```
| BACKLOG | DO (work) | AI REVIEW | HUMAN REVIEW | APPROVED (integrate) |
```

**Cards are tasks** (`data-testid="card-<taskId>"`): wax-seal kind icon, serif title, kind chip,
progress ring, yolo toggle (`data-testid="card-yolo-<taskId>"`), workspace dirty badge, and an
**agent slot** where the attending clockwork creature appears (`data-testid="card-agent-<unitId>"`).
Subtasks (V2-4 hierarchy) render as a **stack**: parent card on top, children as attached
mini-cards fanned beneath; the parent's progress aggregates children. Dragging a parent drags
the whole stack. Clicking a card selects it (SelectionPanel + contextual CommandCard as before);
double-click opens the Inspector.

**Drag & drop:** pointer-based (pointerdown/move/up — no DnD library), lift shadow + tilt on
drag, drop-target lanes highlight with amber glow, snap-back on invalid drop. The USER may drag:
backlog → do (start work); human-review → do / ai-review / approved (verdict by drag); any
backlog reordering. All other movement is automatic. Each user drag issues a sim verb
(`moveCard(taskId, column)`) so state stays sim-owned and deterministic.

## V3-2. Agent lifecycle — spawn on demand, never idle

There are NO idle agents and no pre-spawned fleet. Agents exist only while attached to a card:

- **Card enters DO** (user drag, or rejection bounce-back): the sim spawns a worker agent of the
  adapter mapped from the task kind and attaches it to the card with a materialize animation
  (gears assemble, ~500ms). Mapping: implement/fix/migrate → claude-code; review → codex;
  root-cause-analysis/test-coverage → pi; docs/research → gemini-cli; polish/deploy → codex.
  Children of a stack each get their own worker (parent card shows up to 3 attending avatars +
  overflow count).
- The agent **works automatically** (no dispatch command needed): transcript streams, process
  phases advance (V2-5), workspace changes accumulate (V2-7), tokens burn.
- **Work complete → card auto-moves to AI REVIEW** (V3-3 animation); the worker despawns
  (dissolve animation) and 1–2 REVIEWER agents (distinct adapter from the worker) spawn and
  attend automatically.
- **AI review verdict** (deterministic per seed): PASS → if the card is yolo-flagged, auto-move
  to APPROVED; otherwise auto-move to HUMAN REVIEW. REJECT → auto-move back to DO with a
  feedback event (ticker + transcript); a fresh worker spawns and iterates.
- **HUMAN REVIEW:** no agents attend. The user reviews (V3-4 side panel) and verdicts by drag
  (→ approved / → do / → ai-review) or by the panel's Approve All button.
- **APPROVED:** an INTEGRATION agent spawns and visibly merges — rebase onto base branch,
  conflict-fix events when the sim rolls conflicts, integration test event — ending in a
  **merged** terminal state (brass seal stamps the card, agent despawns). Merged cards compact
  to a slim row at the column bottom.
- Agents despawn whenever their card leaves their column. The TopBar units counter now means
  "active agents" and is 0 at boot (sim starts with all cards in backlog — no auto-started work;
  the boot scenario places 2 stacks + several singles in backlog).

## V3-3. Automatic movement — slick animations

Automatic column transitions animate: the card lifts, glides along an arc to its destination
lane slot (FLIP-style transform animation, ~600ms ease-in-out, faint brass trail), and settles
with a soft bounce; the lane header chip ticks. While animating, the card carries an
`is-moving` class (e2e hook). Spawn = gear-assemble in the agent slot; despawn = dissolve to
sparks. Respect `prefers-reduced-motion` (transitions collapse to instant with a brief glow).

## V3-4. Human review side panel

Clicking a card in HUMAN REVIEW opens a right side panel (`data-testid="review-panel"`):
header (task title, branch, short sha, test-evidence chip, ahead/behind), the changed-file list
(V2-7 shapes, `data-testid="ws-file-<index>"`), inline diff plates (verdigris additions, garnet
deletions, engraved line numbers), reviewer notes (the AI reviewers' summary comments), and an
approval bar: `Approve All` (`data-testid="review-approve-all"`) → card animates to APPROVED;
`Request Changes` with a feedback text field → card animates to DO. The panel is the V2-7
workspace surface re-homed; the Inspector Workspace tab remains for cards in other columns.

## V3-5. Breakpoint inquiries — option palettes (supersedes approve/deny-only)

Breakpoints are general questions, not just approvals. The sim emits inquiries mirroring the
gateway `hook.request` envelope, with payload extended:

```ts
interface InquiryPayload {
  question: string;                       // "Choose the migration strategy for adr-..."
  options: InquiryOption[];               // 2-5 options
}
interface InquiryOption {
  id: string;                             // 'expand-contract'
  caption: string;                        // short: 'Expand-Contract'
  detail?: string;                        // one-line tooltip
  icon: IconSpec;                         // microagent-generated, path-only
  tone?: 'normal' | 'danger' | 'primary';
}
```

The answer posts `hook.decision` extended with `optionId` (decision 'allow' + optionId; the
legacy approve/deny is the degenerate 2-option case `[Proceed, Stand Down]`). **Surfaces:**
(a) the **Inquiry Dock** (`data-testid="chat-dock"`, bottom-left above the ticker, replacing the
AlertBanner role): a chat-like stack of inquiry bubbles (`data-testid="inquiry-<hookRequestId>"`)
— question text + a row of option buttons, each an icon ABOVE a short caption
(`data-testid="inquiry-opt-<hookRequestId>-<optionId>"`), AskUserQuestion-style; (b) the same
bubble appears inline in the owning agent's Inspector transcript. Choosing an option resolves
the inquiry everywhere, logs the chosen caption to the ticker, and the sim visibly branches on
the option (different follow-up events/phase labels per option — deterministic). Sim variety:
strategy choices, fix-approach choices, dependency-version choices, and classic tool approvals.
The microagent generates each option's icon (engraved-brass glyph family).

## V3-6. New acceptance criteria (AC25–AC33; authored as e2e/v3-*.spec.ts; retired v1 specs
move OUT of the active suite with a mapping note)

AC25. Board boot: 5 columns with testids; backlog holds ≥5 cards including ≥1 stack with ≥2
      mini-children; ZERO agent avatars anywhere; topbar units counter reads 0.
AC26. Drag to DO: pointer-dragging a backlog card to DO lands it there; an agent avatar spawns
      in its slot with adapter per the V3-2 mapping (assert via data-adapter attr or class);
      work events for that task start appearing in the ticker.
AC27. Auto-move: when the work completes (tickUntil), the card moves to AI REVIEW without user
      action — during the move it carries the is-moving class; the worker avatar is gone and a
      reviewer avatar (different adapter) appears.
AC28. Review verdicts: a non-yolo card passing AI review lands in HUMAN REVIEW (no agents
      attached); a rejected card returns to DO with a feedback ticker event and a fresh worker.
AC29. Yolo: with a card's yolo toggle ON before review completes, passing AI review lands it in
      APPROVED, skipping HUMAN REVIEW.
AC30. Human review panel: clicking a HUMAN REVIEW card opens review-panel with ≥2 changed files
      and a diff containing addition and deletion rows; Approve All animates the card to
      APPROVED; (separate card) dragging from HUMAN REVIEW back to DO works.
AC31. Integration: an APPROVED card shows merge/rebase activity events and reaches the merged
      seal state (class or testid mutation), its integration agent despawning after.
AC32. Inquiry options: tickUntil an inquiry with ≥3 options appears in the chat dock; each
      option button renders an inline SVG icon + caption; clicking one resolves the inquiry
      (bubble clears/archives), logs the caption to the ticker, and a follow-up event names the
      chosen option's path.
AC33. Census + determinism: zero <line>/<polyline> elements document-wide at any point above;
      same-seed reload renders byte-identical card seal icons and (after identical drag
      sequences via sim verbs) identical board states.

## V3-7. Constraints & retained rules

Pointer-based DnD with no new dependencies. All board movement flows through deterministic sim
verbs (user drags included) — same seed + same verb sequence ⇒ identical board. One store commit
per tick batch. M (Archive) and N (Commission Task — the Foundry keeps ONLY this tab) keys
unchanged; Esc cascade: foundry/archive > review panel > steer modal > inspector > selection.
Min-width gate, TypeScript strict, no `any`, path-only SVG everywhere, no emoji, ≤12 command
specs. The CommandContext gains `column`; command sets adapt per column (e.g. human-review card
→ Open Review, Approve All, Request Changes; approved card → Hold Merge, Force Rebase). The v1
suite files that test retired surfaces are MOVED to e2e/retired-v1/ (playwright `testIgnore`)
in the same commit that lands the board — with a mapping table in the commit message; v1 tests
for persisting behaviors are updated only where selectors genuinely moved, never weakened.
