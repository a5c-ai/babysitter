# A5C Commander v5 — Session Forensics & The Registry (delta spec)

**Relationship:** EXTENDS SPEC.md + V2 + V3 + V4; where V5 conflicts, **V5 wins**. Everything
else persists. No frozen-test amendments are sanctioned — v5 is purely additive; all 30
existing frozen tests must keep passing unchanged.

---

## V5-1. Persistent sessions & subsessions

Today an agent's transcript dies with its despawn. v5 makes sessions durable, mirroring the
adapters `SessionEntry`/`SessionSummary` family and kradle `AgentSession`:

- Every spawned agent creates a **SessionRecord** that PERSISTS after despawn:
  `{ sessionId (= unitId), title (creature name + role), agent (adapter), model, stackRef,
  stackName, role: worker|reviewer|integration, taskId, attempt, runId,
  parentSessionId?: string, reviewOfSessionId?: string, status: active|completed|aborted,
  startedTick, endedTick?, turnCount, messageCount, tokenUsage, cost }` plus the full
  transcript (messages + tool calls, ring-capped ~200 entries per session).
- **Subsession links** (deterministic):
  (a) STACK cards: each child-card worker session carries `parentSessionId` = the parent
  card's coordination session (the parent card now records a lightweight coordination
  session per attempt that logs child assignment/completion events);
  (b) reviewer sessions carry `reviewOfSessionId` = the worker session they judged;
  (c) integration sessions carry `parentSessionId` = the approving review session when one
  exists (else the worker session).
- Sim views: `listSessions(taskId?)` (all sessions, or that card's, newest first) and
  `getSession(sessionId)` (record + transcript). Same seed ⇒ identical session ids, names,
  link structure.

## V5-2. Sessions tab — inspect work already in review

The Inspector gains a **Sessions** tab (`data-testid="inspector-tab-sessions"`), available for
EVERY card in EVERY column (it becomes the default tab for agent-less cards in ai-review/
human-review/approved/merged/in-production, ahead of Process):

- Lists the card's sessions grouped by attempt: role badge (worker/reviewer/integration),
  creature portrait, stack name, status chip, turns/tokens/cost, started→ended ticks.
  Subsessions render NESTED (indented, connector bracket) under their parent session;
  reviewer rows show a "reviewed ⟶ <session>" link chip.
- Row testid `session-row-<sessionId>`. Clicking a row opens the **session transcript view**
  inside the tab (`data-testid="session-transcript"`): the full read-only transcript (same
  bubble components as the live Transcript tab, plus the resolved-inquiry bubbles), with a
  back link to the list. Clicking a `reviewOf`/parent link navigates between sessions.
- The live Transcript tab remains for cards with an ACTIVE agent; the Sessions tab shows the
  active session at the top of the list (status `active`, opening it shows the live growing
  transcript).
- The review panel (§V4-4) gains a small "Sessions" link chip that deep-links to this tab.

## V5-3. The Registry — kradle-style entity separation

A new TopBar button **Registry** (`data-testid="topbar-registry"`) opens a full-screen ledger
overlay (`data-testid="registry-overlay"`, same family as the Runs overlay; joins the Esc
cascade top tier) that separates the entity kinds the way kradle does — config vs execution
resources — with a tab per kind (`data-testid="registry-tab-<kind>"`, kinds: `stacks`,
`agents`, `tasks`, `workspaces`; the existing Runs overlay remains the home of runs/processes
and the registry cross-links to it):

- **Stacks** (config, mirrors `AgentStack`): every stack (seeded + forged) with adapter,
  model, approvalMode, personality excerpt, phase badge — detail view shows the full
  spec (prompt.system/developer verbatim plates) AND the sessions it spawned (cross-links),
  plus an "open in Foundry" affordance.
- **Agents** (execution, mirrors `AgentSession`): ALL sessions ever (active highlighted,
  completed inked, aborted garnet), columns: portrait+name, role, stack (link), task (link),
  status, turns, tokens, cost. Detail view = the same session transcript component as §V5-2,
  plus link chips to its task, run, workspace, stack, parent/review sessions.
- **Tasks** (execution, mirrors `AgentDispatchRun`): every card with kind, column, attempt
  count, yolo, stack, workspace; detail view: hierarchy (parent/children links), its sessions
  list (nested as in §V5-2), its runs (link into the Runs overlay detail), workspace summary.
- **Workspaces**: each workspace with gitStatus (branch/sha/dirty), phase, its cards and
  active sessions; detail view: changed files + link chips.
- Every cross-link navigates WITHIN the registry (breadcrumb back stack,
  `data-testid="registry-back"`), except run links which open the Runs overlay detail.
- Row testids: `registry-row-<id>` (id = stackRef | sessionId | taskId | workspaceId).

## V5-4. Entity separation on the board surfaces

- SelectionPanel single-card view: the attending agent line now renders TWO distinct
  affordances — the SESSION (creature name, "view session" → Sessions tab) and its STACK
  (stack name chip, "view stack" → Registry stack detail) — making instance vs template
  explicit (`data-testid="sel-session-link"` / `data-testid="sel-stack-link"`).
- Agent avatar tooltip/title shows "<creature name> — session of <stack name>".
- The Inspector agent header's stack chip (v4) becomes a link to the Registry stack detail.

## V5-5. New acceptance criteria (e2e/v5-*.spec.ts; purely additive)

AC46. A card in HUMAN REVIEW (agent-less): Inspector opens with the Sessions tab; it lists
      ≥2 sessions (a worker and a reviewer) with role badges and status chips; opening the
      worker session shows a non-empty read-only transcript (despite despawn); back link
      returns to the list.
AC47. Subsessions: for a stack parent card that has worked, the parent's Sessions tab nests
      child worker sessions under the coordination session (indentation/bracket present);
      a reviewer row carries a reviewed-link chip that navigates to the worker session.
AC48. Registry: `topbar-registry` opens `registry-overlay`; the stacks tab lists ≥4 stacks;
      the agents tab lists both active AND completed sessions; clicking a session row opens
      its transcript detail with link chips; clicking its stack chip navigates to the stack
      detail (breadcrumb back works).
AC49. Registry tasks tab: a worked card's detail shows its sessions and a run link; the
      workspaces tab lists workspaces with branch + dirty state and linked cards.
AC50. Board separation: with a working card selected, the SelectionPanel shows both
      sel-session-link and sel-stack-link; the session link opens the Sessions tab on that
      card; the stack link opens the Registry stack detail.
AC51. Determinism + census: same-seed reload yields identical session ids and names
      (compare two boots); zero <line>/<polyline> document-wide with the registry and
      sessions surfaces open.

## V5-6. Constraints

All prior constraints hold (allowlist, path-only, no emoji, ≤12 commands, determinism, Esc
cascade — registry joins the top tier alongside runs/foundry/archive). Session persistence
must not unbound memory: per-session transcript ring ~200 entries, global session count is
naturally bounded by attempts. The v4 residual punch list (release-train stagger off the
animation clock so a paused sim never strands the train; duplicated review-header status
strip; foundry footer chips; terminal pre-echo; archive zoom-to-content clamp; card-editor
footer embossing) SHOULD be burned down during the v5 polish phase.
